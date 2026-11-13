"""Generates the OptinYeti template library: an SQL file that adds templates by cloning the
existing template of the same popup type (so every type-specific option keeps a valid value),
and one SVG thumbnail per template. Run: python3 build_templates.py"""
import html, json, os, re, textwrap

OUT_SVG = os.path.join(os.path.dirname(__file__), "..", "..", "img", "templates")
OUT_SQL = os.path.join(os.path.dirname(__file__), "templates.sql")

# Base rows to clone, by popup type id.
BASE = {"message": 10, "email": 1, "ad": 3, "lightbox": 5, "inline": 9, "spin": 6, "video": 7, "coupon": 8}
PAGE_LOAD, EXIT, SCROLL, DELAY, CLICK, IDLE = range(6)
EVERY, SESSION, DAY, WEEK, MONTH, ONCE = range(6)

def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

T = []
def add(kind, name, desc, cat, head, sub="", btn="", trig=PAGE_LOAD, delay=0, freq=SESSION,
        premium=0, bg="#ffffff", accent="#0F6B6B", text="#0B1F2B", **extra):
    T.append(dict(kind=kind, name=name, desc=desc, cat=cat, head=head, sub=sub, btn=btn, trig=trig,
                  delay=delay, freq=freq, premium=premium, bg=bg, accent=accent, text=text, extra=extra))

E = "Email Collection"
add("email", "Exit-Intent Lead Magnet", "Offer a free guide to visitors who are about to leave", E,
    "Before you go, take the free guide", "The 12-point checklist our customers use every week.", "Send me the guide", EXIT, 0, WEEK, accent="#FF8A3D")
add("email", "Ebook Download", "Trade a download for an email address", E,
    "Get the free ebook", "40 pages of practical tactics, delivered to your inbox.", "Download now", SCROLL, 0, WEEK, bg="#F3F9F9")
add("email", "Webinar Registration", "Fill seats for a live session", E,
    "Save your seat for the live workshop", "Thursday at 1pm ET. Replay sent to everyone who registers.", "Reserve my seat", DELAY, 8000, DAY, 1, bg="#0B1F2B", text="#ffffff", accent="#4DD9D2")
add("email", "Early Access Waitlist", "Collect signups before a launch", E,
    "Be first in line", "Join the waitlist and get access before the public launch.", "Join the waitlist", PAGE_LOAD, 3000, WEEK, accent="#7C3AED")
add("email", "Blog Subscribe", "Turn readers into subscribers mid-article", E,
    "Enjoying this article?", "Get the next one by email. One message a week, no spam.", "Subscribe", SCROLL, 0, WEEK, bg="#FFFBEB", accent="#B45309")
add("email", "Free Shipping Unlock", "Exchange an email for free shipping", E,
    "Unlock free shipping", "Enter your email and we will apply free shipping to this order.", "Unlock it", DELAY, 6000, WEEK, accent="#059669")
add("email", "Back in Stock Alert", "Capture demand for sold-out items", E,
    "Sold out for now", "Leave your email and we will tell you the moment it is back.", "Notify me", PAGE_LOAD, 0, SESSION, bg="#F8FAFC", accent="#0F172A")
add("email", "Free Lesson Signup", "Give away the first lesson of a course", E,
    "Try the first lesson free", "No card needed. Start learning in the next five minutes.", "Start lesson one", DELAY, 10000, WEEK, 1, accent="#2563EB")
add("email", "Podcast Subscribe", "Grow an audience for a show", E,
    "New episodes every Tuesday", "Get each episode and the show notes by email.", "Keep me posted", SCROLL, 0, MONTH, bg="#111827", text="#ffffff", accent="#F59E0B")
add("email", "Consultation Request", "Book discovery calls for a service business", E,
    "Talk to a specialist", "Tell us where to reach you and we will set up a 20-minute call.", "Request a call", EXIT, 0, WEEK, 1, accent="#0F6B6B", CollectPhone=True)
add("email", "SaaS Free Trial", "Start trials from pricing and feature pages", E,
    "Start your 14-day free trial", "Full access. No credit card required.", "Start free trial", DELAY, 15000, WEEK, accent="#FF8A3D")
add("email", "Holiday Gift Guide", "Seasonal list builder", E,
    "The holiday gift guide is here", "Hand-picked ideas for everyone on your list.", "Send me the guide", PAGE_LOAD, 4000, WEEK, bg="#FEF2F2", accent="#B91C1C")
add("email", "Listing Alerts", "Real estate: new listings by email", E,
    "New listings before they hit the portals", "Tell us where to send homes that match your search.", "Send me listings", SCROLL, 0, WEEK, 1, accent="#1D4ED8")
add("email", "VIP Dining Club", "Restaurants and cafes: build a regulars list", E,
    "Join the VIP club", "A free appetizer on your next visit, plus first word on specials.", "Join the club", DELAY, 5000, MONTH, bg="#FFF7ED", accent="#C2410C")

A = "Advertising"
add("ad", "Black Friday Sale", "Site-wide Black Friday promotion", A, "Black Friday starts now", "Up to 60% off everything. This weekend only.", "Shop the sale", PAGE_LOAD, 1500, DAY, bg="#0B0B0B", text="#ffffff", accent="#FACC15")
add("ad", "Cyber Monday Deals", "One-day online deals", A, "Cyber Monday: 24 hours only", "Our lowest prices of the year end at midnight.", "See the deals", PAGE_LOAD, 1500, DAY, bg="#1E1B4B", text="#ffffff", accent="#22D3EE")
add("ad", "Summer Sale", "Seasonal sale announcement", A, "The summer sale is on", "Fresh markdowns on warm-weather favorites.", "Shop summer", DELAY, 4000, DAY, bg="#ECFEFF", accent="#0891B2")
add("ad", "End of Season Clearance", "Clear remaining inventory", A, "Last chance clearance", "Final sizes and colors, priced to go.", "Shop clearance", PAGE_LOAD, 2000, DAY, bg="#FEF2F2", accent="#DC2626")
add("ad", "New Collection", "Announce a new line or collection", A, "The new collection has landed", "See what is new this season.", "Explore the collection", PAGE_LOAD, 2500, WEEK, bg="#FAFAF9", accent="#1C1917")
add("ad", "Free Shipping Weekend", "Short free-shipping promotion", A, "Free shipping all weekend", "No minimum. Ends Sunday at midnight.", "Start shopping", PAGE_LOAD, 2000, DAY, accent="#059669")
add("ad", "Bundle and Save", "Promote a bundle offer", A, "Bundle and save 20%", "Pick any three and the discount applies at checkout.", "Build my bundle", SCROLL, 0, DAY, 1, accent="#7C3AED")
add("ad", "App Download", "Send visitors to your mobile app", A, "Better in the app", "Faster checkout, order tracking and app-only offers.", "Get the app", DELAY, 12000, WEEK, bg="#F0F9FF", accent="#0369A1")
add("ad", "Event Tickets", "Sell tickets or registrations", A, "Tickets are on sale", "Early-bird pricing ends Friday.", "Get tickets", PAGE_LOAD, 3000, DAY, 1, bg="#18181B", text="#ffffff", accent="#F43F5E")
add("ad", "Plan Upgrade Offer", "Upsell existing users to a higher plan", A, "Upgrade and save 25%", "Move to the annual plan this week and keep the discount for good.", "See upgrade options", DELAY, 20000, WEEK, 1, accent="#FF8A3D")
add("ad", "Refer a Friend", "Promote a referral program", A, "Give $20, get $20", "Share your link. You both get credit when they order.", "Get my link", SCROLL, 0, WEEK, bg="#F0FDF4", accent="#15803D")

C = "Coupon"
add("coupon", "10% Off First Order", "Welcome coupon for new visitors", C, "Take 10% off your first order", btn="Get my code", trig=DELAY, delay=5000, freq=ONCE, code="FIRST10", value="10% OFF", bg="#ECFDF5")
add("coupon", "Free Shipping Code", "Free-shipping coupon", C, "Free shipping on us", btn="Reveal the code", trig=DELAY, delay=7000, freq=ONCE, code="SHIPFREE", value="FREE SHIPPING", bg="#EFF6FF")
add("coupon", "Cart Saver 15%", "Recover carts with an exit offer", C, "Wait, here is 15% off your cart", btn="Apply my discount", trig=EXIT, freq=WEEK, premium=1, code="SAVE15", value="15% OFF", bg="#FFF7ED")
add("coupon", "Birthday Treat", "Birthday reward coupon", C, "A birthday treat, on us", btn="Claim my treat", trig=PAGE_LOAD, delay=2000, freq=ONCE, code="BDAY20", value="20% OFF", bg="#FDF2F8")
add("coupon", "Loyalty Reward", "Thank returning customers", C, "Thanks for coming back", btn="Get my reward", trig=PAGE_LOAD, delay=3000, freq=MONTH, premium=1, code="LOYAL15", value="15% OFF", bg="#F5F3FF")
add("coupon", "Student Discount", "Discount for students", C, "Students save 20%", btn="Get the student code", trig=SCROLL, freq=MONTH, code="STUDENT20", value="20% OFF", bg="#FEFCE8")

N = "Notification"
add("message", "Shipping Delay Notice", "Tell shoppers about a delivery delay", N, "Orders are shipping 2 to 3 days later than usual this week. Thanks for your patience.", mtype="warning", pos="top-center", freq=SESSION)
add("message", "Scheduled Maintenance", "Warn users about planned downtime", N, "Scheduled maintenance Sunday 2am to 4am ET. Some features will be unavailable.", mtype="info", pos="top-center", freq=DAY)
add("message", "New Feature Announcement", "Announce a product update", N, "New: export your reports to CSV in one click. Find it under Reports.", mtype="success", pos="bottom-right", freq=ONCE)
add("message", "Free Shipping Threshold", "Remind shoppers of the free-shipping minimum", N, "Free shipping on orders over $50.", mtype="info", pos="top-center", freq=SESSION)
add("message", "Holiday Hours", "Share seasonal opening hours", N, "Holiday hours: closed Dec 25 and Jan 1. Support replies resume the next business day.", mtype="info", pos="bottom-center", freq=DAY)
add("message", "Low Stock Warning", "Create urgency on product pages", N, "Only a few left in stock. Order soon.", mtype="warning", pos="bottom-left", freq=SESSION, premium=1)

G = "Gamification"
add("spin", "Holiday Spin to Win", "Seasonal spin-the-wheel promotion", G, "Spin for a holiday gift", "Every spin wins something.", "Spin the wheel", EXIT, 0, ONCE, 1, bg="#FEF2F2", accent="#B91C1C")
add("spin", "Spin for Free Shipping", "Wheel with shipping and discount prizes", G, "Spin to unlock your offer", "Free shipping, 10% off or a mystery gift.", "Try my luck", DELAY, 8000, ONCE, 1, bg="#EFF6FF", accent="#1D4ED8")

V = "Video"
add("video", "Product Demo Video", "Show a short product walkthrough", V, "See it in action", "A two-minute tour of the product.", "Start free trial", CLICK, 0, EVERY, bg="#0B1F2B", text="#ffffff")
add("video", "Customer Story Video", "Play a customer testimonial", V, "How our customers use it", "Hear it from a team like yours.", "Read the case study", CLICK, 0, EVERY, 1, bg="#111827", text="#ffffff")

add("lightbox", "Lookbook Lightbox", "Open a full-size lookbook or product image", "Media", "Lookbook", trig=CLICK, freq=EVERY)

I = "Content"
add("inline", "Inline Newsletter Box", "Signup box placed inside article content", I, "Get articles like this by email", "One email a week. Unsubscribe any time.", "Subscribe", freq=EVERY, bg="#F3F9F9")
add("inline", "Inline Related Offer", "Offer box placed inside article content", I, "Want the full template pack?", "Download all 12 templates mentioned in this article.", "Get the pack", freq=EVERY, premium=1, bg="#FFF7ED")

# Existing templates get thumbnails too.
EXISTING = [
    (1, "email", "Newsletter Signup - Classic", "Join Our Newsletter", "Get weekly updates delivered to your inbox", "Subscribe Now", "#ffffff", "#0F6B6B", "#0B1F2B"),
    (2, "email", "Newsletter Signup - Modern", "Stay in the Loop", "Subscribe for exclusive content and offers", "Subscribe", "#0F6B6B", "#FF8A3D", "#ffffff"),
    (3, "ad", "Sale Announcement", "Flash Sale!", "Up to 50% off selected items", "Shop Now", "#FFF7ED", "#EA580C", "#0B1F2B"),
    (4, "ad", "Product Launch", "Introducing Our Latest Product", "Be the first to experience it", "Learn More", "#F3F9F9", "#0F6B6B", "#0B1F2B"),
    (5, "lightbox", "Image Lightbox", "Image", "", "", "#ffffff", "#0F6B6B", "#0B1F2B"),
    (6, "spin", "Spin to Win - Discount", "Spin the Wheel!", "Try your luck for a special discount", "Spin", "#ffffff", "#0F6B6B", "#0B1F2B"),
    (7, "video", "YouTube Video Popup", "Watch Our Video", "Learn more about our products", "Get Started", "#0B1F2B", "#FF8A3D", "#ffffff"),
    (8, "coupon", "Welcome Discount", "Welcome! Here's 15% OFF", "", "Get My Code", "#FFF3CD", "#0F6B6B", "#0B1F2B"),
    (9, "inline", "Article CTA", "Ready to get started?", "Join thousands of satisfied customers", "Sign Up Free", "#E9ECEF", "#0F6B6B", "#0B1F2B"),
    (10, "message", "Success Notification", "Your action was successful!", "", "", "#ffffff", "#16A34A", "#0B1F2B"),
    (11, "message", "Cookie Consent", "We use cookies to improve your experience.", "", "", "#ffffff", "#0F6B6B", "#0B1F2B"),
]

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

def jset(pairs):
    parts = []
    for key, value in pairs:
        if isinstance(value, bool):
            parts.append("'$.%s', json('%s')" % (key, "true" if value else "false"))
        elif isinstance(value, (int, float)):
            parts.append("'$.%s', %s" % (key, value))
        else:
            parts.append("'$.%s', %s" % (key, q(value)))
    return "json_set(TypeSpecificOptions, " + ", ".join(parts) + ")"

def row_sql(t, order):
    k, x = t["kind"], t["extra"]
    if k == "email":
        content = {"heading": t["head"], "subheading": t["sub"], "buttonText": t["btn"]}
        opts = [("Heading", t["head"]), ("SubHeading", t["sub"]), ("ButtonText", t["btn"]), ("BackgroundColor", t["bg"]),
                ("TextColor", t["text"]), ("ButtonColor", t["accent"]), ("CollectPhone", bool(x.get("CollectPhone", False))),
                ("SuccessMessage", "Thanks! Check your inbox for the next step.")]
    elif k == "ad":
        content = {"heading": t["head"], "subheading": t["sub"], "buttonText": t["btn"]}
        opts = [("Heading", t["head"]), ("SubHeading", t["sub"]), ("ButtonText", t["btn"]), ("BackgroundColor", t["bg"]), ("ButtonColor", t["accent"])]
    elif k == "coupon":
        content = {"heading": t["head"], "couponCode": x["code"]}
        opts = [("Heading", t["head"]), ("CouponCode", x["code"]), ("DiscountValue", x["value"]), ("ButtonText", t["btn"]),
                ("BackgroundColor", t["bg"]), ("Description", "Use this code at checkout."), ("ExpiryDate", "2027-12-31T00:00:00Z")]
    elif k == "message":
        content = {"message": t["head"], "type": x["mtype"]}
        opts = [("Message", t["head"]), ("MessageType", x["mtype"]), ("Position", x["pos"]), ("AutoDismiss", False)]
    elif k == "spin":
        content = {"heading": t["head"], "subheading": t["sub"]}
        opts = [("Heading", t["head"]), ("SubHeading", t["sub"]), ("ButtonText", t["btn"])]
    elif k == "video":
        content = {"videoUrl": "https://www.youtube.com/embed/YOUR_VIDEO_ID", "heading": t["head"]}
        opts = [("VideoUrl", "https://www.youtube.com/embed/YOUR_VIDEO_ID"), ("Heading", t["head"]), ("Description", t["sub"]), ("CTAText", t["btn"]), ("AutoPlay", False)]
    elif k == "lightbox":
        content = {"imageUrl": "/img/templates/%s.svg" % slug(t["name"])}
        opts = [("ImageUrl", "/img/templates/%s.svg" % slug(t["name"]))]
    else:  # inline
        box = "<div class='inline-cta'><h3>%s</h3><p>%s</p><button class='btn'>%s</button></div>" % (
            html.escape(t["head"]), html.escape(t["sub"]), html.escape(t["btn"]))
        content = {"content": box}
        opts = [("Content", box), ("BackgroundColor", t["bg"])]
    return (
        "INSERT INTO PopupTemplates (Name, Description, Category, Type, Content, Title, Subtitle, CallToAction, ImageUrl, "
        "PreviewImageUrl, DefaultTargetingRules, DefaultTrigger, DefaultDelayMs, DefaultFrequency, IsActive, IsPremium, "
        "SortOrder, TypeSpecificOptions, CreatedAt)\n"
        "SELECT %s, %s, %s, Type, %s, NULL, NULL, NULL, NULL, %s, '{}', %d, %d, %d, 1, %d, %d, %s, "
        "strftime('%%Y-%%m-%%d %%H:%%M:%%f', 'now')\n"
        "FROM PopupTemplates WHERE Id = %d AND NOT EXISTS (SELECT 1 FROM PopupTemplates WHERE Name = %s);\n"
        % (q(t["name"]), q(t["desc"]), q(t["cat"]), q(json.dumps(content, separators=(",", ":"))),
           q("/img/templates/%s.svg" % slug(t["name"])), t["trig"], t["delay"], t["freq"], t["premium"], order,
           jset(opts), BASE[k], q(t["name"])))

# ---------------------------------------------------------------- thumbnails

def esc(s):
    return html.escape(s, quote=True)

def lines(s, width, limit):
    out = textwrap.wrap(s, width)[:limit]
    return out

def text_block(x, y, rows, size, fill, weight="400", anchor="middle", gap=1.25):
    return "".join('<text x="%d" y="%d" font-family="Helvetica,Arial,sans-serif" font-size="%d" font-weight="%s" fill="%s" text-anchor="%s">%s</text>'
                   % (x, y + int(i * size * gap), size, weight, fill, anchor, esc(r)) for i, r in enumerate(rows))

def button(x, y, w, label, fill, fg="#ffffff"):
    return ('<rect x="%d" y="%d" width="%d" height="46" rx="9" fill="%s"/>' % (x, y, w, fill) +
            text_block(x + w // 2, y + 30, [label[:30]], 17, fg, "700"))

def thumb(kind, head, sub, btn, bg, accent, text):
    W, H = 800, 500
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="%s">' % (W, H, W, H, esc(head)),
         '<rect width="%d" height="%d" fill="#DCEEEE"/>' % (W, H)]
    muted = "#5b6b70" if text != "#ffffff" else "#cbd5d8"
    if kind == "message":
        s.append('<rect x="60" y="60" width="680" height="380" rx="14" fill="#ffffff" opacity="0.55"/>')
        for i in range(5):
            s.append('<rect x="100" y="%d" width="%d" height="14" rx="7" fill="#c3dedd"/>' % (190 + i * 40, 600 - i * 70))
        s.append('<rect x="110" y="84" width="580" height="74" rx="12" fill="#ffffff" stroke="%s" stroke-width="2"/>' % accent)
        s.append('<circle cx="150" cy="121" r="13" fill="%s"/>' % accent)
        s.append(text_block(176, 116, lines(head, 52, 2), 16, "#0B1F2B", "600", "start"))
    elif kind == "inline":
        for i in range(3):
            s.append('<rect x="110" y="%d" width="%d" height="14" rx="7" fill="#b7d6d5"/>' % (60 + i * 30, 580 - i * 60))
        s.append('<rect x="110" y="160" width="580" height="210" rx="14" fill="%s" stroke="#c3dedd"/>' % bg)
        s.append(text_block(400, 215, lines(head, 36, 2), 25, "#0B1F2B", "700"))
        s.append(text_block(400, 275, lines(sub, 58, 1), 15, "#5b6b70"))
        s.append(button(300, 300, 200, btn, accent))
        for i in range(3):
            s.append('<rect x="110" y="%d" width="%d" height="14" rx="7" fill="#b7d6d5"/>' % (400 + i * 30, 580 - i * 90))
    else:
        s.append('<rect x="150" y="50" width="500" height="400" rx="18" fill="%s"/>' % bg)
        s.append('<circle cx="622" cy="78" r="13" fill="#000000" opacity="0.12"/>')
        if kind == "video":
            s.append('<rect x="190" y="90" width="420" height="200" rx="10" fill="#000000" opacity="0.45"/>')
            s.append('<circle cx="400" cy="190" r="38" fill="#ffffff" opacity="0.95"/><path d="M388 170 L422 190 L388 210 Z" fill="%s"/>' % accent)
            s.append(text_block(400, 335, lines(head, 34, 1), 24, text, "700"))
            s.append(button(300, 370, 200, btn, accent))
        elif kind == "lightbox":
            s.append('<rect x="190" y="90" width="420" height="320" rx="10" fill="#c3dedd"/>')
            s.append('<circle cx="290" cy="180" r="34" fill="#ffffff" opacity="0.8"/><path d="M190 410 L330 260 L430 350 L500 300 L610 410 Z" fill="%s" opacity="0.55"/>' % accent)
        elif kind == "spin":
            cols = [accent, "#FF8A3D", "#4DD9D2", "#0B1F2B", "#FACC15", "#ffffff"]
            import math
            for i in range(6):
                a0, a1 = math.radians(i * 60 - 90), math.radians((i + 1) * 60 - 90)
                s.append('<path d="M290 250 L%.1f %.1f A120 120 0 0 1 %.1f %.1f Z" fill="%s" stroke="#ffffff" stroke-width="2"/>'
                         % (290 + 120 * math.cos(a0), 250 + 120 * math.sin(a0), 290 + 120 * math.cos(a1), 250 + 120 * math.sin(a1), cols[i]))
            s.append('<circle cx="290" cy="250" r="16" fill="#ffffff" stroke="#0B1F2B" stroke-width="3"/><path d="M290 112 L278 136 L302 136 Z" fill="#0B1F2B"/>')
            s.append(text_block(525, 200, lines(head, 15, 3), 23, text, "700"))
            s.append(button(440, 310, 170, btn, accent))
        elif kind == "coupon":
            s.append(text_block(400, 150, lines(head, 26, 2), 28, "#0B1F2B", "700"))
            s.append('<rect x="250" y="225" width="300" height="74" rx="10" fill="#212529" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 6"/>')
            s.append(text_block(400, 272, [sub], 28, "#ffffff", "700"))
            s.append(button(290, 340, 220, btn, accent))
        else:
            rows = lines(head, 26, 2)
            s.append(text_block(400, 150 if len(rows) > 1 else 170, rows, 30, text, "700"))
            s.append(text_block(400, 245, lines(sub, 46, 2), 16, muted))
            if kind == "email":
                s.append('<rect x="220" y="300" width="360" height="46" rx="9" fill="#ffffff" stroke="#b7d6d5" stroke-width="2"/>')
                s.append(text_block(238, 329, ["you@company.com"], 15, "#8aa3a6", "400", "start"))
                s.append(button(220, 362, 360, btn, accent))
            else:
                s.append(button(280, 330, 240, btn, accent, "#0B0B0B" if accent in ("#FACC15", "#22D3EE", "#4DD9D2") else "#ffffff"))
    s.append("</svg>")
    return "".join(s)

def main():
    os.makedirs(OUT_SVG, exist_ok=True)
    sql = ["-- Generated by build_templates.py. Safe to run more than once.\nBEGIN;\n"]
    names = []
    for (tid, kind, name, head, sub, btn, bg, accent, text) in EXISTING:
        f = slug(name) + ".svg"
        open(os.path.join(OUT_SVG, f), "w").write(thumb(kind, head, "15% OFF" if kind == "coupon" else sub, btn, bg, accent, text))
        names.append(f)
        sql.append("UPDATE PopupTemplates SET PreviewImageUrl = %s WHERE Id = %d AND Name = %s;\n" % (q("/img/templates/" + f), tid, q(name)))
    # The stock video template shipped pointing at an unrelated YouTube video.
    sql.append("UPDATE PopupTemplates SET Content = replace(Content, 'dQw4w9WgXcQ', 'YOUR_VIDEO_ID'), "
               "TypeSpecificOptions = replace(TypeSpecificOptions, 'dQw4w9WgXcQ', 'YOUR_VIDEO_ID') WHERE Content LIKE '%dQw4w9WgXcQ%';\n")
    # The stock coupon template shipped with an expiry date that has already passed.
    sql.append("UPDATE PopupTemplates SET TypeSpecificOptions = json_set(TypeSpecificOptions, '$.ExpiryDate', '2027-12-31T00:00:00Z') "
               "WHERE Id = 8 AND Name = 'Welcome Discount';\n")
    for i, t in enumerate(T):
        f = slug(t["name"]) + ".svg"
        sub = t["extra"].get("value", t["sub"]) if t["kind"] == "coupon" else t["sub"]
        open(os.path.join(OUT_SVG, f), "w").write(thumb(t["kind"], t["head"], sub, t["btn"], t["bg"], t["accent"], t["text"]))
        names.append(f)
        sql.append(row_sql(t, 12 + i))
    sql.append("COMMIT;\nSELECT 'templates', count(*) FROM PopupTemplates;\nSELECT Category, count(*) FROM PopupTemplates GROUP BY 1;\n")
    open(OUT_SQL, "w").write("".join(sql))
    open(os.path.join(OUT_SVG, "manifest.txt"), "w").write("\n".join(names) + "\n")
    print(len(T), "new templates,", len(names), "thumbnails")

main()
