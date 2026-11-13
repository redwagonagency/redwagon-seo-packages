// Sites: the websites a customer runs OptinYeti on.
//   GET  /admin/Sites              list with install snippet, popup and lead counts, per-site lead webhook
//   POST /admin/Sites/save         add or update a site (domain, name, webhook)
//   POST /admin/Sites/delete       remove a site record (popups and leads are kept)
// A popup is scoped to a site through its targeting rule (urlTargeting = the site's domain),
// which the popup script already understands. Leads carry the page they came from, so each
// site's leads can be counted and routed to that site's own webhook.
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;

namespace OptinYeti.Leads;

internal static class Sites
{
    private static readonly Regex DomainRx = new("^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,24}$", RegexOptions.Compiled);

    public static string? NormalizeDomain(string raw)
    {
        var d = raw.Trim().ToLowerInvariant();
        if (d.StartsWith("http://", StringComparison.Ordinal) || d.StartsWith("https://", StringComparison.Ordinal))
        {
            if (!Uri.TryCreate(d, UriKind.Absolute, out var uri)) return null;
            d = uri.Host;
        }
        d = d.TrimEnd('/');
        if (d.StartsWith("www.", StringComparison.Ordinal)) d = d[4..];
        return DomainRx.IsMatch(d) ? d : null;
    }

    public static async Task<bool> Handle(HttpContext ctx, string path)
    {
        switch (path.TrimEnd('/').ToLowerInvariant())
        {
            case "/admin/sites": await Page(ctx); return true;
            case "/admin/sites/save": await Save(ctx); return true;
            case "/admin/sites/delete": await Delete(ctx); return true;
            case "/admin/sites/kit": await Kit(ctx); return true;
            default: return false;
        }
    }

    // The site a page belongs to, for routing a lead. Longest matching domain wins.
    public static async Task<(string Domain, string? Webhook)?> SiteForUrl(SqliteConnection db, long tenantId, string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
        var host = uri.Host.ToLowerInvariant();
        await using var cmd = db.CreateCommand();
        cmd.CommandText = "select Domain, WebhookUrl from Sites where TenantId = @t";
        cmd.Parameters.AddWithValue("@t", tenantId);
        await using var reader = await cmd.ExecuteReaderAsync();
        (string, string?)? best = null;
        while (await reader.ReadAsync())
        {
            var domain = reader.GetString(0);
            if (host == domain || host.EndsWith("." + domain, StringComparison.Ordinal))
                if (best == null || domain.Length > best.Value.Item1.Length)
                    best = (domain, reader.IsDBNull(1) ? null : reader.GetString(1));
        }
        return best;
    }

    public static async Task<List<(long Id, string Domain, string Name)>> List(SqliteConnection db, long tenantId)
    {
        var list = new List<(long, string, string)>();
        await using var cmd = db.CreateCommand();
        cmd.CommandText = "select Id, Domain, Name from Sites where TenantId = @t order by Name, Domain";
        cmd.Parameters.AddWithValue("@t", tenantId);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync()) list.Add((reader.GetInt64(0), reader.GetString(1), reader.IsDBNull(2) ? "" : reader.GetString(2)));
        return list;
    }

    private static async Task Page(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method)) { ctx.Response.StatusCode = 405; return; }
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var t = viewer.TenantId;
        await using var db = await LeadsMiddleware.Open();
        var rows = new StringBuilder();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "select s.Id, s.Domain, s.Name, s.WebhookUrl, s.LastStatus, " +
                "(select count(*) from Popups p where p.TenantId = s.TenantId and p.TargetingRules like '%' || s.Domain || '%') as Popups, " +
                "(select count(*) from EmailCaptures e where e.TenantId = s.TenantId and (e.Source like 'https://' || s.Domain || '%' or e.Source like 'https://www.' || s.Domain || '%' or e.Source like 'http://' || s.Domain || '%' or e.Source like '%.' || s.Domain || '/%')) as Leads, " +
                "(select count(*) from CroPageviews v where v.TenantId = s.TenantId and (v.Url like 'https://' || s.Domain || '%' or v.Url like 'https://www.' || s.Domain || '%' or v.Url like '%.' || s.Domain || '/%') and v.At >= @since) as Views " +
                "from Sites s where s.TenantId = @t order by s.Name, s.Domain";
            cmd.Parameters.AddWithValue("@t", t);
            cmd.Parameters.AddWithValue("@since", LeadsMiddleware.Timestamp(DateTime.UtcNow.AddDays(-30)));
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var id = reader.GetInt64(0); var domain = reader.GetString(1);
                var hook = reader.IsDBNull(3) ? "" : reader.GetString(3);
                var status = reader.IsDBNull(4) ? "" : reader.GetString(4);
                rows.Append("<div class=\"site card pad\" style=\"max-width:none\"><div class=\"site-head\"><div><h2>").Append(H(reader.IsDBNull(2) || reader.GetString(2).Length == 0 ? domain : reader.GetString(2)))
                    .Append("</h2><p class=\"sub\">").Append(H(domain)).Append(" · ").Append(reader.GetInt64(5)).Append(" popups · ").Append(reader.GetInt64(6)).Append(" leads · ").Append(reader.GetInt64(7)).Append(" pageviews in 30 days")
                    .Append(reader.GetInt64(7) == 0 ? " · <strong>script not seen yet</strong>" : " · script active").Append("</p></div>")
                    .Append("<div class=\"actions\"><a class=\"btn ghost\" href=\"/admin/Leads?q=").Append(Uri.EscapeDataString(domain)).Append("\">Leads</a><a class=\"btn ghost\" href=\"/Popup/SelectTemplate?site=").Append(Uri.EscapeDataString(domain)).Append("\">Add popup</a></div></div>")
                    .Append("<details><summary>Install on this site</summary><p class=\"sub\" style=\"margin:8px 0\">Paste before <code>&lt;/body&gt;</code> on every page, or add it as a Custom HTML tag in Google Tag Manager.</p><pre>").Append(H(Snippet(t))).Append("</pre></details>")
                    .Append("<form method=\"post\" action=\"/admin/Sites/save\" class=\"row site-form\"><input type=\"hidden\" name=\"id\" value=\"").Append(id).Append("\">")
                    .Append("<label>Name <input name=\"name\" maxlength=\"80\" value=\"").Append(H(reader.IsDBNull(2) ? "" : reader.GetString(2))).Append("\"></label>")
                    .Append("<label class=\"grow\">Send this site's leads to (webhook URL, optional) <input type=\"url\" name=\"webhook\" maxlength=\"500\" placeholder=\"https://… leave empty to use the account webhook\" value=\"").Append(H(hook)).Append("\"></label>")
                    .Append("<button type=\"submit\" class=\"btn\">Save</button></form>")
                    .Append(status.Length == 0 ? "" : "<p class=\"sub\">Last delivery: " + H(status) + "</p>")
                    .Append("<details><summary>Launch kit: three ready-made popups for this site</summary><p class=\"sub\" style=\"margin:8px 0\">Creates an exit-intent popup, a scroll slide-in and a welcome bar, all limited to this site and live right away. Tell it what the visitor gets and you can fine-tune the words afterwards.</p>")
                    .Append("<form method=\"post\" action=\"/admin/Sites/kit\" class=\"row site-form\"><input type=\"hidden\" name=\"id\" value=\"").Append(id).Append("\">")
                    .Append("<label class=\"grow\">What the visitor gets <input name=\"offer\" required maxlength=\"140\" placeholder=\"e.g. a free 20-point audit of your site\"></label>")
                    .Append("<label>Button text <input name=\"button\" maxlength=\"40\" placeholder=\"Send it to me\"></label>")
                    .Append("<button type=\"submit\" class=\"btn\">Create the three popups</button></form></details>")
                    .Append("<form method=\"post\" action=\"/admin/Sites/delete\" onsubmit=\"return confirm('Remove this site from the list? Its popups and leads stay.')\"><input type=\"hidden\" name=\"id\" value=\"").Append(id).Append("\"><button type=\"submit\" class=\"del\">Remove site</button></form></div>");
            }
        }
        var notice = ctx.Request.Query["msg"].ToString() switch
        {
            "saved" => "<div class=\"notice ok\">Site saved.</div>",
            "bad" => "<div class=\"notice bad\">That does not look like a domain. Use the form example.com, without a path.</div>",
            "badhook" => "<div class=\"notice bad\">The webhook must be an https address on a public host.</div>",
            "dup" => "<div class=\"notice bad\">That site is already on the list.</div>",
            "removed" => "<div class=\"notice ok\">Site removed.</div>",
            "kit" => "<div class=\"notice ok\">Three popups created and live for that site. Open <a href=\"/Popup\">Popups</a> to adjust the words or turn any of them off.</div>",
            "kitlimit" => "<div class=\"notice bad\">Your plan does not have room for three more popups. Upgrade on the <a href=\"/Subscription\">Subscription</a> page or remove old popups first.</div>",
            "kitmissing" => "<div class=\"notice bad\">That site is not on your list.</div>",
            _ => ""
        };
        var body = new StringBuilder();
        body.Append("<div class=\"head\"><div><h1>Sites</h1><p class=\"sub\">Each website you run OptinYeti on. One script serves them all; each popup can be limited to one site.</p></div></div>")
            .Append(notice)
            .Append("<form method=\"post\" action=\"/admin/Sites/save\" class=\"card pad row site-form\" style=\"max-width:none;margin-bottom:22px\"><label>Domain <input name=\"domain\" required placeholder=\"example.com\" maxlength=\"253\"></label><label>Name <input name=\"name\" maxlength=\"80\" placeholder=\"Optional\"></label><button type=\"submit\" class=\"btn\">Add site</button></form>")
            .Append(rows.Length == 0 ? "<div class=\"empty\"><h2>No sites yet</h2><p>Add the domain of a website you want popups on.</p></div>" : rows.ToString());
        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(LeadsMiddleware.Chrome("Sites") + Styles + body + LeadsMiddleware.PageBottom);
    }

    public static string Snippet(long tenantId) =>
        "<script src=\"https://optinyeti.com/Popup/GetTenantScript/" + tenantId.ToString(CultureInfo.InvariantCulture) + "\" async></script>";

    private static async Task Save(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method)) { ctx.Response.StatusCode = 405; return; }
        if (!LeadsMiddleware.SameOrigin(ctx)) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var form = await ctx.Request.ReadFormAsync();
        var name = LeadsMiddleware.Clip(form["name"].ToString().Trim(), 80);
        var hook = form["webhook"].ToString().Trim();
        if (hook.Length > 0 && !LeadsMiddleware.IsAcceptableWebhookUrl(hook)) { ctx.Response.Redirect("/admin/Sites?msg=badhook"); return; }
        var now = LeadsMiddleware.Timestamp(DateTime.UtcNow);
        await using var db = await LeadsMiddleware.Open();
        if (long.TryParse(form["id"], NumberStyles.None, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "update Sites set Name = @n, WebhookUrl = @w, UpdatedAt = @now where Id = @id and TenantId = @t";
            cmd.Parameters.AddWithValue("@n", LeadsMiddleware.Nullable(name));
            cmd.Parameters.AddWithValue("@w", LeadsMiddleware.Nullable(hook));
            cmd.Parameters.AddWithValue("@now", now);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await cmd.ExecuteNonQueryAsync();
        }
        else
        {
            var domain = NormalizeDomain(form["domain"].ToString());
            if (domain == null) { ctx.Response.Redirect("/admin/Sites?msg=bad"); return; }
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "insert or ignore into Sites (TenantId, Domain, Name, WebhookUrl, CreatedAt, UpdatedAt) values (@t, @d, @n, @w, @now, @now)";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            cmd.Parameters.AddWithValue("@d", domain);
            cmd.Parameters.AddWithValue("@n", LeadsMiddleware.Nullable(name));
            cmd.Parameters.AddWithValue("@w", LeadsMiddleware.Nullable(hook));
            cmd.Parameters.AddWithValue("@now", now);
            if (await cmd.ExecuteNonQueryAsync() == 0) { ctx.Response.Redirect("/admin/Sites?msg=dup"); return; }
        }
        ctx.Response.Redirect("/admin/Sites?msg=saved");
    }

    private static async Task Delete(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method)) { ctx.Response.StatusCode = 405; return; }
        if (!LeadsMiddleware.SameOrigin(ctx)) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var form = await ctx.Request.ReadFormAsync();
        long.TryParse(form["id"], NumberStyles.None, CultureInfo.InvariantCulture, out var id);
        await using var db = await LeadsMiddleware.Open();
        await using var cmd = db.CreateCommand();
        cmd.CommandText = "delete from Sites where Id = @id and TenantId = @t";
        cmd.Parameters.AddWithValue("@id", id);
        cmd.Parameters.AddWithValue("@t", viewer.TenantId);
        await cmd.ExecuteNonQueryAsync();
        ctx.Response.Redirect("/admin/Sites?msg=removed");
    }

    // Launch kit: three popups that cover the moments that convert on most sites, scoped to one site.
    //   1. exit-intent centered popup   2. scroll slide-in (bottom right)   3. welcome bar after 8 seconds
    private static async Task Kit(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method)) { ctx.Response.StatusCode = 405; return; }
        if (!LeadsMiddleware.SameOrigin(ctx)) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        if (viewer.TenantId < 0) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        var form = await ctx.Request.ReadFormAsync();
        long.TryParse(form["id"], NumberStyles.None, CultureInfo.InvariantCulture, out var id);
        var offer = LeadsMiddleware.Clip(form["offer"].ToString().Trim(), 140);
        var button = LeadsMiddleware.Clip(form["button"].ToString().Trim(), 40);
        if (button.Length == 0) button = "Send it to me";
        if (offer.Length == 0) offer = "our best tips, straight to your inbox";

        await using var db = await LeadsMiddleware.Open();
        string domain = "", siteName = "";
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select Domain, Name from Sites where Id = @id and TenantId = @t";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync()) { domain = reader.GetString(0); siteName = reader.IsDBNull(1) ? "" : reader.GetString(1); }
        }
        if (domain.Length == 0) { ctx.Response.Redirect("/admin/Sites?msg=kitmissing"); return; }
        if (siteName.Length == 0) siteName = domain;
        var remaining = await LeadsMiddleware.PopupsRemaining(db, viewer.TenantId);
        if (remaining >= 0 && remaining < 3) { ctx.Response.Redirect("/admin/Sites?msg=kitlimit"); return; }

        await CreateKit(db, viewer.TenantId, viewer.UserId, domain, siteName, offer, button);
        await LeadsMiddleware.RefreshPopupCount(db, viewer.TenantId);
        ctx.Response.Redirect("/admin/Sites?msg=kit");
    }

    // The three kit popups for one site. Used by the Sites page and by seed jobs (Jobs.cs).
    public static async Task<long[]> CreateKit(SqliteConnection db, long tenantId, string userId, string domain, string siteName, string offer, string button)
    {
        if (siteName.Length == 0) siteName = domain;
        if (button.Length == 0) button = "Send it to me";
        if (offer.Length == 0) offer = "our best tips, straight to your inbox";
        var targeting = System.Text.Json.JsonSerializer.Serialize(new { urlTargeting = domain });
        var success = "Thanks! Check your inbox in the next few minutes.";
        var privacy = "No spam. One click to unsubscribe.";
        string Options(string heading, string sub, string bg, string btn) => System.Text.Json.JsonSerializer.Serialize(new
        {
            Heading = heading, SubHeading = sub, ButtonText = button, SuccessMessage = success, PrivacyText = privacy,
            ImageUrl = "", CollectName = false, CollectPhone = false, BackgroundColor = bg, ButtonColor = btn
        });
        var ids = new long[3];

        // 1. Exit intent: the visitor is leaving, make one clear offer.
        ids[0] = await LeadsMiddleware.InsertPopup(db, tenantId, userId, siteName + " - Exit intent", 1,
            LeadsMiddleware.ParseOptions(Options("Before you go: " + Lower(offer), "Leave your email and we will send it over. Takes ten seconds.", "#ffffff", "#FF8A3D")),
            new Dictionary<string, object> { ["mode"] = "center" }, targeting, trigger: 1, delay: 0, frequency: 1, status: 1);

        // 2. Scroll slide-in: the visitor is reading, offer more of the same without blocking the page.
        ids[1] = await LeadsMiddleware.InsertPopup(db, tenantId, userId, siteName + " - Scroll slide-in", 1,
            LeadsMiddleware.ParseOptions(Options("Want " + Lower(offer) + "?", "Pop your email in and it is yours.", "#EAF6F7", "#0F6B6B")),
            new Dictionary<string, object> { ["mode"] = "slide", ["position"] = "bottom-right" }, targeting, trigger: 2, delay: 0, frequency: 1, status: 1);

        // 3. Welcome bar: a quiet reminder across the top after the visitor has settled in.
        ids[2] = await LeadsMiddleware.InsertPopup(db, tenantId, userId, siteName + " - Welcome bar", 1,
            LeadsMiddleware.ParseOptions(Options("Get " + Lower(offer), "", "#0B1F2B", "#FF8A3D")),
            new Dictionary<string, object> { ["mode"] = "bar", ["position"] = "top" }, targeting, trigger: 3, delay: 8000, frequency: 1, status: 1);

        await LeadsMiddleware.RefreshPopupCount(db, tenantId);
        return ids;
    }

    // "A free audit" -> "a free audit"; leaves acronyms such as "SEO tips" alone.
    private static string Lower(string s) =>
        s.Length > 1 && char.IsUpper(s[0]) && !char.IsUpper(s[1]) ? char.ToLowerInvariant(s[0]) + s[1..] : s;

    private static string H(string s) => LeadsMiddleware.H(s);

    private const string Styles = """
<style>
  .site{margin-bottom:18px;}
  .site-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;}
  .site-head h2{margin:0 0 4px;font-size:20px;}
  .site details{margin:14px 0;}
  .site summary{cursor:pointer;font-weight:600;color:var(--teal);}
  .site pre{background:#F3F9F9;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13px;overflow:auto;white-space:pre-wrap;word-break:break-all;}
  .site-form{align-items:flex-end;gap:12px;}
  .site-form label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink-soft);}
  .site-form label.grow{flex:1;min-width:280px;}
  .site-form input{padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-weight:400;min-width:200px;}
  .site-form label.grow input{width:100%;}
  .site .del{margin-top:10px;}
</style>
""";
}
