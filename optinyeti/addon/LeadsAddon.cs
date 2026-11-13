// OptinYeti lead-capture add-on.
//
// Loaded into the existing compiled app through ASPNETCORE_HOSTINGSTARTUPASSEMBLIES, so the
// original application DLL is left untouched. Adds:
//   POST /api/leads/capture      public endpoint used by popups and landing pages
//   GET  /admin/Leads            leads list for the signed-in user's tenant
//   GET  /admin/Leads/export     CSV export
//   POST /admin/Leads/delete     delete one lead
//   GET  /admin/Integrations     webhook settings (send each new lead to Zapier, Make, n8n, a CRM...)
//   POST /admin/Integrations/save, /admin/Integrations/test
// plus a "Leads" link in the app's own menu and a few baseline security headers.

using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;

[assembly: HostingStartup(typeof(OptinYeti.Leads.LeadsHostingStartup))]

namespace OptinYeti.Leads;

public sealed class LeadsHostingStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
            services.AddTransient<IStartupFilter, LeadsStartupFilter>());
    }
}

public sealed class LeadsStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.UseMiddleware<LeadsMiddleware>();
            next(app);
        };
    }
}

public sealed class LeadsMiddleware
{
    private const string IdentityScheme = "Identity.Application";
    private const int MaxBodyBytes = 16 * 1024;
    private const int PageSize = 100;
    private const int CapturesPerMinutePerIp = 10;

    private static readonly Regex EmailRegex =
        new(@"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly ConcurrentDictionary<string, (long Window, int Count)> RateWindows = new();

    private static readonly string DbPath =
        Environment.GetEnvironmentVariable("OPTINYETI_DB")
        ?? Path.Combine(AppContext.BaseDirectory, "PopupManager.db");

    private readonly RequestDelegate _next;

    public LeadsMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        ctx.Response.OnStarting(() =>
        {
            var h = ctx.Response.Headers;
            if (!h.ContainsKey("X-Content-Type-Options")) h["X-Content-Type-Options"] = "nosniff";
            if (!h.ContainsKey("Referrer-Policy")) h["Referrer-Policy"] = "strict-origin-when-cross-origin";
            if (!h.ContainsKey("X-Frame-Options")) h["X-Frame-Options"] = "SAMEORIGIN";
            return Task.CompletedTask;
        });

        var path = (ctx.Request.Path.Value ?? "").TrimEnd('/');

        try
        {
            if (path.Equals("/api/leads/capture", StringComparison.OrdinalIgnoreCase))
            {
                await HandleCapture(ctx);
                return;
            }
            if (path.Equals("/admin/leads", StringComparison.OrdinalIgnoreCase))
            {
                await HandleList(ctx);
                return;
            }
            if (path.Equals("/admin/leads/export", StringComparison.OrdinalIgnoreCase))
            {
                await HandleExport(ctx);
                return;
            }
            if (path.Equals("/admin/leads/delete", StringComparison.OrdinalIgnoreCase))
            {
                await HandleDelete(ctx);
                return;
            }
            if (path.Equals("/admin/integrations", StringComparison.OrdinalIgnoreCase))
            {
                await HandleIntegrations(ctx);
                return;
            }
            if (path.Equals("/admin/integrations/save", StringComparison.OrdinalIgnoreCase))
            {
                await HandleIntegrationSave(ctx);
                return;
            }
            if (path.Equals("/admin/integrations/test", StringComparison.OrdinalIgnoreCase))
            {
                await HandleIntegrationTest(ctx);
                return;
            }
        }
        catch (Exception ex) when (!ctx.Response.HasStarted)
        {
            Console.Error.WriteLine("[OptinYeti.Leads] " + ex);
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync("{\"success\":false,\"message\":\"Server error\"}");
            return;
        }

        if (path.Equals("/css/site.css", StringComparison.OrdinalIgnoreCase) && HttpMethods.IsGet(ctx.Request.Method))
        {
            await RecolorStylesheet(ctx);
            return;
        }

        // The first blog post was renamed along with the product; keep its old address working.
        if (path.Equals("/Blog/Post", StringComparison.OrdinalIgnoreCase) &&
            ctx.Request.Query["slug"].ToString().Contains("popup-manager", StringComparison.OrdinalIgnoreCase))
        {
            var slug = ctx.Request.Query["slug"].ToString().Replace("popup-manager", "optinyeti", StringComparison.OrdinalIgnoreCase);
            ctx.Response.Redirect("/Blog/Post?slug=" + Uri.EscapeDataString(slug), permanent: true);
            return;
        }

        if (IsPageView(ctx, path))
        {
            await PolishPage(ctx);
            return;
        }

        await _next(ctx);
    }

    // ------------------------------------------------------------- menu link

    private static readonly Regex AnalyticsLink = new(
        "<a\\b[^>]*href=\"/admin/Analytics\"[^>]*>.*?</a>",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Singleline);

    // Page views only; never scripts, APIs or static files.
    private static bool IsPageView(HttpContext ctx, string path)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method)) return false;
        if (ctx.Request.Headers.ContainsKey("Upgrade")) return false;
        if (path.Contains('.')) return false;
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.StartsWith("/Popup/GetTenant", StringComparison.OrdinalIgnoreCase)) return false;
        return true;
    }

    private async Task PolishPage(HttpContext ctx)
    {
        var signedIn = ctx.Request.Cookies.ContainsKey(".AspNetCore.Identity.Application");
        ctx.Request.Headers.Remove("Accept-Encoding");
        var original = ctx.Response.Body;
        using var buffer = new MemoryStream();
        ctx.Response.Body = buffer;
        try
        {
            await _next(ctx);
        }
        finally
        {
            ctx.Response.Body = original;
        }

        var type = ctx.Response.ContentType ?? "";
        if (ctx.Response.StatusCode == 200 &&
            type.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) &&
            !ctx.Response.Headers.ContainsKey("Content-Encoding") &&
            buffer.Length > 0 && buffer.Length < 2 * 1024 * 1024)
        {
            var html = Encoding.UTF8.GetString(buffer.GetBuffer(), 0, (int)buffer.Length);
            var updated = CleanUpPage(html);
            if (signedIn) updated = InjectLeadsLink(updated);
            if (!string.Equals(updated, html, StringComparison.Ordinal))
            {
                var bytes = Encoding.UTF8.GetBytes(updated);
                if (ctx.Response.ContentLength != null) ctx.Response.ContentLength = bytes.Length;
                await original.WriteAsync(bytes);
                return;
            }
        }

        buffer.Position = 0;
        await buffer.CopyToAsync(original);
    }

    private static string Resource(string name)
    {
        using var stream = typeof(LeadsMiddleware).Assembly.GetManifestResourceStream(name);
        if (stream == null) return "";
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private static readonly string TailwindConfig = Resource("tailwind-config.js");
    private static readonly string ThemeCss = Resource("theme.css");

    private const string TailwindTag = "<script src=\"https://cdn.tailwindcss.com\"></script>";
    private const string ThemeFonts =
        "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
        "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>" +
        "<link href=\"https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap\" rel=\"stylesheet\">" +
        "<link rel=\"icon\" href=\"/img/yeti-logo.png\">";

    // Gives the app's pages the same look as the marketing site: brand palette, type and logo.
    private static string ApplyTheme(string html)
    {
        if (ThemeCss.Length == 0 || html.Contains("id=\"oy-theme\"", StringComparison.Ordinal)) return html;
        var head = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        if (head < 0) return html;
        html = html.Insert(head, ThemeFonts + "<style id=\"oy-theme\">" + ThemeCss + "</style>");
        var tailwind = html.IndexOf(TailwindTag, StringComparison.OrdinalIgnoreCase);
        if (tailwind >= 0 && TailwindConfig.Length > 0)
            html = html.Insert(tailwind + TailwindTag.Length, "<script>" + TailwindConfig + "</script>");
        return html;
    }

    private static readonly (string From, string To)[] StylesheetColors =
    {
        ("#3ca2ff", "#17807f"), ("#60a5fa", "#35aaa6"), ("#3692e6", "#0F6B6B"), ("#2159d4", "#0a4d4d"),
        ("#2563eb", "#0F6B6B"), ("#c3e2ff", "#cfe8e6"), ("#eff6ff", "#EAF6F7"), ("#bfdbfe", "#aadedd"),
        ("#1e3a8a", "#0B1F2B"), ("#264bae", "#0a4d4d"), ("rgba(37, 99, 235", "rgba(15, 107, 107")
    };

    private async Task RecolorStylesheet(HttpContext ctx)
    {
        foreach (var header in new[] { "Accept-Encoding", "If-None-Match", "If-Modified-Since", "Range" })
            ctx.Request.Headers.Remove(header);
        var original = ctx.Response.Body;
        using var buffer = new MemoryStream();
        ctx.Response.Body = buffer;
        try
        {
            await _next(ctx);
        }
        finally
        {
            ctx.Response.Body = original;
        }

        if (ctx.Response.StatusCode == 200 &&
            (ctx.Response.ContentType ?? "").StartsWith("text/css", StringComparison.OrdinalIgnoreCase) &&
            !ctx.Response.Headers.ContainsKey("Content-Encoding") &&
            buffer.Length > 0 && buffer.Length < 2 * 1024 * 1024)
        {
            var css = Encoding.UTF8.GetString(buffer.GetBuffer(), 0, (int)buffer.Length);
            foreach (var (from, to) in StylesheetColors)
                css = css.Replace(from, to, StringComparison.OrdinalIgnoreCase);
            var bytes = Encoding.UTF8.GetBytes(css);
            ctx.Response.Headers.Remove("ETag");
            ctx.Response.ContentLength = bytes.Length;
            await original.WriteAsync(bytes);
            return;
        }

        buffer.Position = 0;
        await buffer.CopyToAsync(original);
    }

    private static readonly Regex OldBrandEmail = new(
        "[A-Za-z0-9._+-]+@(popupmanagerpro|popupmanager|popupx)\\.com",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex BuiltInTagManager = new(
        "<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex TitleTag = new(
        "<title>(.*?)</title>", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Singleline);

    // Fixes left over from the app's earlier name and unfinished pages. The compiled app
    // cannot be edited, so its HTML is corrected on the way out.
    private static string CleanUpPage(string html)
    {
        html = OldBrandEmail.Replace(html, "contact@optinyeti.com")
                   .Replace("Popup Manager Inc.", "OptinYeti")
                   .Replace("Popup Manager Pro", "OptinYeti")
                   .Replace("PopupX", "OptinYeti")
                   .Replace("Popup Manager", "OptinYeti")
                   .Replace(">?? <strong>Limited Time", "><strong>Limited Time");

        html = Regex.Replace(html, "<a href=\"#\"([^>]*)>Schedule a Demo</a>", "<a href=\"/Home/Demo\"$1>Schedule a Demo</a>");
        html = Regex.Replace(html, "<a href=\"#\"([^>]*)>FAQ</a>", "<a href=\"/Home/Pricing\"$1>FAQ</a>");
        html = Regex.Replace(html, "<a href=\"#\"([^>]*)>Video Tutorials</a>", "<a href=\"/Blog\"$1>Video Tutorials</a>");

        // The web server already adds the Tag Manager snippet to every page, so the copy built
        // into the app would load the container twice and double-count page views.
        html = BuiltInTagManager.Replace(html, "", 1);

        html = ApplyTheme(html);

        return TitleTag.Replace(html, match =>
        {
            var title = Regex.Replace(match.Groups[1].Value, "\\s+", " ").Trim();
            while (title.Contains("OptinYeti - OptinYeti", StringComparison.Ordinal))
                title = title.Replace("OptinYeti - OptinYeti", "OptinYeti");
            return "<title>" + title + "</title>";
        }, 1);
    }

    private static string InjectLeadsLink(string html)
    {
        if (html.Contains("href=\"/admin/Leads\"", StringComparison.OrdinalIgnoreCase)) return html;
        var match = AnalyticsLink.Match(html);
        if (!match.Success) return html;
        var link = match.Value.Replace("/admin/Analytics", "/admin/Leads", StringComparison.OrdinalIgnoreCase);
        link = Regex.Replace(link, "\\bAnalytics\\b", "Leads");
        return html.Insert(match.Index, link + "\n");
    }

    // ---------------------------------------------------------------- capture

    private static async Task HandleCapture(HttpContext ctx)
    {
        var res = ctx.Response;
        res.Headers["Access-Control-Allow-Origin"] = "*";
        res.Headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
        res.Headers["Access-Control-Allow-Headers"] = "Content-Type";
        res.Headers["Access-Control-Max-Age"] = "86400";
        res.Headers["Cache-Control"] = "no-store";

        if (HttpMethods.IsOptions(ctx.Request.Method))
        {
            res.StatusCode = 204;
            return;
        }
        if (!HttpMethods.IsPost(ctx.Request.Method))
        {
            await Json(ctx, 405, false, "Use POST");
            return;
        }

        var ip = ClientIp(ctx);
        if (!AllowCapture(ip))
        {
            await Json(ctx, 429, false, "Too many requests");
            return;
        }

        var body = await ReadBody(ctx, MaxBodyBytes);
        if (body == null)
        {
            await Json(ctx, 413, false, "Request too large");
            return;
        }

        JsonElement root;
        try
        {
            using var doc = JsonDocument.Parse(body);
            root = doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            await Json(ctx, 400, false, "Invalid JSON");
            return;
        }
        if (root.ValueKind != JsonValueKind.Object)
        {
            await Json(ctx, 400, false, "Invalid JSON");
            return;
        }

        // Honeypot: real forms never fill this field.
        if (!string.IsNullOrEmpty(Str(root, "hp")))
        {
            await Json(ctx, 200, true, "Lead captured");
            return;
        }

        var email = Clip(Str(root, "email"), 254);
        if (email.Length == 0 || !EmailRegex.IsMatch(email))
        {
            await Json(ctx, 400, false, "A valid email is required");
            return;
        }

        var popupId = Int(root, "popupId") ?? Int(root, "campaignId");
        if (popupId == null)
        {
            await Json(ctx, 400, false, "popupId is required");
            return;
        }

        var firstName = Clip(Str(root, "firstName"), 100);
        var lastName = Clip(Str(root, "lastName"), 100);
        var fullName = Clip(Str(root, "name"), 200);
        if (firstName.Length == 0 && fullName.Length > 0)
        {
            var space = fullName.IndexOf(' ');
            firstName = space < 0 ? fullName : fullName[..space];
            if (lastName.Length == 0 && space >= 0) lastName = fullName[(space + 1)..].Trim();
        }
        var phone = Clip(Str(root, "phone"), 40);
        var source = Clip(Str(root, "source"), 500);
        var consent = Bool(root, "consent");
        var consentText = Clip(Str(root, "consentText"), 500);
        var userAgent = Clip(ctx.Request.Headers.UserAgent.ToString(), 400);
        var now = Timestamp(DateTime.UtcNow);

        await using var db = await Open();

        long? tenantId = null;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select TenantId from Popups where Id = @id";
            cmd.Parameters.AddWithValue("@id", popupId.Value);
            var value = await cmd.ExecuteScalarAsync();
            if (value != null && value != DBNull.Value) tenantId = Convert.ToInt64(value, CultureInfo.InvariantCulture);
        }
        if (tenantId == null)
        {
            await Json(ctx, 404, false, "Unknown popup");
            return;
        }
        var claimedTenant = Int(root, "tenantId");
        if (claimedTenant != null && claimedTenant.Value != tenantId.Value)
        {
            await Json(ctx, 400, false, "Popup does not belong to this tenant");
            return;
        }

        // Same email on the same popup is stored once.
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select count(*) from EmailCaptures where PopupId = @p and lower(Email) = lower(@e)";
            cmd.Parameters.AddWithValue("@p", popupId.Value);
            cmd.Parameters.AddWithValue("@e", email);
            var existing = Convert.ToInt64(await cmd.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
            if (existing > 0)
            {
                await Json(ctx, 200, true, "Lead captured");
                return;
            }
        }

        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "insert into EmailCaptures (Email, FirstName, LastName, Phone, PopupId, TenantId, CapturedAt, IpAddress, UserAgent, Source, ConsentGiven, ConsentDate, ConsentText) " +
                "values (@email, @first, @last, @phone, @popup, @tenant, @at, @ip, @ua, @source, @consent, @consentDate, @consentText)";
            cmd.Parameters.AddWithValue("@email", email);
            cmd.Parameters.AddWithValue("@first", Nullable(firstName));
            cmd.Parameters.AddWithValue("@last", Nullable(lastName));
            cmd.Parameters.AddWithValue("@phone", Nullable(phone));
            cmd.Parameters.AddWithValue("@popup", popupId.Value);
            cmd.Parameters.AddWithValue("@tenant", tenantId.Value);
            cmd.Parameters.AddWithValue("@at", now);
            cmd.Parameters.AddWithValue("@ip", Nullable(ip));
            cmd.Parameters.AddWithValue("@ua", Nullable(userAgent));
            cmd.Parameters.AddWithValue("@source", Nullable(source));
            cmd.Parameters.AddWithValue("@consent", consent ? 1 : 0);
            cmd.Parameters.AddWithValue("@consentDate", consent ? now : DBNull.Value);
            cmd.Parameters.AddWithValue("@consentText", Nullable(consentText));
            await cmd.ExecuteNonQueryAsync();
        }

        var webhookUrl = await EnabledWebhook(db, tenantId.Value);
        if (webhookUrl != null)
        {
            var payload = LeadPayload("lead.captured", email, firstName, lastName, phone, popupId.Value, tenantId.Value, source, now);
            var tenant = tenantId.Value;
            _ = Task.Run(() => DeliverWebhook(tenant, webhookUrl, payload));
        }

        await Json(ctx, 200, true, "Lead captured");
    }

    private static bool AllowCapture(string ip)
    {
        var window = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60;
        if (RateWindows.Count > 5000)
        {
            foreach (var entry in RateWindows)
                if (entry.Value.Window != window) RateWindows.TryRemove(entry.Key, out _);
        }
        var state = RateWindows.AddOrUpdate(
            ip,
            _ => (window, 1),
            (_, old) => old.Window == window ? (window, old.Count + 1) : (window, 1));
        return state.Count <= CapturesPerMinutePerIp;
    }

    // ------------------------------------------------------------------ admin

    private sealed record Viewer(bool SeesAllTenants, long TenantId);

    private static async Task<Viewer?> RequireViewer(HttpContext ctx)
    {
        var auth = await ctx.AuthenticateAsync(IdentityScheme);
        var userId = auth.Succeeded ? auth.Principal?.FindFirstValue(ClaimTypes.NameIdentifier) : null;
        if (string.IsNullOrEmpty(userId))
        {
            var returnUrl = Uri.EscapeDataString(ctx.Request.Path + ctx.Request.QueryString);
            ctx.Response.Redirect("/Account/Login?ReturnUrl=" + returnUrl);
            return null;
        }

        long tenantId = -1;
        var found = false;
        await using (var db = await Open())
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select TenantId from AspNetUsers where Id = @id and IsActive = 1";
            cmd.Parameters.AddWithValue("@id", userId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                found = true;
                if (!reader.IsDBNull(0)) tenantId = reader.GetInt64(0);
            }
        }
        if (!found)
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("Forbidden");
            return null;
        }

        return new Viewer(auth.Principal!.IsInRole("SuperAdmin"), tenantId);
    }

    private const string LeadFilterSql =
        " from EmailCaptures e left join Popups p on p.Id = e.PopupId" +
        " where (@all = 1 or e.TenantId = @tenant)" +
        " and (@q = '' or e.Email like @like or ifnull(e.FirstName,'') like @like or ifnull(e.LastName,'') like @like)";

    private static void BindFilter(SqliteCommand cmd, Viewer viewer, string q)
    {
        cmd.Parameters.AddWithValue("@all", viewer.SeesAllTenants ? 1 : 0);
        cmd.Parameters.AddWithValue("@tenant", viewer.TenantId);
        cmd.Parameters.AddWithValue("@q", q);
        cmd.Parameters.AddWithValue("@like", "%" + q.Replace("%", "").Replace("_", "") + "%");
    }

    private static async Task HandleList(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        var q = Clip(ctx.Request.Query["q"].ToString(), 100);
        var page = 1;
        if (int.TryParse(ctx.Request.Query["page"], out var parsed) && parsed > 0) page = parsed;

        long total;
        var rows = new StringBuilder();
        await using (var db = await Open())
        {
            await using (var count = db.CreateCommand())
            {
                count.CommandText = "select count(*)" + LeadFilterSql;
                BindFilter(count, viewer, q);
                total = Convert.ToInt64(await count.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
            }

            await using var cmd = db.CreateCommand();
            cmd.CommandText =
                "select e.Id, e.Email, e.FirstName, e.LastName, e.Phone, e.CapturedAt, e.Source, e.ConsentGiven, p.Name" +
                LeadFilterSql + " order by e.Id desc limit @limit offset @offset";
            BindFilter(cmd, viewer, q);
            cmd.Parameters.AddWithValue("@limit", PageSize);
            cmd.Parameters.AddWithValue("@offset", (page - 1) * PageSize);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var id = reader.GetInt64(0);
                var name = (Text(reader, 2) + " " + Text(reader, 3)).Trim();
                rows.Append("<tr><td class=\"email\">").Append(H(Text(reader, 1))).Append("</td>")
                    .Append("<td>").Append(H(name)).Append("</td>")
                    .Append("<td>").Append(H(Text(reader, 4))).Append("</td>")
                    .Append("<td>").Append(H(Text(reader, 8))).Append("</td>")
                    .Append("<td class=\"src\" title=\"").Append(H(Text(reader, 6))).Append("\">").Append(H(Text(reader, 6))).Append("</td>")
                    .Append("<td class=\"when\">").Append(H(FormatWhen(Text(reader, 5)))).Append("</td>")
                    .Append("<td><form method=\"post\" action=\"/admin/Leads/delete\" onsubmit=\"return confirm('Delete this lead? This cannot be undone.');\">")
                    .Append("<input type=\"hidden\" name=\"id\" value=\"").Append(id.ToString(CultureInfo.InvariantCulture)).Append("\">")
                    .Append("<button class=\"del\" type=\"submit\">Delete</button></form></td></tr>");
            }
        }

        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)PageSize));
        var qs = q.Length > 0 ? "&q=" + Uri.EscapeDataString(q) : "";
        var pager = new StringBuilder();
        if (pages > 1)
        {
            pager.Append("<div class=\"pager\">");
            if (page > 1) pager.Append("<a href=\"/admin/Leads?page=").Append(page - 1).Append(qs).Append("\">Previous</a>");
            pager.Append("<span>Page ").Append(page).Append(" of ").Append(pages).Append("</span>");
            if (page < pages) pager.Append("<a href=\"/admin/Leads?page=").Append(page + 1).Append(qs).Append("\">Next</a>");
            pager.Append("</div>");
        }

        var table = total == 0
            ? "<div class=\"empty\"><h2>No leads yet</h2><p>" +
              (q.Length > 0 ? "Nothing matches that search." : "Emails collected by your popups and forms will show up here.") + "</p></div>"
            : "<div class=\"card\"><table><thead><tr><th>Email</th><th>Name</th><th>Phone</th><th>Popup</th><th>Source</th><th>Captured (UTC)</th><th></th></tr></thead><tbody>" +
              rows + "</tbody></table></div>" + pager;

        var html = Chrome("Leads") + "<div class=\"head\"><div><h1>Leads</h1><p class=\"sub\">" +
                   total.ToString("N0", CultureInfo.InvariantCulture) + (total == 1 ? " lead" : " leads") +
                   (q.Length > 0 ? " matching “" + H(q) + "”" : "") + "</p></div>" +
                   "<div class=\"actions\"><form method=\"get\" action=\"/admin/Leads\"><input type=\"search\" name=\"q\" placeholder=\"Search email or name\" value=\"" + H(q) + "\"><button type=\"submit\" class=\"btn ghost\">Search</button></form>" +
                   "<a class=\"btn ghost\" href=\"/admin/Integrations\">Integrations</a><a class=\"btn\" href=\"/admin/Leads/export" + (q.Length > 0 ? "?q=" + Uri.EscapeDataString(q) : "") + "\">Export CSV</a></div></div>" +
                   table + PageBottom;

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(html);
    }

    private static async Task HandleExport(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        var q = Clip(ctx.Request.Query["q"].ToString(), 100);
        var csv = new StringBuilder();
        csv.Append("Email,First name,Last name,Phone,Popup,Source,Consent,Captured at (UTC)\r\n");

        await using (var db = await Open())
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "select e.Email, e.FirstName, e.LastName, e.Phone, p.Name, e.Source, e.ConsentGiven, e.CapturedAt" +
                LeadFilterSql + " order by e.Id desc";
            BindFilter(cmd, viewer, q);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                csv.Append(Csv(Text(reader, 0))).Append(',')
                    .Append(Csv(Text(reader, 1))).Append(',')
                    .Append(Csv(Text(reader, 2))).Append(',')
                    .Append(Csv(Text(reader, 3))).Append(',')
                    .Append(Csv(Text(reader, 4))).Append(',')
                    .Append(Csv(Text(reader, 5))).Append(',')
                    .Append(!reader.IsDBNull(6) && reader.GetInt64(6) != 0 ? "yes" : "no").Append(',')
                    .Append(Csv(FormatWhen(Text(reader, 7)))).Append("\r\n");
            }
        }

        var fileName = "optinyeti-leads-" + DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + ".csv";
        ctx.Response.ContentType = "text/csv; charset=utf-8";
        ctx.Response.Headers["Content-Disposition"] = "attachment; filename=\"" + fileName + "\"";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync("﻿" + csv);
    }

    private static async Task HandleDelete(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }

        // Only accept the form post from our own pages.
        if (!SameOrigin(ctx))
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("Forbidden");
            return;
        }

        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        var form = await ctx.Request.ReadFormAsync();
        if (long.TryParse(form["id"], NumberStyles.Integer, CultureInfo.InvariantCulture, out var id))
        {
            await using var db = await Open();
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "delete from EmailCaptures where Id = @id and (@all = 1 or TenantId = @tenant)";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@all", viewer.SeesAllTenants ? 1 : 0);
            cmd.Parameters.AddWithValue("@tenant", viewer.TenantId);
            await cmd.ExecuteNonQueryAsync();
        }

        ctx.Response.Redirect("/admin/Leads");
    }

    // ----------------------------------------------------------- integrations

    private static readonly HttpClient WebhookClient = new(new SocketsHttpHandler
    {
        AllowAutoRedirect = false,
        ConnectTimeout = TimeSpan.FromSeconds(5),
        // Connect only to public addresses, checked at connect time so DNS tricks cannot
        // point a webhook at this server or its private network.
        ConnectCallback = async (context, cancel) =>
        {
            var addresses = await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, cancel);
            var target = addresses.FirstOrDefault(a => !IsPrivateAddress(a))
                         ?? throw new HttpRequestException("Webhook host does not resolve to a public address");
            var socket = new Socket(target.AddressFamily, SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
            try
            {
                await socket.ConnectAsync(new IPEndPoint(target, context.DnsEndPoint.Port), cancel);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }
    })
    {
        Timeout = TimeSpan.FromSeconds(8)
    };

    private static bool IsPrivateAddress(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        if (IPAddress.IsLoopback(address)) return true;
        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = address.GetAddressBytes();
            return b[0] == 0 || b[0] == 10 || b[0] == 127 ||
                   (b[0] == 100 && b[1] >= 64 && b[1] <= 127) ||
                   (b[0] == 169 && b[1] == 254) ||
                   (b[0] == 172 && b[1] >= 16 && b[1] <= 31) ||
                   (b[0] == 192 && b[1] == 168) ||
                   b[0] >= 224;
        }
        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            var b = address.GetAddressBytes();
            return address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6Multicast ||
                   (b[0] & 0xFE) == 0xFC || address.Equals(IPAddress.IPv6Any);
        }
        return true;
    }

    private static bool IsAcceptableWebhookUrl(string url) =>
        url.Length <= 500 &&
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        uri.Scheme == Uri.UriSchemeHttps &&
        uri.Host.Contains('.') &&
        !(IPAddress.TryParse(uri.Host, out var literal) && IsPrivateAddress(literal));

    private static string LeadPayload(string eventName, string email, string firstName, string lastName, string phone,
        long popupId, long tenantId, string source, string capturedAt) =>
        JsonSerializer.Serialize(new
        {
            @event = eventName,
            email,
            firstName,
            lastName,
            phone,
            popupId,
            tenantId,
            source,
            capturedAt
        });

    private static async Task<string?> EnabledWebhook(SqliteConnection db, long tenantId)
    {
        await using var cmd = db.CreateCommand();
        cmd.CommandText = "select Url from LeadWebhooks where TenantId = @t and IsEnabled = 1";
        cmd.Parameters.AddWithValue("@t", tenantId);
        var url = await cmd.ExecuteScalarAsync() as string;
        return !string.IsNullOrEmpty(url) && IsAcceptableWebhookUrl(url) ? url : null;
    }

    private static async Task<string> DeliverWebhook(long tenantId, string url, string payload)
    {
        string status;
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
            request.Headers.UserAgent.ParseAdd("OptinYeti-Webhook/1.0");
            using var response = await WebhookClient.SendAsync(request);
            status = ((int)response.StatusCode).ToString(CultureInfo.InvariantCulture) +
                     (response.IsSuccessStatusCode ? " OK" : " " + response.ReasonPhrase);
        }
        catch (Exception ex)
        {
            status = "Failed: " + Clip(ex.Message, 150);
        }

        try
        {
            await using var db = await Open();
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "update LeadWebhooks set LastStatus = @s, LastAttemptAt = @at where TenantId = @t";
            cmd.Parameters.AddWithValue("@s", status);
            cmd.Parameters.AddWithValue("@at", Timestamp(DateTime.UtcNow));
            cmd.Parameters.AddWithValue("@t", tenantId);
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[OptinYeti.Leads] webhook status not saved: " + ex.Message);
        }
        return status;
    }

    private static bool SameOrigin(HttpContext ctx)
    {
        var origin = ctx.Request.Headers.Origin.ToString();
        if (origin.Length == 0) origin = ctx.Request.Headers.Referer.ToString();
        return Uri.TryCreate(origin, UriKind.Absolute, out var originUri) &&
               string.Equals(originUri.Host, ctx.Request.Host.Host, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task HandleIntegrations(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        string url = "", lastStatus = "", lastAttempt = "";
        var enabled = false;
        await using (var db = await Open())
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select Url, IsEnabled, LastStatus, LastAttemptAt from LeadWebhooks where TenantId = @t";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                url = Text(reader, 0);
                enabled = !reader.IsDBNull(1) && reader.GetInt64(1) != 0;
                lastStatus = Text(reader, 2);
                lastAttempt = FormatWhen(Text(reader, 3));
            }
        }

        var notice = ctx.Request.Query["msg"].ToString() switch
        {
            "saved" => "<div class=\"notice ok\">Webhook saved.</div>",
            "badurl" => "<div class=\"notice bad\">That URL can't be used. It must be a public https:// address.</div>",
            "nourl" => "<div class=\"notice bad\">Save a webhook URL first.</div>",
            "tested" => "<div class=\"notice ok\">Test lead sent. Result: " + H(lastStatus) + "</div>",
            _ => ""
        };

        var status = lastStatus.Length == 0
            ? "No deliveries yet."
            : "Last delivery: " + H(lastStatus) + " at " + H(lastAttempt) + " UTC";

        var body =
            "<div class=\"head\"><div><h1>Integrations</h1><p class=\"sub\">Send every new lead to your other tools the moment it is captured.</p></div></div>" +
            notice +
            "<div class=\"card pad\"><h2>Webhook</h2>" +
            "<p class=\"sub\">Paste a webhook URL from Zapier, Make, n8n or your CRM. Each new lead is sent there as JSON (email, name, phone, popup, source, time).</p>" +
            "<form method=\"post\" action=\"/admin/Integrations/save\" class=\"stack\">" +
            "<label for=\"url\">Webhook URL</label>" +
            "<input type=\"url\" id=\"url\" name=\"url\" placeholder=\"https://hooks.zapier.com/hooks/catch/...\" value=\"" + H(url) + "\">" +
            "<label class=\"check\"><input type=\"checkbox\" name=\"enabled\" value=\"1\"" + (enabled || url.Length == 0 ? " checked" : "") + "> Send new leads to this URL</label>" +
            "<div class=\"row\"><button type=\"submit\" class=\"btn\">Save webhook</button></div></form>" +
            "<form method=\"post\" action=\"/admin/Integrations/test\" class=\"row\"><button type=\"submit\" class=\"btn ghost\">Send a test lead</button>" +
            "<span class=\"sub\">" + status + "</span></form></div>";

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(Chrome("Integrations") + body + PageBottom);
    }

    private static async Task HandleIntegrationSave(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        if (!SameOrigin(ctx))
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("Forbidden");
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;
        if (viewer.TenantId < 0)
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("Forbidden");
            return;
        }

        var form = await ctx.Request.ReadFormAsync();
        var url = Clip(form["url"].ToString(), 600);
        var enabled = form["enabled"].ToString() == "1";

        await using var db = await Open();
        await using var cmd = db.CreateCommand();
        if (url.Length == 0)
        {
            cmd.CommandText = "delete from LeadWebhooks where TenantId = @t";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await cmd.ExecuteNonQueryAsync();
            ctx.Response.Redirect("/admin/Integrations?msg=saved");
            return;
        }
        if (!IsAcceptableWebhookUrl(url))
        {
            ctx.Response.Redirect("/admin/Integrations?msg=badurl");
            return;
        }

        cmd.CommandText =
            "insert into LeadWebhooks (TenantId, Url, IsEnabled, UpdatedAt) values (@t, @u, @e, @at) " +
            "on conflict(TenantId) do update set Url = excluded.Url, IsEnabled = excluded.IsEnabled, UpdatedAt = excluded.UpdatedAt";
        cmd.Parameters.AddWithValue("@t", viewer.TenantId);
        cmd.Parameters.AddWithValue("@u", url);
        cmd.Parameters.AddWithValue("@e", enabled ? 1 : 0);
        cmd.Parameters.AddWithValue("@at", Timestamp(DateTime.UtcNow));
        await cmd.ExecuteNonQueryAsync();
        ctx.Response.Redirect("/admin/Integrations?msg=saved");
    }

    private static async Task HandleIntegrationTest(HttpContext ctx)
    {
        if (!HttpMethods.IsPost(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        if (!SameOrigin(ctx))
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("Forbidden");
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        string url;
        await using (var db = await Open())
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select Url from LeadWebhooks where TenantId = @t";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            url = await cmd.ExecuteScalarAsync() as string ?? "";
        }
        if (url.Length == 0 || !IsAcceptableWebhookUrl(url))
        {
            ctx.Response.Redirect("/admin/Integrations?msg=nourl");
            return;
        }

        var payload = LeadPayload("lead.test", "test-lead@example.com", "Test", "Lead", "", 0, viewer.TenantId,
            "OptinYeti test", Timestamp(DateTime.UtcNow));
        await DeliverWebhook(viewer.TenantId, url, payload);
        ctx.Response.Redirect("/admin/Integrations?msg=tested");
    }

    // ---------------------------------------------------------------- helpers

    private static int _schemaReady;

    private static async Task EnsureSchema(SqliteConnection db)
    {
        if (Volatile.Read(ref _schemaReady) == 1) return;
        await using var cmd = db.CreateCommand();
        cmd.CommandText =
            "create table if not exists LeadWebhooks (" +
            "TenantId integer not null primary key, Url text not null, IsEnabled integer not null default 1, " +
            "UpdatedAt text not null, LastStatus text null, LastAttemptAt text null)";
        await cmd.ExecuteNonQueryAsync();
        Volatile.Write(ref _schemaReady, 1);
    }

    private static async Task<SqliteConnection> Open()
    {
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = DbPath,
            Mode = SqliteOpenMode.ReadWrite,
            DefaultTimeout = 10
        };
        var db = new SqliteConnection(builder.ConnectionString);
        await db.OpenAsync();
        await EnsureSchema(db);
        return db;
    }

    private static async Task<string?> ReadBody(HttpContext ctx, int maxBytes)
    {
        if (ctx.Request.ContentLength > maxBytes) return null;
        using var buffer = new MemoryStream();
        var chunk = new byte[4096];
        int read;
        while ((read = await ctx.Request.Body.ReadAsync(chunk)) > 0)
        {
            if (buffer.Length + read > maxBytes) return null;
            buffer.Write(chunk, 0, read);
        }
        return Encoding.UTF8.GetString(buffer.ToArray());
    }

    private static Task Json(HttpContext ctx, int status, bool success, string message)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(new { success, message }));
    }

    private static string ClientIp(HttpContext ctx)
    {
        var real = ctx.Request.Headers["X-Real-IP"].ToString();
        if (real.Length > 0 && IPAddress.TryParse(real, out _)) return real;
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static bool TryGet(JsonElement root, string name, out JsonElement value)
    {
        foreach (var property in root.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }
        value = default;
        return false;
    }

    private static string Str(JsonElement root, string name)
    {
        if (!TryGet(root, name, out var v)) return "";
        return v.ValueKind switch
        {
            JsonValueKind.String => (v.GetString() ?? "").Trim(),
            JsonValueKind.Number => v.GetRawText(),
            _ => ""
        };
    }

    private static long? Int(JsonElement root, string name)
    {
        if (!TryGet(root, name, out var v)) return null;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var n)) return n;
        if (v.ValueKind == JsonValueKind.String &&
            long.TryParse(v.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var s)) return s;
        return null;
    }

    private static bool Bool(JsonElement root, string name)
    {
        if (!TryGet(root, name, out var v)) return false;
        return v.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.String => v.GetString() is "true" or "on" or "yes" or "1",
            JsonValueKind.Number => v.GetRawText() == "1",
            _ => false
        };
    }

    private static string Clip(string? value, int max)
    {
        var text = (value ?? "").Trim();
        return text.Length <= max ? text : text[..max];
    }

    private static object Nullable(string value) => value.Length == 0 ? DBNull.Value : value;

    private static string Timestamp(DateTime utc) =>
        utc.ToString("yyyy-MM-dd HH:mm:ss.FFFFFFF", CultureInfo.InvariantCulture);

    private static string Text(SqliteDataReader reader, int index) =>
        reader.IsDBNull(index) ? "" : Convert.ToString(reader.GetValue(index), CultureInfo.InvariantCulture) ?? "";

    private static string FormatWhen(string stored) =>
        DateTime.TryParse(stored, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var when)
            ? when.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)
            : stored;

    private static string H(string value) => WebUtility.HtmlEncode(value);

    private static string Csv(string value)
    {
        // Neutralise spreadsheet formulas, then quote.
        if (value.Length > 0 && "=+-@\t\r".IndexOf(value[0]) >= 0) value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }

    private const string PageTop = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{{TITLE}} - OptinYeti</title>
<link rel="icon" href="/img/yeti-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--ink:#0B1F2B;--ink-soft:#15323f;--glacier:#EAF6F7;--teal:#0F6B6B;--thaw:#FF8A3D;--thaw-deep:#e0701f;--line:#cfe8e6;--muted:#4d6b70;}
  *{box-sizing:border-box;}
  body{margin:0;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--glacier);color:var(--ink);line-height:1.5;}
  a{color:inherit;}
  header{background:#fff;border-bottom:1px solid var(--line);}
  header nav{max-width:1180px;margin:0 auto;padding:14px 28px;display:flex;gap:26px;align-items:center;font-size:15px;font-weight:500;}
  header nav a{text-decoration:none;color:var(--ink-soft);}
  header nav a:hover{color:var(--teal);}
  header nav .brand{font-family:"Baloo 2",system-ui,sans-serif;font-weight:700;font-size:21px;color:var(--ink);margin-right:10px;display:inline-flex;align-items:center;gap:10px;}
  header nav .brand img{width:34px;height:34px;border-radius:50%;}
  h1,h2{font-family:"Baloo 2",system-ui,sans-serif;}
  header nav .current{color:var(--teal);font-weight:600;}
  main{max-width:1180px;margin:0 auto;padding:34px 28px 60px;}
  .head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:22px;}
  h1{font-size:28px;margin:0;}
  .sub{margin:4px 0 0;color:var(--muted);}
  .actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
  .actions form{display:flex;gap:8px;}
  input[type=search]{padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;min-width:230px;background:#fff;}
  .btn{display:inline-block;background:var(--thaw);color:#fff;border:0;border-radius:10px;padding:10px 18px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;}
  .btn:hover{background:var(--thaw-deep);}
  .btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);}
  .btn.ghost:hover{background:var(--glacier);}
  .card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:14.5px;}
  th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle;}
  th{font-size:13px;color:var(--muted);font-weight:600;background:#f6fbfb;}
  tr:last-child td{border-bottom:0;}
  td.email{font-weight:600;}
  td.src{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);}
  td.when{white-space:nowrap;color:var(--muted);}
  td form{margin:0;}
  .del{background:none;border:0;color:#b42318;font:inherit;font-size:13.5px;cursor:pointer;padding:0;}
  .del:hover{text-decoration:underline;}
  .empty{background:#fff;border:1px dashed var(--line);border-radius:14px;padding:56px 20px;text-align:center;}
  .empty h2{margin:0 0 6px;font-size:20px;}
  .empty p{margin:0;color:var(--muted);}
  .pager{display:flex;gap:18px;justify-content:center;align-items:center;margin-top:20px;color:var(--muted);}
  .card.pad{padding:26px 28px;max-width:720px;}
  .card.pad h2{margin:0 0 6px;font-size:19px;}
  .stack{display:grid;gap:10px;margin:18px 0 16px;}
  .stack label{font-size:13.5px;font-weight:600;color:var(--ink-soft);}
  .stack input[type=url]{padding:11px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;width:100%;}
  .stack .check{font-weight:500;display:flex;gap:8px;align-items:center;}
  .row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
  .notice{padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:14.5px;max-width:720px;}
  .notice.ok{background:#e3f6ee;color:#0b5b3b;border:1px solid #b5e3cf;}
  .notice.bad{background:#fdeee6;color:#9a3b12;border:1px solid #f6c9a9;}
  :focus-visible{outline:3px solid var(--thaw);outline-offset:2px;}
</style>
</head>
<body>
<header><nav>
  <a class="brand" href="/"><img src="/img/yeti-logo.png" alt="">OptinYeti</a>
  <a href="/">Dashboard</a>
  <a href="/Popup">Popups</a>
  <a class="{{LEADS}}" href="/admin/Leads">Leads</a>
  <a class="{{INTEGRATIONS}}" href="/admin/Integrations">Integrations</a>
  <a href="/admin/Analytics">Analytics</a>
  <a href="/admin/Settings">Settings</a>
</nav></header>
<main>
""";

    private static string Chrome(string current) =>
        PageTop.Replace("{{TITLE}}", current)
            .Replace("{{LEADS}}", current == "Leads" ? "current" : "")
            .Replace("{{INTEGRATIONS}}", current == "Integrations" ? "current" : "");

    private const string PageBottom = """
</main>
</body>
</html>
""";
}
