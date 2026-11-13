"""Generates one 'popups' seed job per Red Wagon product site. Run: python3 build_site_strategies.py
Each site gets the same funnel shape as redwagon.agency: welcome bar -> primary free tool, scroll slide-in
newsletter, exit-intent offer (off the signup/checkout pages), two in-article banners, and a pricing-page
nudge. Copy, colours and links are per site."""
import json

SITES = [
  dict(domain="ppcgrader.com", kit="PPC Grader", bg="#0B1F2B", accent="#F26A21", soft="#FFF4EC",
       tool="https://ppcgrader.com/", tool_label="Grade my Google Ads free",
       offer="a free Google Ads account grade with the wasted-spend report",
       news="PPC Notes: one paid-media fix a week, from accounts we audit every day",
       pricing="https://ppcgrader.com/pricing", exclude="ppcgrader.com/pricing,ppcgrader.com/checkout,ppcgrader.com/register,ppcgrader.com/login",
       bar="Free Google Ads grade in 60 seconds", bar_sub="Wasted spend, Quality Score, impression share: scored and explained. No card needed.",
       blog1_h="How much of your ad budget is wasted?", blog1_s="Grade your Google, Meta or LinkedIn account free and see the wasted-spend number in sixty seconds.",
       exit_h="Before you go: grade your ads free", exit_s="Sixty seconds, no card, and you get the wasted-spend report that most agencies charge for.",
       price_h="Not sure which plan? Start with the free grade", price_s="Run the free grade first; the report tells you exactly which plan pays for itself.", price_url="https://ppcgrader.com/"),
  dict(domain="searchauditpro.com", kit="SearchAuditPro", bg="#0B1F2B", accent="#2DD4BF", soft="#EAF6F7",
       tool="https://www.searchauditpro.com/", tool_label="Run my free SEO audit",
       offer="a free 20-point SEO audit of your site",
       news="Search Notes: one ranking fix a week from audits we run on real sites",
       pricing="https://www.searchauditpro.com/pricing", exclude="searchauditpro.com/register,searchauditpro.com/login,searchauditpro.com/pricing",
       bar="Free SEO audit, 30 seconds", bar_sub="Technical, content and link checks scored and explained. No sign-up to see the score.",
       blog1_h="Is your site leaking rankings?", blog1_s="Run the free 30-second audit and see the 20 checks that decide whether you rank, scored for your site.",
       exit_h="Before you go: audit your site free", exit_s="Thirty seconds. You get the score, the issues and what to fix first.",
       price_h="Start a free trial, keep the audit history", price_s="Every plan includes unlimited audits, rank tracking and the link outreach tools. Try it free first.", price_url="https://www.searchauditpro.com/register"),
  dict(domain="e-mailgrader.com", kit="E-Mail Grader", bg="#111111", accent="#F26A21", soft="#FFF4EC",
       tool="https://e-mailgrader.com/audit", tool_label="Grade my email program",
       offer="a free grade of your email marketing program",
       news="Inbox Notes: one deliverability or email-revenue fix a week",
       pricing="https://e-mailgrader.com/pricing", exclude="e-mailgrader.com/audit,e-mailgrader.com/pricing",
       bar="Free email marketing grade in 3 minutes", bar_sub="34 questions, one score, and the fixes ranked by revenue impact. Free.",
       blog1_h="How healthy is your email program?", blog1_s="Answer 34 quick questions and get a graded report on sends, list health, automation and KPIs. Free.",
       exit_h="Before you go: grade your email program", exit_s="Three minutes, 34 questions, and a graded report you can hand to your team.",
       price_h="Grade first, then decide", price_s="The free grade shows where the revenue is leaking before you spend a dollar.", price_url="https://e-mailgrader.com/audit"),
  dict(domain="competitorinbox.com", kit="CompetitorInbox", bg="#0B1F2B", accent="#FF8A3D", soft="#EAF6F7",
       tool="https://competitorinbox.com/register", tool_label="Start watching my competitors",
       offer="a free report of the emails your competitors sent this month",
       news="Competitor Watch: the best competitor email of the week, dissected",
       pricing="https://competitorinbox.com/pricing", exclude="competitorinbox.com/register,competitorinbox.com/login,competitorinbox.com/pricing",
       bar="See every email your competitors send", bar_sub="Subject lines, offers, send times and cadence, collected automatically. Free to start.",
       blog1_h="What are your competitors emailing right now?", blog1_s="CompetitorInbox collects every campaign they send and shows you the subject lines, offers and timing. Start free.",
       exit_h="Before you go: their emails, in your inbox", exit_s="Leave your email and we will send you this month's report on the brands you compete with.",
       price_h="Start free, upgrade when it pays for itself", price_s="Track a handful of competitors free. Add deliverability testing and more brands when you need them.", price_url="https://competitorinbox.com/register"),
  dict(domain="markitech.app", kit="Markitech", bg="#0B1F2B", accent="#3B82F6", soft="#EEF4FF",
       tool="https://app.markitech.app/signup", tool_label="Start with Markitech",
       offer="early access to Markitech plus the server-side tracking setup guide",
       news="Markitech Notes: one marketing-ops automation a week, with the exact prompts",
       pricing="https://markitech.app/pricing", exclude="markitech.app/pricing,app.markitech.app",
       bar="Your marketing-ops engineer, as an agent", bar_sub="Server-side GTM, GA4 setup, pixels, campaigns and creatives, done by Markitech. Start today.",
       blog1_h="Do this with an agent instead of a $200k hire", blog1_s="Markitech sets up server-side tracking, GA4 events, pixels and campaigns across 22 platforms. Start today.",
       exit_h="Before you go: the server-side tracking guide", exit_s="The setup guide we use for sGTM to GA4 and ad platforms, plus early access to Markitech.",
       price_h="Questions about plans or credits?", price_s="Tell us what you run and we'll point you at the right plan. No pressure, one email.", price_url="https://markitech.app/contact"),
  dict(domain="threadlyhq.com", kit="Threadly", bg="#111111", accent="#8B5CF6", soft="#F3EEFF",
       tool="https://threadlyhq.com/sign-up", tool_label="Start my free month",
       offer="a free month of Threadly and the posting playbook",
       news="Threadly Notes: one social post idea a week that actually gets reach",
       pricing="https://threadlyhq.com/pricing", exclude="threadlyhq.com/sign-up,threadlyhq.com/sign-in,threadlyhq.com/dashboard,threadlyhq.com/pricing",
       bar="Schedule a month of posts in an afternoon", bar_sub="Every brand, every network, one calendar. Free month to start.",
       blog1_h="Post 3x a day without living in the apps", blog1_s="Threadly schedules and publishes for every brand you run. Start your free month.",
       exit_h="Before you go: the posting playbook", exit_s="The cadence, formats and hooks we use to post 3x a day across 7 brands, plus a free month of Threadly.",
       price_h="Free month first, pick a plan later", price_s="Try every feature for a month. Pick a plan when you know how many brands you'll run.", price_url="https://threadlyhq.com/sign-up"),
  dict(domain="unboundkeyword.com", kit="UnboundKeyword", bg="#0B1F2B", accent="#10B981", soft="#ECFDF5",
       tool="https://www.unboundkeyword.com/register", tool_label="Find my keyword gaps",
       offer="a free keyword gap report for your site",
       news="Keyword Notes: one keyword opportunity a week, with volume and intent",
       pricing="https://www.unboundkeyword.com/pricing", exclude="unboundkeyword.com/register,unboundkeyword.com/login,unboundkeyword.com/pricing,unboundkeyword.com/api",
       bar="Keywords your competitors rank for and you don't", bar_sub="Run a gap report on any domain. Free account, no card.",
       blog1_h="Which keywords are you missing?", blog1_s="UnboundKeyword shows the terms competitors rank for that your site does not, with volume and intent. Free to start.",
       exit_h="Before you go: your keyword gap report", exit_s="Leave your email and we will send a gap report for your domain against your top competitor.",
       price_h="Start free, upgrade for more domains", price_s="The free account covers one site. Upgrade when you track more.", price_url="https://www.unboundkeyword.com/register"),
  dict(domain="josephwhyte.com", kit="Joe Whyte", bg="#111111", accent="#F26A21", soft="#FFF4EC",
       tool="https://redwagon.agency/contact/", tool_label="Book a strategy call",
       offer="one conversion lesson a week from Joe",
       news="Joe's CRO Notes: one conversion lesson a week from real client accounts",
       pricing=None, exclude="",
       bar="Work with Joe: 30-minute growth strategy call", bar_sub="SEO, paid media, CRM and CRO, from the person who ran the campaigns. Book through Red Wagon.",
       blog1_h="Want this done for your business?", blog1_s="Joe runs growth marketing for clients through Red Wagon. Book a 30-minute strategy call.",
       exit_h="Before you go: one CRO lesson a week", exit_s="Short, practical, from real accounts. No spam.",
       price_h=None, price_s=None, price_url=None),
]

def news_opts(s, heading, sub, bg, btn):
    return {"Heading": heading, "SubHeading": sub, "ButtonText": "Send me the notes", "SuccessMessage": "You are in. The next issue lands this week.",
            "PrivacyText": "No spam. One click to unsubscribe.", "BackgroundColor": bg, "ButtonColor": btn}

def cta_opts(heading, sub, text, url, bg, btn):
    return {"Heading": heading, "SubHeading": sub, "ButtonText": text, "ButtonUrl": url, "BackgroundColor": bg, "ButtonColor": btn}

for s in SITES:
    k = s["kit"]; d = s["domain"]
    popups = [
      {"name": f"{k} 01 Welcome bar", "type": 2, "options": cta_opts(s["bar"], s["bar_sub"], s["tool_label"], s["tool"], s["bg"], s["accent"]),
       "layout": {"mode": "bar", "position": "top"}, "urlTargeting": ",".join([d] + ["!" + x for x in s["exclude"].split(",") if x]), "trigger": 3, "delay": 6000, "frequency": 1, "status": 1},
      {"name": f"{k} 02 Scroll slide-in newsletter", "type": 1, "options": news_opts(s, s["news"].split(":")[0], s["news"].split(":",1)[1].strip().capitalize() + ".", "#ffffff", s["accent"]),
       "layout": {"mode": "slide", "position": "bottom-right"}, "trigger": 2, "delay": 0, "frequency": 1, "status": 1},
      # Sites whose offer IS the free tool send people to it; the rest capture an email for a report or guide.
      {"name": f"{k} 03 Exit intent offer", "type": 2 if d in ("ppcgrader.com", "searchauditpro.com", "e-mailgrader.com") else 1,
       "options": cta_opts(s["exit_h"], s["exit_s"], s["tool_label"], s["tool"], "#ffffff", s["accent"]) if d in ("ppcgrader.com", "searchauditpro.com", "e-mailgrader.com")
                  else {**news_opts(s, s["exit_h"], s["exit_s"], "#ffffff", s["accent"]), "ButtonText": "Send it to me"},
       "layout": {"mode": "center"}, "urlTargeting": ",".join([d] + ["!" + x for x in s["exclude"].split(",") if x]), "trigger": 1, "delay": 0, "frequency": 1, "status": 1},
      {"name": f"{k} 04 Blog banner - tool (after paragraph 4)", "type": 2, "options": cta_opts(s["blog1_h"], s["blog1_s"], s["tool_label"], s["tool"], s["bg"], s["accent"]),
       "layout": {"mode": "inline", "selector": "article", "afterParagraphs": 4, "placement": "after", "closable": False, "required": True}, "trigger": 0, "delay": 0, "frequency": 0, "status": 1},
      {"name": f"{k} 05 Blog banner - newsletter (after paragraph 12)", "type": 1, "options": news_opts(s, s["news"].split(":")[0], s["news"].split(":",1)[1].strip().capitalize() + ".", s["soft"], s["bg"]),
       "layout": {"mode": "inline", "selector": "article", "afterParagraphs": 12, "placement": "after", "closable": False, "required": True}, "trigger": 0, "delay": 0, "frequency": 0, "status": 1},
    ]
    if s["pricing"]:
        popups.append({"name": f"{k} 06 Pricing page nudge", "type": 2, "options": cta_opts(s["price_h"], s["price_s"], s["tool_label"] if "register" in s["price_url"] or "sign-up" in s["price_url"] or "audit" in s["price_url"] or s["price_url"].endswith("/") else "Ask us", s["price_url"], "#ffffff", s["accent"]),
                       "layout": {"mode": "slide", "position": "bottom-left"}, "urlTargeting": s["pricing"].split("://")[1].replace("www.", ""), "trigger": 3, "delay": 20000, "frequency": 1, "status": 1})
    job = {"job": "popups", "tenantId": 5, "domain": d,
           "replace": [f"{k} - Exit intent", f"{k} - Scroll slide-in", f"{k} - Welcome bar"], "popups": popups}
    with open(f"{d.replace('.', '-')}-strategy.json", "w") as f:
        json.dump(job, f, indent=2)
    print(d, len(popups))
