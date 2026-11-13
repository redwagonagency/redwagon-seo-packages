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

# 2b. A/B tests: load version B data up front, swap it in at render time, count the view.
src = sub_once(r"this\.tenantId = tenantId \|\| 1;", lambda m: m.group(0) + "\n      try { this.loadVariants(); } catch (e) {}", src, "variants-load")
src = sub_once(
    r"const content = typeof popup\.content === 'string' \? JSON\.parse\(popup\.content\) : popup\.content;",
    lambda m: "let content = typeof popup.content === 'string' ? JSON.parse(popup.content) : popup.content;\n"
              "      try { var abHtml = this.pickVariant(popup); if (abHtml) content = { html: abHtml }; this.abTrack(popup, 'view'); } catch (e) {}",
    src,
    "variants-render",
)

# 2c. Display formats: slide-in, bars, takeover and inline placement.
src = sub_once(
    r"container\.appendChild\(contentWrapper\);\s*overlay\.appendChild\(container\);\s*document\.body\.appendChild\(overlay\);",
    lambda m: "container.appendChild(contentWrapper);\n"
              "      overlay.appendChild(container);\n"
              "      var oyContent = {};\n"
              "      try { oyContent = (typeof popup.content === 'string' ? JSON.parse(popup.content) : popup.content) || {}; } catch (e) {}\n"
              "      if (!this.applyLayout(overlay, container, closeBtn, oyContent)) document.body.appendChild(overlay);",
    src,
    "layout",
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
        self.abTrack(popup, 'conversion');
        if (root.hasAttribute && root.hasAttribute('data-oy-spin')) { self.spinWheel(wrapper, root); return; }
        done(root);
      }
      wrapper.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(e) { e.preventDefault(); handle(form, true); });
      });
      if (!wrapper.querySelector('form') && !wrapper.querySelector('input[type="email"]')) {
        wrapper.querySelectorAll('a.cta-button').forEach(function(link) {
          link.addEventListener('click', function() { self.abTrack(popup, 'conversion'); });
        });
      }
      if (!wrapper.querySelector('form') && wrapper.querySelector('input[type="email"]')) {
        wrapper.querySelectorAll('button, a.btn, .cta-button').forEach(function(btn) {
          btn.addEventListener('click', function(e) { e.preventDefault(); handle(wrapper, false); });
        });
      }
    },

    // Places the popup according to content.layout. Returns true when it was inserted itself.
    applyLayout: function(overlay, container, closeBtn, content) {
      var layout = (content && content.layout) || {};
      var mode = layout.mode || 'center';
      if (mode === 'center') return false;
      var hideOverlay = function() {
        overlay.style.background = 'transparent';
        overlay.style.pointerEvents = 'none';
        overlay.style.display = 'block';
        container.style.pointerEvents = 'auto';
      };
      if (mode === 'slide') {
        hideOverlay();
        var pos = layout.position || 'bottom-right';
        container.style.position = 'fixed';
        container.style.width = 'min(380px, calc(100vw - 32px))';
        container.style.maxWidth = 'none';
        container.style.margin = '0';
        container.style.boxShadow = '0 16px 48px rgba(0,0,0,0.22)';
        container.style[pos.indexOf('top') === 0 ? 'top' : 'bottom'] = '16px';
        container.style[pos.indexOf('left') >= 0 ? 'left' : 'right'] = '16px';
        container.style.animation = 'oySlideIn 0.4s ease-out';
      } else if (mode === 'bar') {
        hideOverlay();
        var edge = layout.position === 'bottom' ? 'bottom' : 'top';
        container.style.position = 'fixed';
        container.style[edge] = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.maxWidth = 'none';
        container.style.borderRadius = '0';
        container.style.boxShadow = edge === 'top' ? '0 6px 24px rgba(0,0,0,0.18)' : '0 -6px 24px rgba(0,0,0,0.18)';
        container.style.animation = 'oyBarIn 0.35s ease-out';
        var wrap = container.lastElementChild;
        if (wrap) {
          wrap.style.padding = '14px 56px 14px 24px'; wrap.style.maxWidth = '1100px'; wrap.style.margin = '0 auto';
          var shell = wrap.firstElementChild;
          if (shell && /margin:\s*-40px/.test(shell.getAttribute('style') || '')) { shell.style.margin = '0'; shell.style.padding = '10px 0'; shell.style.borderRadius = '0'; }
          wrap.querySelectorAll('h2').forEach(function(h){ h.style.fontSize = '20px'; h.style.margin = '0 0 4px'; });
          wrap.querySelectorAll('p').forEach(function(pp){ pp.style.margin = '0 0 10px'; });
          wrap.querySelectorAll('form').forEach(function(f){ f.style.display = 'flex'; f.style.gap = '10px'; f.style.flexWrap = 'wrap'; f.style.justifyContent = 'center'; });
          wrap.querySelectorAll('form input').forEach(function(i){ i.style.width = 'min(320px, 100%)'; i.style.margin = '0'; });
          wrap.querySelectorAll('form button').forEach(function(b){ b.style.width = 'auto'; b.style.display = 'inline-block'; });
        }
        closeBtn.style.top = '50%';
        closeBtn.style.transform = 'translateY(-50%)';
      } else if (mode === 'takeover') {
        overlay.style.background = layout.background || 'rgba(11,31,43,0.96)';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.maxWidth = 'none';
        container.style.maxHeight = 'none';
        container.style.borderRadius = '0';
        container.style.boxShadow = 'none';
        container.style.background = 'transparent';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        var inner = container.lastElementChild;
        if (inner) { inner.style.width = 'min(640px, 92vw)'; inner.style.background = '#fff'; inner.style.borderRadius = '14px'; inner.style.boxSizing = 'border-box'; }
        closeBtn.style.background = 'rgba(255,255,255,0.18)';
        closeBtn.style.color = '#fff';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '24px';
      } else if (mode === 'inline') {
        var target = null, where = 'afterend';
        if (layout.selector) {
          try { target = document.querySelector(layout.selector); } catch (e) { target = null; }
          where = layout.placement === 'before' ? 'beforebegin' : (layout.placement === 'inside' ? 'beforeend' : 'afterend');
        } else {
          var n = Math.max(1, parseInt(layout.afterParagraphs, 10) || 3);
          var scope = document.querySelector('article') || document.querySelector('main') || document.body;
          var paras = scope.querySelectorAll('p');
          target = paras[Math.min(n, paras.length) - 1] || null;
        }
        if (!target) return false; // fall back to a centered popup
        var wrapper = document.createElement('div');
        wrapper.id = overlay.id;
        wrapper.className = 'oy-inline';
        wrapper.style.cssText = 'margin:28px 0;';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.maxWidth = 'none';
        container.style.maxHeight = 'none';
        container.style.animation = 'none';
        container.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10)';
        container.style.border = '1px solid rgba(0,0,0,0.06)';
        if (layout.closable === false) closeBtn.style.display = 'none';
        wrapper.appendChild(container);
        target.insertAdjacentElement(where, wrapper);
        return true;
      }
      if (!document.getElementById('oy-layout-style')) {
        var st = document.createElement('style');
        st.id = 'oy-layout-style';
        st.textContent = '@keyframes oySlideIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}' +
          '@keyframes oyBarIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}' +
          '@media (prefers-reduced-motion: reduce){#' + overlay.id + ' *{animation:none !important}}';
        document.head.appendChild(st);
      }
      return false;
    },

    loadVariants: function() {
      var self = this;
      if (!this.tenantId || !window.fetch) return;
      fetch(this.baseUrl + '/api/ab/variants?tenantId=' + encodeURIComponent(this.tenantId))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) { self.abData = (d && d.variants) || {}; })
        .catch(function() { self.abData = {}; });
    },

    // Returns version B's HTML when this visitor is in group B; remembers the group per popup.
    pickVariant: function(popup) {
      popup._ab = null;
      var entry = this.abData && this.abData[popup.id];
      if (!entry || !entry.html) return null;
      var key = 'oy_ab_' + popup.id, group = null;
      try { group = window.localStorage.getItem(key); } catch (e) {}
      if (group !== 'A' && group !== 'B') {
        group = Math.random() < 0.5 ? 'A' : 'B';
        try { window.localStorage.setItem(key, group); } catch (e) {}
      }
      popup._ab = group;
      return group === 'B' ? entry.html : null;
    },

    abTrack: function(popup, eventName) {
      if (!popup || !popup._ab || !window.fetch) return;
      try {
        fetch(this.baseUrl + '/api/ab/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ popupId: popup.id, variant: popup._ab, event: eventName }),
          keepalive: true
        }).catch(function() {});
      } catch (e) {}
    },

    spinWheel: function(wrapper, form) {
      var box = wrapper.querySelector('[data-oy-wheel]'), disc = wrapper.querySelector('[data-oy-wheel-disc]');
      var prizes = [];
      try { prizes = JSON.parse(box.getAttribute('data-oy-wheel')) || []; } catch (e) {}
      if (!disc || !prizes.length) return;
      var total = 0, i = 0, step = 360 / prizes.length;
    prizes.forEach(function(p){ total += (typeof p.weight === 'number' ? p.weight : 1); });
    var roll = Math.random() * total;
    for (var k = 0; k < prizes.length; k++) { roll -= (typeof prizes[k].weight === 'number' ? prizes[k].weight : 1); if (roll < 0) { i = k; break; } }
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
