// Public marketing pages served by the add-on, styled like the redesigned site.
// Each page: address, title tag, meta description, body. Addresses are lower-case and
// deliberately distinct from the static mockup pages (/templates, /builder, ...).
using System.Text;

namespace OptinYeti.Leads;

internal sealed record SeoPage(string Path, string Title, string Description, string Heading, string Lead, string Body, string Kind = "WebPage");

internal static class SeoPages
{
    private const string Site = "https://optinyeti.com";

    // Small helpers so the page bodies stay readable.
    private static string Cta(string text, string href = "/Account/Register") =>
        "<p class=\"cta-row\"><a class=\"btn btn-dark\" href=\"" + href + "\">" + text + "</a><a class=\"btn ghost\" href=\"/Templates\">Browse templates</a></p>";

    private static string Faq(params (string Q, string A)[] items)
    {
        var sb = new StringBuilder("<section class=\"faq\" id=\"faq\"><h2>Questions people ask</h2>");
        foreach (var (q, a) in items)
            sb.Append("<details><summary>").Append(q).Append("</summary><p>").Append(a).Append("</p></details>");
        return sb.Append("</section>").ToString();
    }

    private static string FaqJson(params (string Q, string A)[] items)
    {
        var list = items.Select(i => new Dictionary<string, object>
        {
            ["@type"] = "Question",
            ["name"] = i.Q,
            ["acceptedAnswer"] = new Dictionary<string, object> { ["@type"] = "Answer", ["text"] = System.Text.RegularExpressions.Regex.Replace(i.A, "<[^>]+>", "") }
        });
        return System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, object>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "FAQPage",
            ["mainEntity"] = list
        });
    }

    private static readonly (string Q, string A)[] ExitFaq =
    {
        ("What is an exit-intent popup?", "A popup that appears when a visitor is about to leave: on desktop, when the mouse moves toward the browser bar or the close button; on mobile, on a fast scroll up or a back gesture. Because it waits until the visit is ending, it does not interrupt people who are still reading or buying."),
        ("Do exit-intent popups hurt SEO?", "Not when they fire on intent to leave rather than on page load. Google's interstitial guidance targets popups that cover content as soon as a page opens, especially on mobile. OptinYeti fires exit popups on the leave signal and lets you keep them off on mobile if you prefer."),
        ("How many emails can an exit-intent popup capture?", "Results vary by offer and traffic. Well-targeted exit offers commonly convert 2% to 5% of leaving visitors, and discount or lead-magnet offers can go higher. The A/B test built into OptinYeti shows you the real number for your site."),
        ("Can I show it only once per visitor?", "Yes. Each campaign has a frequency setting: every visit, once per session, once a day, once a week, once a month, or once ever.")
    };

    private static readonly (string Q, string A)[] SpinFaq =
    {
        ("How does the spin-to-win popup work?", "The visitor enters an email, presses spin, and the wheel lands on one of your prizes. The prize and its coupon code appear right away, and the email is saved as a lead. You decide the prizes, the codes and how often each one comes up."),
        ("Can I control the odds?", "Yes. Each prize has a chance value. A prize set to 40 comes up twice as often as one set to 20. You can also add a 'try again' segment with no code."),
        ("Do the coupon codes work in my store?", "The wheel shows whatever code you type for each prize, so create matching codes in your store or checkout first. The prize editor reminds you of this."),
        ("Is it available on the free plan?", "Spin-to-win templates are visible to everyone and included from the Professional plan.")
    };

    private static readonly (string Q, string A)[] AbFaq =
    {
        ("How is the winner decided?", "OptinYeti counts views and conversions for each version and runs a standard two-proportion significance test. It tells you plainly when the gap is unlikely to be chance (95% confidence) and when it is still too early to call."),
        ("How many views do I need?", "The results page waits until each version has at least 100 views before it will call a winner. For small differences you need more; the page keeps updating as traffic arrives."),
        ("Will the same visitor see both versions?", "No. A visitor is assigned to A or B the first time the popup could show and keeps that version on return visits."),
        ("What counts as a conversion?", "An email signup, or a click on the main button for popups without a form.")
    };

    private static readonly (string Q, string A)[] AltFaq =
    {
        ("Is OptinYeti a drop-in replacement for OptinMonster?", "For the core job, yes: popups, slide-ins and bars with exit-intent, scroll and time triggers, templates, A/B testing, spin-to-win, coupons and lead export. OptinYeti does not yet match OptinMonster's full list of integrations; it offers webhooks, which connect to any tool through Zapier, Make or n8n."),
        ("Can I move my existing leads?", "Your leads live in your email tool, not in the popup product, so nothing moves. Point OptinYeti's webhook at that tool and new leads arrive in the same place."),
        ("Is there a free plan?", "Yes. The free plan includes one campaign, up to 3,000 views a month, exit-intent and scroll triggers, and basic analytics.")
    };

    private static readonly (string Q, string A)[] CouponFaq =
    {
        ("Should I ask for an email before showing the code?", "If the goal is list growth, yes: the code becomes the reward for subscribing. If the goal is to rescue an abandoning cart, show the code immediately and keep the friction at zero. OptinYeti coupon templates support both."),
        ("Can the code expire?", "Set the campaign's schedule to end on a date and create the code in your store with the same expiry. The popup stops showing the moment the campaign ends."),
        ("Will people share the code?", "Public codes get shared. For high-value offers use single-use codes from your store, and show them only after the email is entered.")
    };

    public static readonly SeoPage[] All =
    {
        new("/about/joe-whyte",
            "Joe Whyte, CRO Expert and Founder of OptinYeti",
            "Joe Whyte is a conversion-rate-optimization and marketing-technology specialist, founder of Red Wagon and the builder of OptinYeti, PPC Grader, Threadly and other marketing tools.",
            "Joe Whyte",
            "Conversion rate optimization, marketing technology and the person building OptinYeti.",
            """
<div class="prose">
<p>Joe Whyte runs <a href="https://redwagon.agency" rel="noopener">Red Wagon</a>, a marketing agency, and builds marketing software when the tools he needs do not exist. OptinYeti is one of those tools: a popup and lead-capture system built around the one job most analytics suites treat as an afterthought, turning visitors who are about to leave into subscribers and customers.</p>

<h2>Conversion rate optimization in practice</h2>
<p>CRO, for Joe, is not a theory exercise. It is the daily work of measuring where visitors drop off, forming a hypothesis about why, changing one thing, and letting the numbers decide. That discipline shows up in how OptinYeti is built: every campaign reports views and conversion rate, every popup can be A/B tested, and the results page says in plain language whether a difference is real or noise.</p>
<p>He has spent years inside the full marketing stack for companies and agency clients: paid media on Google, Microsoft and Meta, tag management and analytics with Google Tag Manager and GA4, CRM architecture and lead routing, email deliverability, and the automation that ties those systems together. That breadth matters for CRO because a popup only earns its keep when the lead it captures lands in the right system, gets attributed to the right channel, and is followed up on.</p>

<h2>Tools Joe has built</h2>
<ul>
  <li><strong>OptinYeti</strong>: exit-intent popups, spin-to-win, coupons, templates and A/B testing, with leads delivered by webhook to any tool.</li>
  <li><strong>PPC Grader</strong>: a free audit of paid-search accounts that scores structure, wasted spend and tracking.</li>
  <li><strong>Search Audit Pro</strong>: a technical SEO audit system.</li>
  <li><strong>E-Mail Grader</strong>: a free email-marketing audit.</li>
  <li><strong>Threadly</strong>: social-media scheduling for teams.</li>
  <li><strong>Markitech</strong> and <strong>CompetitorInbox</strong>: marketing-technology and competitive-intelligence products.</li>
</ul>

<h2>How Joe approaches popups</h2>
<p>Three rules run through everything in OptinYeti. First, respect the visit: fire on exit intent, scroll depth or time on page, not the moment someone arrives. Second, make one offer and make it specific; a vague "subscribe" loses to "get the 12-point checklist" every time. Third, test it; the A/B results page exists so nobody has to argue about which headline is better.</p>

<h2>Credentials</h2>
<p>Joe is a certified HubSpot agency partner and has set up CRM instances for many organisations. He is completing an MBA.</p>

<h2>Work with Joe</h2>
<p>For CRO, marketing-technology or paid-media work, contact Red Wagon at <a href="https://redwagon.agency" rel="noopener">redwagon.agency</a>. For questions about OptinYeti, write to <a href="mailto:contact@optinyeti.com">contact@optinyeti.com</a>.</p>
</div>
""" + Cta("Try OptinYeti free"),
            "ProfilePage"),

        new("/exit-intent-popups",
            "Exit-Intent Popups That Catch Leaving Visitors",
            "Exit-intent popups show an offer at the moment a visitor is about to leave. Learn how exit detection works, what to offer, and how to set one up in minutes with OptinYeti.",
            "Exit-intent popups",
            "Catch the visitor who was about to leave, without interrupting the one who is still reading.",
            """
<div class="prose">
<p>Most visitors leave a page without doing anything. An exit-intent popup is the last, polite chance to change that: it waits until the visit is clearly ending, then makes one offer. Used well, it is the highest-converting popup type because it never gets in the way of someone who is still engaged.</p>

<h2>How exit detection works</h2>
<p>On desktop, OptinYeti watches the mouse. When the cursor moves quickly toward the top of the window, where the address bar, tabs and close button live, the popup fires. On mobile there is no cursor, so the trigger is a fast scroll back toward the top, or the browser's back gesture. You can turn the mobile version off if your pages rely on scrolling.</p>

<h2>What to offer when someone is leaving</h2>
<ul>
  <li><strong>Stores:</strong> a first-order discount or free shipping, with the code shown after the email is entered.</li>
  <li><strong>Content sites:</strong> a checklist, template or guide related to the page they were reading.</li>
  <li><strong>Services and SaaS:</strong> a demo, a free trial, or a short "which plan fits" quiz.</li>
  <li><strong>Carts and checkouts:</strong> a reminder of what is in the cart plus one reason to finish now.</li>
</ul>
<p>The common thread is specificity. "Join our newsletter" is a weak reason to stay. "Get the 12-point checklist our customers use every week" is a reason.</p>

<h2>Setting one up in OptinYeti</h2>
<ol>
  <li>Pick a template from the <a href="/Templates">template gallery</a>. The email-collection and coupon templates are built for exit offers.</li>
  <li>Change the words, colors and picture in the content editor.</li>
  <li>Set the trigger to exit intent and the frequency to once per session or once per day.</li>
  <li>Publish, then add the one-line script to your site. Leads appear on the Leads screen and can be sent anywhere by webhook.</li>
</ol>

<h2>Measure, then test</h2>
<p>Every campaign reports views and conversion rate. When you have a hunch that a different headline or offer would do better, run an <a href="/popup-ab-testing">A/B test</a>: half of visitors see each version and the results page tells you when there is a real winner.</p>
</div>
""" + Faq(ExitFaq) + Cta("Build an exit-intent popup"),
            "Article"),

        new("/spin-to-win-popups",
            "Spin-to-Win Popups: Gamified Email Capture",
            "Add a spin-the-wheel popup to your site. Visitors enter an email, spin, and win a coupon. Set your own prizes, codes and odds with OptinYeti.",
            "Spin-to-win popups",
            "A wheel, a prize and an email address. Gamified capture that people actually enjoy.",
            """
<div class="prose">
<p>Spin-to-win turns a signup form into a small game. The visitor types an email, presses spin, and the wheel lands on a prize. Because the reward is immediate and a little uncertain, these popups routinely out-convert a plain discount box, especially in retail and hospitality.</p>

<h2>What you control</h2>
<ul>
  <li><strong>Prizes:</strong> up to eight segments, each with its own label and coupon code. A "try again" segment with no code is fine too.</li>
  <li><strong>Odds:</strong> a chance value per prize. 40 comes up twice as often as 20. The editor shows the resulting percentages before you save.</li>
  <li><strong>Words and colors:</strong> headline, the line under it, the button, background and button colors.</li>
  <li><strong>When it shows:</strong> exit intent, scroll depth, time delay or page load, and how often per visitor.</li>
</ul>

<h2>Prizes that work</h2>
<p>Keep the wheel honest and the prizes real. A wheel where every segment is a meaningful discount converts better than one padded with "better luck next time". Put the best prize on a low chance, the everyday prize on a high chance, and make sure every code exists in your store before the campaign goes live.</p>

<h2>Where the leads go</h2>
<p>Every spin saves the email with the campaign it came from. Leads appear on the Leads screen, export to CSV, and can be sent in real time to your email tool or CRM by webhook.</p>

<h2>Try it before you sign up</h2>
<p>The <a href="/Templates#gamification">template gallery</a> has working spin-to-win previews. Open one, enter an email and spin it. Nothing is saved from the preview.</p>
</div>
""" + Faq(SpinFaq) + Cta("Set up a spin-to-win popup"),
            "Article"),

        new("/popup-ab-testing",
            "Popup A/B Testing: Find the Headline That Converts",
            "Test two versions of a popup against each other. OptinYeti splits visitors evenly, counts views and signups, and tells you when there is a real winner.",
            "A/B testing for popups",
            "Stop arguing about headlines. Split the traffic and let the numbers decide.",
            """
<div class="prose">
<p>Two people look at a popup and disagree about the headline. An A/B test ends the argument: half of visitors see version A, half see version B, and the results page shows which one captured more signups and whether the difference is more than chance.</p>

<h2>How it works in OptinYeti</h2>
<ol>
  <li>Open any popup and press <strong>A/B test</strong>.</li>
  <li>Write a different headline or button text for version B, or paste your own HTML for a bigger change.</li>
  <li>Press <strong>Start test</strong>. From that moment visitors are split evenly, and each visitor keeps their version on return visits.</li>
  <li>Watch views, conversions and conversion rate for each version. The page says "too early to call" until each side has 100 views, then tells you when a lead is statistically real.</li>
  <li>End the test with one click: keep A, or make B the popup.</li>
</ol>

<h2>What to test first</h2>
<ul>
  <li><strong>The offer.</strong> "10% off" against "free shipping" is usually the biggest swing you will find.</li>
  <li><strong>The headline.</strong> Benefit-first beats clever.</li>
  <li><strong>The button.</strong> "Send me the code" against "Subscribe".</li>
  <li><strong>The picture.</strong> With and without a product image across the top.</li>
</ul>
<p>Change one thing per test. If both the headline and the offer change, a win tells you nothing about which one caused it.</p>

<h2>Reading the result</h2>
<p>OptinYeti uses a two-proportion z-test, the standard method for comparing two conversion rates. "Version B is ahead, and the gap is unlikely to be chance (95% confidence)" means there is less than a 5% probability that a difference this large would appear with no real effect. "No clear winner yet" means keep the test running or accept that the two versions are about the same.</p>
</div>
""" + Faq(AbFaq) + Cta("Start an A/B test"),
            "Article"),

        new("/coupon-popups",
            "Coupon Popups and Discount Code Popups",
            "Show a discount code in a popup, immediately or after an email is entered. Coupon popup templates, timing advice and setup steps from OptinYeti.",
            "Coupon popups",
            "A discount at the right moment, shown to the right visitor, in exchange for an email when you want one.",
            """
<div class="prose">
<p>A coupon popup does one of two jobs. It rescues a sale that was about to walk away, or it trades a discount for an email address you can use for months. The difference is whether you ask for the email first, and OptinYeti's coupon templates do either.</p>

<h2>Two patterns</h2>
<ul>
  <li><strong>Show the code immediately.</strong> Best on cart and checkout pages, and for exit intent on product pages. Zero friction, highest redemption.</li>
  <li><strong>Email first, then the code.</strong> Best for first-time visitors and content pages. The code is the reward for subscribing, and the lead goes straight to your email tool.</li>
</ul>

<h2>Setting the code</h2>
<p>Create the code in your store first, then type the same code into the popup's content editor along with the offer text ("15% OFF") and the line under the code. The popup displays the code in a dashed box that is easy to read and copy.</p>

<h2>Timing</h2>
<p>Discounts are expensive, so show them to the people who need a nudge, not everyone. Exit intent on product and cart pages, a 30-second delay on category pages, or a 60% scroll on long articles all target people who are engaged but undecided. Set the frequency to once per week so a visitor is not offered the same discount on every visit.</p>

<h2>Measure it</h2>
<p>Each coupon campaign reports views, conversions and conversion rate. To learn whether 10% beats free shipping for your audience, run an <a href="/popup-ab-testing">A/B test</a> with one version of each.</p>
</div>
""" + Faq(CouponFaq) + Cta("Create a coupon popup"),
            "Article"),

        new("/optinmonster-alternative",
            "OptinMonster Alternative: OptinYeti",
            "Looking for an OptinMonster alternative? OptinYeti offers exit-intent popups, spin-to-win, coupons, templates, A/B testing and webhook delivery, with a free plan.",
            "An OptinMonster alternative built around lead capture",
            "The same core job, a simpler product, and a free plan to start on.",
            """
<div class="prose">
<p>OptinMonster defined the category: popups that fire on exit intent, with templates and testing. OptinYeti is built for the same job with a narrower focus. It does the lead-capture part well, keeps the interface small, and sends leads wherever you already keep them.</p>

<h2>What is the same</h2>
<ul>
  <li>Exit-intent, scroll, time-delay, click and page-load triggers.</li>
  <li>Email-collection, coupon, spin-to-win, video, announcement and inline templates, with live previews you can try before signing up.</li>
  <li>A/B testing with a plain-language verdict.</li>
  <li>Frequency rules, device rules and per-campaign analytics.</li>
  <li>Lead storage, search, CSV export and real-time delivery by webhook.</li>
</ul>

<h2>What is different</h2>
<ul>
  <li><strong>Integrations.</strong> OptinMonster lists dozens of native connectors. OptinYeti delivers leads by webhook, which reaches every tool through Zapier, Make or n8n, and native connectors are being added.</li>
  <li><strong>Editing.</strong> OptinYeti's content editor is a short form: words, colors, picture, options. There is also a drag-and-drop designer for custom layouts, but most campaigns never need it.</li>
  <li><strong>Price.</strong> A free plan with one campaign and 3,000 views a month, Professional at $29 a month, Enterprise at $99. See <a href="/pricing">pricing</a>.</li>
</ul>

<h2>Switching</h2>
<p>Your leads already live in your email tool, so there is nothing to migrate. Build the equivalent campaign from a template, point the webhook at the same list, publish, swap the script tag, and pause the old account once the new campaign is capturing.</p>
</div>
""" + Faq(AltFaq) + Cta("Start free"),
            "Article"),

        new("/video-popups",
            "Video Popups for Product Demos and Announcements",
            "Play a YouTube or Vimeo video in a popup with a button under it. Video popup templates and setup steps from OptinYeti.",
            "Video popups",
            "A demo or a message that plays where the visitor already is, with one button under it.",
            """
<div class="prose">
<p>A video popup puts a short clip in front of a visitor at a chosen moment: a product demo on a pricing page, a founder message for first-time visitors, or a how-to on a support page. The visitor watches without leaving the page, and a single button under the video takes them to the next step.</p>

<h2>Setting one up</h2>
<ol>
  <li>Choose a video template in the <a href="/Templates#video">gallery</a>.</li>
  <li>Paste the normal YouTube or Vimeo link. The share link you copy from the site works; OptinYeti converts it to the embedded player.</li>
  <li>Write the headline and the line under the video, and turn the button on with its own text and link.</li>
  <li>Choose the trigger. A 10 to 20 second delay suits demos; exit intent suits "before you go" messages.</li>
</ol>

<h2>Keep it short</h2>
<p>Popups are interruptions, even welcome ones. Clips under 60 seconds hold attention; longer videos belong on a page of their own with the popup linking to it.</p>
</div>
""" + Cta("Add a video popup"),
            "Article")
    };

    public static readonly Dictionary<string, SeoPage> ByPath = All.ToDictionary(p => p.Path, p => p, StringComparer.OrdinalIgnoreCase);

    private const string Styles = """
<style>
  .page-head{padding:48px 0 18px;max-width:760px;}
  .page-head h1{font-size:44px;line-height:1.1;letter-spacing:-.015em;margin:0 0 14px;}
  .page-head .lead{font-size:19px;color:#5B655C;margin:0;}
  .prose{max-width:720px;font-size:17px;line-height:1.65;}
  .prose h2{font-size:26px;margin:36px 0 10px;letter-spacing:-.01em;}
  .prose p{margin:0 0 16px;}
  .prose ul,.prose ol{padding-left:22px;margin:0 0 16px;}
  .prose li{margin:0 0 8px;}
  .prose a{color:#0F766E;text-decoration:underline;text-underline-offset:3px;}
  .cta-row{display:flex;gap:12px;flex-wrap:wrap;margin:36px 0 10px;}
  .cta-row .btn{padding:13px 22px;font-weight:600;border-radius:10px;}
  .cta-row .btn.ghost{background:#fff;border:1.5px solid #E7E4DA;color:#0B1C1A;}
  .faq{max-width:720px;margin:40px 0 0;}
  .faq h2{font-size:26px;margin:0 0 14px;}
  .faq details{border-top:1px solid #E7E4DA;padding:14px 0;}
  .faq details:last-child{border-bottom:1px solid #E7E4DA;}
  .faq summary{cursor:pointer;font-weight:600;font-size:17px;}
  .faq p{margin:10px 0 0;color:#36403B;line-height:1.6;}
  .more{max-width:960px;margin:56px 0 0;padding-top:28px;border-top:1px solid #E7E4DA;}
  .more h2{font-size:20px;margin:0 0 14px;}
  .more ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px 24px;}
  .more a{color:#0F766E;text-decoration:none;font-weight:500;}
  .more a:hover{text-decoration:underline;}
  .site-footer{max-width:1240px;margin:60px auto 0;padding:24px 32px;border-top:1px solid #E7E4DA;color:#5B655C;font-size:14px;display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between;}
  .site-footer a{color:inherit;}
</style>
""";

    public static string Render(SeoPage page)
    {
        var more = new StringBuilder("<section class=\"more\"><h2>More from OptinYeti</h2><ul>");
        more.Append("<li><a href=\"/Templates\">Popup templates</a></li>");
        foreach (var other in All)
            if (other.Path != page.Path) more.Append("<li><a href=\"").Append(other.Path).Append("\">").Append(other.Heading).Append("</a></li>");
        more.Append("<li><a href=\"/pricing\">Pricing</a></li></ul></section>");

        var ld = new Dictionary<string, object>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = page.Kind,
            ["name"] = page.Title,
            ["headline"] = page.Heading,
            ["description"] = page.Description,
            ["url"] = Site + page.Path,
            ["publisher"] = new Dictionary<string, object> { ["@type"] = "Organization", ["name"] = "OptinYeti", ["url"] = Site, ["logo"] = Site + "/img/yeti-logo.png" }
        };
        if (page.Kind == "ProfilePage")
            ld["mainEntity"] = new Dictionary<string, object>
            {
                ["@type"] = "Person", ["name"] = "Joe Whyte", ["jobTitle"] = "Founder, CRO and marketing technology specialist",
                ["worksFor"] = new Dictionary<string, object> { ["@type"] = "Organization", ["name"] = "Red Wagon", ["url"] = "https://redwagon.agency" },
                ["url"] = Site + page.Path
            };
        var scripts = "<script type=\"application/ld+json\">" + System.Text.Json.JsonSerializer.Serialize(ld) + "</script>";
        if (page.Body.Contains("class=\"faq\"", StringComparison.Ordinal))
        {
            var faq = page.Path switch
            {
                "/exit-intent-popups" => FaqJson(ExitFaq),
                "/spin-to-win-popups" => FaqJson(SpinFaq),
                "/popup-ab-testing" => FaqJson(AbFaq),
                "/coupon-popups" => FaqJson(CouponFaq),
                "/optinmonster-alternative" => FaqJson(AltFaq),
                _ => ""
            };
            if (faq.Length > 0) scripts += "<script type=\"application/ld+json\">" + faq + "</script>";
        }

        var head = "<meta name=\"description\" content=\"" + System.Net.WebUtility.HtmlEncode(page.Description) + "\">" +
                   "<link rel=\"canonical\" href=\"" + Site + page.Path + "\">" +
                   "<meta property=\"og:type\" content=\"" + (page.Kind == "Article" ? "article" : "website") + "\">" +
                   "<meta property=\"og:title\" content=\"" + System.Net.WebUtility.HtmlEncode(page.Title) + "\">" +
                   "<meta property=\"og:description\" content=\"" + System.Net.WebUtility.HtmlEncode(page.Description) + "\">" +
                   "<meta property=\"og:url\" content=\"" + Site + page.Path + "\">" +
                   "<meta property=\"og:image\" content=\"" + Site + "/img/yeti-logo.png\">" +
                   "<meta name=\"twitter:card\" content=\"summary\">" + scripts;

        var body = "<div class=\"page-head\"><h1>" + page.Heading + "</h1><p class=\"lead\">" + page.Lead + "</p></div>" + page.Body + more +
                   "<footer class=\"site-footer\"><span>© 2026 OptinYeti</span><span><a href=\"/about/joe-whyte\">About Joe Whyte</a> · <a href=\"/Home/Privacy\">Privacy</a> · <a href=\"mailto:contact@optinyeti.com\">contact@optinyeti.com</a></span></footer>";
        return LeadsMiddleware.PublicPage(page.Title, head + Styles, body);
    }
}
