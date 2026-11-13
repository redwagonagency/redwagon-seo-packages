"""Patch popup-engine.js: real lead capture + correct API origin on third-party sites."""
import re
import sys

path = sys.argv[1]
src = open(path, encoding="utf-8").read()

if "wireLeadCapture" in src:
    print("already patched")
    sys.exit(0)


def sub_once(pattern, repl, text, label):
    new, n = re.subn(pattern, lambda m: repl(m), text, count=0, flags=re.S)
    if n != 1:
        sys.exit("patch point %r matched %d times (expected 1)" % (label, n))
    return new


# 1. When the script runs on a customer's site, API calls must go to the server
#    that served the script, not to the customer's own origin.
ORIGIN_JS = """const allScripts = document.getElementsByTagName('script');
    for (let i = 0; i < allScripts.length; i++) {
      const s = allScripts[i].src;
      if (s && (s.includes('popup-engine.js') || s.includes('GetTenantScript'))) {
        try { return new URL(s).origin; } catch (e) {}
      }
    }
    return window.location.origin;"""
src = sub_once(r"return window\.location\.origin;", lambda m: ORIGIN_JS, src, "origin")

# 2. Hook lead capture into every rendered popup.
src = sub_once(
    r"// Build popup\s*\n(\s*)container\.appendChild\(closeBtn\);",
    lambda m: "// Lead capture\n%sthis.wireLeadCapture(contentWrapper, popup);\n\n%s// Build popup\n%scontainer.appendChild(closeBtn);"
    % (m.group(1), m.group(1), m.group(1)),
    src,
    "build",
)

# 3. New methods.
METHODS = r"""wireLeadCapture: function(wrapper, popup) {
      var self = this;
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      function collect(root) {
        var data = {};
        root.querySelectorAll('input, select, textarea').forEach(function(el) {
          if (el.type === 'submit' || el.type === 'button' || el.type === 'password') return;
          if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
          var key = el.name || el.id || el.type;
          if (key && el.value) data[key] = el.value;
          if (el.type === 'email' && el.value) data.email = el.value;
        });
        return data;
      }
      function done(root) {
        var custom = root && root.getAttribute ? root.getAttribute('data-success') : null;
        if (custom) { wrapper.innerHTML = custom; return; }
        wrapper.innerHTML = '<div style="text-align:center;padding:30px 10px;">' +
          '<h3 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 10px;">Thank you!</h3>' +
          '<p style="font-size:16px;color:#6b7280;margin:0;">You\'re on the list.</p></div>';
        setTimeout(function() { self.closePopup(popup.id); }, 2500);
      }
      function handle(root, alreadyTracked) {
        var data = collect(root);
        var email = (data.email || '').trim();
        if (!emailRe.test(email)) {
          var field = root.querySelector('input[type="email"]');
          if (field) { field.style.borderColor = '#dc2626'; field.focus(); }
          return;
        }
        data.email = email;
        if (!alreadyTracked) self.track('conversion', popup.id, { formName: 'popup' }, data);
        self.submitLead(popup, data);
        if (root.hasAttribute && root.hasAttribute('data-oy-spin')) { self.spinWheel(wrapper, root); return; }
        done(root);
      }
      wrapper.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(e) { e.preventDefault(); handle(form, true); });
      });
      if (!wrapper.querySelector('form') && wrapper.querySelector('input[type="email"]')) {
        wrapper.querySelectorAll('button, a.btn, .cta-button').forEach(function(btn) {
          btn.addEventListener('click', function(e) { e.preventDefault(); handle(wrapper, false); });
        });
      }
    },

    spinWheel: function(wrapper, form) {
      var box = wrapper.querySelector('[data-oy-wheel]'), disc = wrapper.querySelector('[data-oy-wheel-disc]');
      var prizes = [];
      try { prizes = JSON.parse(box.getAttribute('data-oy-wheel')) || []; } catch (e) {}
      if (!disc || !prizes.length) return;
      var i = Math.floor(Math.random() * prizes.length), step = 360 / prizes.length;
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still) disc.style.transition = 'none';
      disc.style.transform = 'rotate(' + (1800 - (i + 0.5) * step) + 'deg)';
      form.style.visibility = 'hidden';
      setTimeout(function() {
        if (!form.parentNode) return;
        var out = document.createElement('div');
        out.style.cssText = 'text-align:center;';
        var h = document.createElement('p');
        h.style.cssText = 'font-size:20px;font-weight:700;margin:0 0 10px;color:inherit;';
        h.textContent = 'You won: ' + prizes[i].label;
        out.appendChild(h);
        if (prizes[i].code) {
          var c = document.createElement('div');
          c.style.cssText = 'display:inline-block;padding:10px 22px;border:2px dashed #0B1F2B;border-radius:10px;font-size:20px;font-weight:700;letter-spacing:2px;background:#ffffff;color:#0B1F2B;';
          c.textContent = prizes[i].code;
          out.appendChild(c);
        }
        form.parentNode.replaceChild(out, form);
      }, still ? 50 : 4200);
    },

    submitLead: function(popup, data) {
      var payload = {
        tenantId: this.tenantId,
        popupId: popup.id,
        email: data.email,
        firstName: data.firstName || data.firstname || data.first_name || '',
        lastName: data.lastName || data.lastname || data.last_name || '',
        name: data.name || data.fullname || '',
        phone: data.phone || data.tel || '',
        source: window.location.href,
        consent: !!data.consent
      };
      try {
        fetch(this.baseUrl + '/api/leads/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function(err) { console.error('[PopupManager] Lead capture failed:', err); });
      } catch (err) {
        console.error('[PopupManager] Lead capture failed:', err);
      }
    },

    """
src = sub_once(r"closePopup: function\(popupId\) \{", lambda m: METHODS + m.group(0), src, "methods")

open(path, "w", encoding="utf-8").write(src)
print("patched ok")
