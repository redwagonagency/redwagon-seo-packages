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
//   GET  /Popup/SelectTemplate   template gallery driven by the PopupTemplates table
//   GET  /Templates              public template gallery with live previews
//   POST /Popup/UseTemplate      creates a ready-to-edit draft popup from a template
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
            if (path.Equals("/Templates/Start", StringComparison.OrdinalIgnoreCase))
            {
                HandleTemplateStart(ctx);
                return;
            }
            if (path.Equals("/Templates", StringComparison.OrdinalIgnoreCase))
            {
                await HandlePublicTemplates(ctx);
                return;
            }
            if (path.Equals("/Popup/SelectTemplate", StringComparison.OrdinalIgnoreCase))
            {
                await HandleTemplateGallery(ctx);
                return;
            }
            if (path.Equals("/Popup/UseTemplate", StringComparison.OrdinalIgnoreCase))
            {
                await HandleUseTemplate(ctx);
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
            // A visitor who picked a template before signing up lands back on it once signed in.
            if (ctx.Request.Cookies.TryGetValue(PickCookie, out var picked) &&
                !path.StartsWith("/Account", StringComparison.OrdinalIgnoreCase) &&
                !path.StartsWith("/Popup/SelectTemplate", StringComparison.OrdinalIgnoreCase) &&
                (await ctx.AuthenticateAsync(IdentityScheme)).Succeeded)
            {
                ctx.Response.Cookies.Delete(PickCookie);
                ctx.Response.Headers["Cache-Control"] = "no-store";
                ctx.Response.Redirect(long.TryParse(picked, NumberStyles.None, CultureInfo.InvariantCulture, out var pickedId)
                    ? "/Popup/SelectTemplate?pick=" + pickedId.ToString(CultureInfo.InvariantCulture)
                    : "/Popup/SelectTemplate");
                return;
            }
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
            updated = InjectTemplatesLink(updated);
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

    private static readonly Regex PricingLink = new(
        "<a\\b[^>]*href=\"/Home/Pricing\"[^>]*>[^<]*Pricing[^<]*</a>", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Adds a Templates link beside every Pricing link in the app's own menus.
    private static string InjectTemplatesLink(string html)
    {
        if (html.Contains("href=\"/Templates\"", StringComparison.OrdinalIgnoreCase)) return html;
        return PricingLink.Replace(html, m =>
            Regex.Replace(m.Value.Replace("/Home/Pricing", "/Templates", StringComparison.OrdinalIgnoreCase), "Pricing", "Templates") + "\n" + m.Value);
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

    private sealed record Viewer(bool SeesAllTenants, long TenantId, string UserId);

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

        return new Viewer(auth.Principal!.IsInRole("SuperAdmin"), tenantId, userId);
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

    // -------------------------------------------------------------- templates

    private const long SpinWheelType = -1; // no template type is hidden any more (-1 matches nothing)

    private static readonly string[] WheelColors = { "#0F6B6B", "#FF8A3D", "#4DD9D2", "#0B1F2B", "#FACC15", "#EAF6F7" };

    private sealed record Prize(string Label, string Code);

    // Prizes come from the template's settings when it lists any; otherwise a sensible starter set.
    private static List<Prize> WheelPrizes(JsonElement o)
    {
        var prizes = new List<Prize>();
        if (o.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in o.EnumerateObject())
            {
                if (property.Value.ValueKind != JsonValueKind.Array) continue;
                if (!property.Name.Contains("segment", StringComparison.OrdinalIgnoreCase) &&
                    !property.Name.Contains("prize", StringComparison.OrdinalIgnoreCase)) continue;
                foreach (var item in property.Value.EnumerateArray())
                {
                    string label = "", code = "";
                    if (item.ValueKind == JsonValueKind.String) label = item.GetString() ?? "";
                    else if (item.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var field in item.EnumerateObject())
                        {
                            if (field.Value.ValueKind != JsonValueKind.String) continue;
                            var name = field.Name.ToLowerInvariant();
                            if (label.Length == 0 && name is "label" or "text" or "name" or "title") label = field.Value.GetString() ?? "";
                            else if (code.Length == 0 && name.Contains("code")) code = field.Value.GetString() ?? "";
                        }
                    }
                    label = Clip(label.Trim(), 24);
                    if (label.Length > 0 && prizes.Count < 12) prizes.Add(new Prize(label, Clip(code.Trim(), 30)));
                }
            }
        }
        if (prizes.Count >= 2) return prizes;
        return new List<Prize>
        {
            new("10% off", "SPIN10"), new("Free shipping", "FREESHIP"), new("5% off", "SPIN5"),
            new("15% off", "SPIN15"), new("Free gift", "GIFT"), new("20% off", "SPIN20")
        };
    }

    private static readonly Regex UnstyledButton = new("<(button|a class=\"btn[^\"]*\")(?![^>]*\\sstyle=)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex HexColor = new("^#[0-9a-fA-F]{3,8}$", RegexOptions.Compiled);

    private static JsonElement ParseOptions(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            return doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            using var doc = JsonDocument.Parse("{}");
            return doc.RootElement.Clone();
        }
    }

    private static string Opt(JsonElement options, string key, string fallback = "")
    {
        if (options.ValueKind != JsonValueKind.Object) return fallback;
        var value = Str(options, key);
        return value.Length == 0 ? fallback : value;
    }

    private static string ColorOpt(JsonElement options, string key, string fallback)
    {
        var value = Opt(options, key, fallback);
        return HexColor.IsMatch(value) ? value : fallback;
    }

    private static string SafeUrl(string url, string fallback = "#")
    {
        if (url.StartsWith("/", StringComparison.Ordinal) && !url.StartsWith("//", StringComparison.Ordinal)) return url;
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)
            ? url
            : fallback;
    }

    // Black or white text, whichever reads better on the given background.
    private static string TextOn(string hex)
    {
        var h = hex.TrimStart('#');
        if (h.Length == 3) h = string.Concat(h.Select(c => new string(c, 2)));
        if (h.Length < 6) return "#ffffff";
        var r = Convert.ToInt32(h[..2], 16);
        var g = Convert.ToInt32(h.Substring(2, 2), 16);
        var b = Convert.ToInt32(h.Substring(4, 2), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? "#0B1F2B" : "#ffffff";
    }

    private const string FieldStyle =
        "display:block;width:100%;box-sizing:border-box;padding:13px 14px;margin:0 0 10px;border:1.5px solid #cbd5d8;border-radius:9px;font-size:16px;font-family:inherit;background:#ffffff;color:#0B1F2B;";

    private static string ButtonStyle(string background) =>
        "display:block;width:100%;box-sizing:border-box;padding:14px 18px;border:0;border-radius:9px;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;text-align:center;background:" +
        background + ";color:" + TextOn(background) + ";";

    private static string Shell(string background, string text, string inner) =>
        "<div style=\"margin:-40px;padding:46px 38px 40px;border-radius:12px;text-align:center;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:" +
        background + ";color:" + text + ";\">" + inner + "</div>";

    private static string Heading(string text) =>
        text.Length == 0 ? "" : "<h2 style=\"font-size:27px;line-height:1.2;font-weight:700;margin:0 0 10px;color:inherit;\">" + H(text) + "</h2>";

    private static string Lead(string text) =>
        text.Length == 0 ? "" : "<p style=\"font-size:16px;line-height:1.5;margin:0 0 22px;opacity:.85;color:inherit;\">" + H(text) + "</p>";

    // Turns a template's settings into the self-contained HTML the popup script renders.
    private static string RenderTemplateHtml(long type, JsonElement o)
    {
        switch (type)
        {
            case 1: // email collector
            {
                var bg = ColorOpt(o, "BackgroundColor", "#ffffff");
                var text = ColorOpt(o, "TextColor", TextOn(bg));
                var button = ColorOpt(o, "ButtonColor", "#0F6B6B");
                var success = "<div style=\"text-align:center;padding:30px 10px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;\"><h3 style=\"font-size:24px;margin:0 0 10px;color:#0B1F2B;\">Thank you!</h3><p style=\"font-size:16px;margin:0;color:#4d6b70;\">" +
                              H(Opt(o, "SuccessMessage", "You're on the list.")) + "</p></div>";
                var form = "<form style=\"margin:0;\" data-success=\"" + H(success) + "\">" +
                           (Bool(o, "CollectName") ? "<input type=\"text\" name=\"name\" placeholder=\"Your name\" autocomplete=\"name\" style=\"" + FieldStyle + "\">" : "") +
                           "<input type=\"email\" name=\"email\" required placeholder=\"you@company.com\" autocomplete=\"email\" style=\"" + FieldStyle + "\">" +
                           (Bool(o, "CollectPhone") ? "<input type=\"tel\" name=\"phone\" placeholder=\"Phone number\" autocomplete=\"tel\" style=\"" + FieldStyle + "\">" : "") +
                           "<button type=\"submit\" style=\"" + ButtonStyle(button) + "\">" + H(Opt(o, "ButtonText", "Subscribe")) + "</button></form>";
                var privacy = Opt(o, "PrivacyText");
                return Shell(bg, text, Heading(Opt(o, "Heading")) + Lead(Opt(o, "SubHeading")) + form +
                    (privacy.Length == 0 ? "" : "<p style=\"font-size:12px;margin:14px 0 0;opacity:.7;color:inherit;\">" + H(privacy) + "</p>"));
            }
            case 2: // advertising
            {
                var bg = ColorOpt(o, "BackgroundColor", "#ffffff");
                var button = ColorOpt(o, "ButtonColor", "#0F6B6B");
                var code = Opt(o, "DiscountCode");
                return Shell(bg, TextOn(bg), Heading(Opt(o, "Heading")) + Lead(Opt(o, "SubHeading")) +
                    (code.Length == 0 ? "" : "<p style=\"font-size:15px;margin:0 0 18px;color:inherit;\">Use code <strong style=\"letter-spacing:1px;\">" + H(code) + "</strong></p>") +
                    "<a class=\"cta-button\" href=\"" + H(SafeUrl(Opt(o, "ButtonUrl", "#"))) + "\" style=\"" + ButtonStyle(button) + "\">" + H(Opt(o, "ButtonText", "Learn more")) + "</a>");
            }
            case 7: // coupon
            {
                var bg = ColorOpt(o, "BackgroundColor", "#ffffff");
                var codeBg = ColorOpt(o, "CodeBackgroundColor", "#212529");
                var codeText = ColorOpt(o, "CodeTextColor", "#ffffff");
                var codeBox = "<div style=\"display:inline-block;padding:14px 26px;margin:0 0 16px;border:2px dashed " + codeText + ";border-radius:10px;font-size:24px;font-weight:700;letter-spacing:2px;background:" +
                              codeBg + ";color:" + codeText + ";\">" + H(Opt(o, "CouponCode", "WELCOME")) + "</div>";
                var description = Opt(o, "Description");
                var value = Opt(o, "DiscountValue");
                var heading = Opt(o, "Heading");
                // Skip the big discount line when the heading already states a number.
                var top = Heading(heading) +
                          (value.Length == 0 || heading.Any(char.IsDigit) ? "" : "<p style=\"font-size:34px;font-weight:800;margin:0 0 12px;color:inherit;\">" + H(value) + "</p>");
                if (!Bool(o, "RequireEmail"))
                    return Shell(bg, TextOn(bg), top + codeBox + Lead(description));
                var reveal = "<div style=\"text-align:center;padding:30px 10px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;\"><h3 style=\"font-size:22px;margin:0 0 16px;color:#0B1F2B;\">Here is your code</h3>" +
                             codeBox + "<p style=\"font-size:15px;margin:0;color:#4d6b70;\">" + H(description) + "</p></div>";
                return Shell(bg, TextOn(bg), top + Lead("Enter your email and we will show your code.") +
                    "<form style=\"margin:0;\" data-success=\"" + H(reveal) + "\">" +
                    "<input type=\"email\" name=\"email\" required placeholder=\"you@company.com\" autocomplete=\"email\" style=\"" + FieldStyle + "\">" +
                    "<button type=\"submit\" style=\"" + ButtonStyle("#0F6B6B") + "\">" + H(Opt(o, "ButtonText", "Get my code")) + "</button></form>");
            }
            case 5: // spin wheel
            {
                var bg = ColorOpt(o, "BackgroundColor", "#ffffff");
                var prizes = WheelPrizes(o);
                var step = 360.0 / prizes.Count;
                var stops = new StringBuilder();
                var labels = new StringBuilder();
                for (var i = 0; i < prizes.Count; i++)
                {
                    var color = WheelColors[i % WheelColors.Length];
                    if (i > 0) stops.Append(',');
                    stops.Append(color).Append(' ').Append((i * step).ToString("0.##", CultureInfo.InvariantCulture)).Append("deg ")
                        .Append(((i + 1) * step).ToString("0.##", CultureInfo.InvariantCulture)).Append("deg");
                    labels.Append("<span style=\"position:absolute;left:50%;top:50%;width:0;height:0;transform:rotate(")
                        .Append(((i + 0.5) * step).ToString("0.##", CultureInfo.InvariantCulture))
                        .Append("deg);\"><span style=\"position:absolute;left:-42px;top:-104px;width:84px;text-align:center;font-size:12px;line-height:1.15;font-weight:700;color:")
                        .Append(TextOn(color)).Append(";\">").Append(H(prizes[i].Label)).Append("</span></span>");
                }
                var data = JsonSerializer.Serialize(prizes.Select(p => new { label = p.Label, code = p.Code }));
                var wheel = "<div style=\"position:relative;width:240px;height:240px;margin:0 auto 22px;\">" +
                            "<div data-oy-wheel-disc style=\"position:relative;width:100%;height:100%;box-sizing:border-box;border-radius:50%;border:6px solid #0B1F2B;transition:transform 4s cubic-bezier(.17,.67,.2,1);background:conic-gradient(" +
                            stops + ");\">" + labels + "</div>" +
                            "<div style=\"position:absolute;left:50%;top:-8px;margin-left:-11px;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:20px solid #FF8A3D;\"></div>" +
                            "<div style=\"position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#0B1F2B;border:3px solid #ffffff;box-sizing:border-box;\"></div></div>";
                return Shell(bg, TextOn(bg),
                    "<div data-oy-wheel=\"" + H(data) + "\">" + Heading(Opt(o, "Heading", "Spin to win")) + Lead(Opt(o, "SubHeading")) + wheel +
                    "<form data-oy-spin style=\"margin:0;\">" +
                    "<input type=\"email\" name=\"email\" required placeholder=\"you@company.com\" autocomplete=\"email\" style=\"" + FieldStyle + "\">" +
                    "<button type=\"submit\" style=\"" + ButtonStyle(ColorOpt(o, "ButtonColor", "#0F6B6B")) + "\">" + H(Opt(o, "ButtonText", "Spin the wheel")) + "</button></form></div>");
            }
            case 6: // video
            {
                var url = Opt(o, "VideoUrl");
                var embeddable = url.StartsWith("https://www.youtube.com/embed/", StringComparison.Ordinal) ||
                                 url.StartsWith("https://www.youtube-nocookie.com/embed/", StringComparison.Ordinal) ||
                                 url.StartsWith("https://player.vimeo.com/video/", StringComparison.Ordinal);
                var player = embeddable
                    ? "<div style=\"position:relative;height:0;padding-bottom:56.25%;margin:0 0 20px;border-radius:10px;overflow:hidden;background:#000;\"><iframe src=\"" + H(url) +
                      "\" title=\"Video\" allow=\"encrypted-media; picture-in-picture\" allowfullscreen style=\"position:absolute;top:0;left:0;width:100%;height:100%;border:0;\"></iframe></div>"
                    : "";
                var cta = Bool(o, "ShowCTA")
                    ? "<a class=\"cta-button\" href=\"" + H(SafeUrl(Opt(o, "CTAUrl", "#"))) + "\" style=\"" + ButtonStyle("#FF8A3D") + "\">" + H(Opt(o, "CTAText", "Learn more")) + "</a>"
                    : "";
                return Shell("#0B1F2B", "#ffffff", player + Heading(Opt(o, "Heading")) + Lead(Opt(o, "Description")) + cta);
            }
            case 3: // lightbox
            {
                var image = SafeUrl(Opt(o, "ImageUrl"), "");
                return image.Length == 0
                    ? Shell("#ffffff", "#0B1F2B", Lead("Add an image to this popup."))
                    : "<img src=\"" + H(image) + "\" alt=\"\" style=\"display:block;max-width:100%;height:auto;margin:0 auto;border-radius:8px;\">";
            }
            case 4: // inline call to action
            {
                var bg = ColorOpt(o, "BackgroundColor", "#F3F9F9");
                var inner = UnstyledButton.Replace(Opt(o, "Content"),
                    m => "<" + m.Groups[1].Value + " style=\"" + ButtonStyle("#0F6B6B").Replace("display:block;width:100%;", "display:inline-block;margin-top:14px;") + "\"");
                return Shell(bg, TextOn(bg), inner);
            }
            default: // message
            {
                var accent = Opt(o, "MessageType") switch
                {
                    "success" => "#16A34A",
                    "warning" => "#D97706",
                    "error" => "#DC2626",
                    _ => "#0F6B6B"
                };
                return "<div style=\"border-left:5px solid " + accent + ";padding:6px 0 6px 18px;text-align:left;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;\"><p style=\"font-size:17px;line-height:1.5;margin:0;color:#0B1F2B;\">" +
                       H(Opt(o, "Message")) + "</p></div>";
            }
        }
    }

    private static async Task HandleTemplateGallery(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        var viewer = await RequireViewer(ctx);
        if (viewer == null) return;

        var notice = ctx.Request.Query["msg"].ToString() switch
        {
            "limit" => "<div class=\"notice bad\">Your plan's popup limit is reached. Delete a popup or <a href=\"/admin/Subscription\">upgrade your plan</a> to add another.</div>",
            "missing" => "<div class=\"notice bad\">That template is no longer available.</div>",
            _ => ""
        };

        var (sections, total) = await BuildTemplateSections(signedIn: true);
        var body = new StringBuilder();
        body.Append("<div class=\"head\"><div><h1>Choose a template</h1><p class=\"sub\">")
            .Append(total.ToString(CultureInfo.InvariantCulture))
            .Append(" ready-made popups. Preview one, then change the words, colors and targeting.</p></div>")
            .Append("<div class=\"actions\"><a class=\"btn ghost\" href=\"/Popup/Create\">Start from scratch</a></div></div>")
            .Append(notice).Append(sections)
            .Append(PreviewDialog.Replace("{{ACTION}}",
                "<form method=\"post\" action=\"/Popup/UseTemplate\"><input type=\"hidden\" name=\"id\" value=\"\"><button type=\"submit\" class=\"btn\">Use this template</button></form>"));

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(Chrome("Templates") + body + PageBottom);
    }

    private const string PickCookie = "oy_tpl";

    // Remembers the chosen template through sign-up or sign-in, then sends the visitor on.
    private static void HandleTemplateStart(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        ctx.Response.Headers["Cache-Control"] = "no-store";
        if (!long.TryParse(ctx.Request.Query["id"], NumberStyles.None, CultureInfo.InvariantCulture, out var id) || id <= 0)
        {
            ctx.Response.Redirect("/Templates");
            return;
        }
        var pick = id.ToString(CultureInfo.InvariantCulture);
        if (ctx.Request.Query["have"] == "1" || ctx.Request.Cookies.ContainsKey(".AspNetCore.Identity.Application"))
        {
            // The sign-in page keeps this address as its return target.
            ctx.Response.Redirect("/Popup/SelectTemplate?pick=" + pick);
            return;
        }
        ctx.Response.Cookies.Append(PickCookie, pick, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromDays(2),
            Path = "/"
        });
        ctx.Response.Redirect("/Account/Register");
    }

    private static async Task HandlePublicTemplates(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method) && !HttpMethods.IsHead(ctx.Request.Method))
        {
            ctx.Response.StatusCode = 405;
            return;
        }
        var (sections, total) = await BuildTemplateSections(signedIn: false);
        var body = new StringBuilder();
        body.Append("<div class=\"head\"><div><h1>Popup templates</h1><p class=\"sub\">")
            .Append(total.ToString(CultureInfo.InvariantCulture))
            .Append(" ready-made popups for email signups, sales, coupons and announcements. Click any one to try it.</p></div>")
            .Append("<div class=\"actions\"><a class=\"btn\" href=\"/Account/Register\">Start free</a></div></div>")
            .Append(sections)
            .Append(PreviewDialog.Replace("{{ACTION}}",
                "<a class=\"btn\" data-start=\"/Templates/Start?id=\" href=\"/Account/Register\">Start free with this template</a><a class=\"btn ghost\" data-start=\"/Templates/Start?have=1&amp;id=\" href=\"/Popup/SelectTemplate\">I have an account</a>"));

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "public, max-age=300";
        await ctx.Response.WriteAsync(PublicChrome() + body + PageBottom);
    }

    // Category sections of template cards. Each card carries its rendered popup in a <template>
    // element so the preview dialog can show the real thing.
    private static async Task<(string Html, int Total)> BuildTemplateSections(bool signedIn)
    {
        var sections = new Dictionary<string, StringBuilder>(StringComparer.OrdinalIgnoreCase);
        var order = new List<string>();
        var total = 0;
        await using (var db = await Open())
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "select Id, Name, Description, Category, PreviewImageUrl, IsPremium, Type, TypeSpecificOptions from PopupTemplates " +
                "where IsActive = 1 and Type <> @spin order by SortOrder, Id";
            cmd.Parameters.AddWithValue("@spin", SpinWheelType);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var category = Text(reader, 3);
                if (category.Length == 0) category = "Other";
                if (!sections.TryGetValue(category, out var cards))
                {
                    cards = new StringBuilder();
                    sections[category] = cards;
                    order.Add(category);
                }
                total++;
                var id = reader.GetInt64(0).ToString(CultureInfo.InvariantCulture);
                var name = Text(reader, 1);
                var preview = SafeUrl(Text(reader, 4), "");
                cards.Append("<article class=\"tpl\" data-id=\"").Append(id).Append("\" data-name=\"").Append(H(name)).Append("\">")
                    .Append("<button type=\"button\" class=\"thumb pv-open\" aria-label=\"Preview ").Append(H(name)).Append("\">")
                    .Append(preview.Length == 0 ? "" : "<img loading=\"lazy\" src=\"" + H(preview) + "\" alt=\"\">")
                    .Append("<span class=\"peek\">Preview</span></button>")
                    .Append("<div class=\"tpl-body\"><h3>").Append(H(name))
                    .Append(!reader.IsDBNull(5) && reader.GetInt64(5) != 0 ? " <span class=\"tag\">Premium</span>" : "")
                    .Append("</h3><p>").Append(H(Text(reader, 2))).Append("</p><div class=\"tpl-actions\">")
                    .Append("<button type=\"button\" class=\"btn ghost pv-open\">Preview</button>")
                    .Append(signedIn
                        ? "<form method=\"post\" action=\"/Popup/UseTemplate\"><input type=\"hidden\" name=\"id\" value=\"" + id + "\"><button type=\"submit\" class=\"btn\">Use this template</button></form>"
                        : "<a class=\"btn\" href=\"/Templates/Start?id=" + id + "\">Use it free</a>")
                    .Append("</div></div><template>")
                    .Append(RenderTemplateHtml(reader.GetInt64(6), ParseOptions(Text(reader, 7))))
                    .Append("</template></article>");
            }
        }

        var html = new StringBuilder("<nav class=\"cats\" aria-label=\"Template categories\">");
        foreach (var category in order)
            html.Append("<a href=\"#").Append(H(Slug(category))).Append("\">").Append(H(category)).Append("</a>");
        html.Append("</nav>");
        foreach (var category in order)
            html.Append("<section id=\"").Append(H(Slug(category))).Append("\"><h2>").Append(H(category))
                .Append("</h2><div class=\"tpl-grid\">").Append(sections[category]).Append("</div></section>");
        return (html.ToString(), total);
    }

    private const string PreviewDialog = """
<dialog id="pv" aria-labelledby="pv-title">
  <div class="pv-bar"><strong id="pv-title" class="pv-title"></strong><button type="button" class="pv-close" aria-label="Close preview">Close</button></div>
  <div class="pv-stage"></div>
  <p class="pv-note">This is a live preview. Nothing you type here is saved.</p>
  <div class="pv-actions">{{ACTION}}</div>
</dialog>
<script>
(function(){
  var dlg = document.getElementById('pv');
  if (!dlg || !dlg.showModal) return;
  var stage = dlg.querySelector('.pv-stage');
  var title = dlg.querySelector('.pv-title');
  function spin(form){
    var box = stage.querySelector('[data-oy-wheel]'), disc = stage.querySelector('[data-oy-wheel-disc]');
    var prizes = [];
    try { prizes = JSON.parse(box.getAttribute('data-oy-wheel')) || []; } catch (e) {}
    if (!disc || !prizes.length) return;
    var i = Math.floor(Math.random() * prizes.length), step = 360 / prizes.length;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) disc.style.transition = 'none';
    disc.style.transform = 'rotate(' + (1800 - (i + 0.5) * step) + 'deg)';
    form.style.visibility = 'hidden';
    setTimeout(function(){
      if (!form.isConnected) return;
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
      form.replaceWith(out);
    }, still ? 50 : 4200);
  }
  function open(card){
    var t = card.querySelector('template');
    stage.innerHTML = t ? t.innerHTML : '';
    title.textContent = card.getAttribute('data-name');
    var idField = dlg.querySelector('input[name=id]');
    if (idField) idField.value = card.getAttribute('data-id');
    dlg.querySelectorAll('a[data-start]').forEach(function(a){
      a.href = a.getAttribute('data-start') + card.getAttribute('data-id');
    });
    stage.querySelectorAll('form').forEach(function(f){
      f.addEventListener('submit', function(e){
        e.preventDefault();
        if (f.hasAttribute('data-oy-spin')) { spin(f); return; }
        var s = f.getAttribute('data-success');
        if (s) stage.innerHTML = s;
      });
    });
    stage.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(e){ e.preventDefault(); });
    });
    dlg.showModal();
  }
  document.querySelectorAll('.tpl').forEach(function(card){
    card.querySelectorAll('.pv-open').forEach(function(b){
      b.addEventListener('click', function(){ open(card); });
    });
  });
  dlg.querySelector('.pv-close').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function(){ stage.innerHTML = ''; });
  var pick = (new URLSearchParams(location.search).get('pick') || '').replace(/\D/g, '');
  var picked = pick ? document.querySelector('.tpl[data-id="' + pick + '"]') : null;
  if (picked) { picked.scrollIntoView({ block: 'center' }); open(picked); }
})();
</script>
""";

    private static string Slug(string value) =>
        Regex.Replace(value.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');

    private static async Task HandleUseTemplate(HttpContext ctx)
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
        long.TryParse(form["id"], NumberStyles.Integer, CultureInfo.InvariantCulture, out var templateId);

        await using var db = await Open();

        string name = "", options = "";
        long type = 0, trigger = 0, delay = 0, frequency = 0;
        var found = false;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "select Name, Type, TypeSpecificOptions, DefaultTrigger, DefaultDelayMs, DefaultFrequency from PopupTemplates " +
                "where Id = @id and IsActive = 1 and Type <> @spin";
            cmd.Parameters.AddWithValue("@id", templateId);
            cmd.Parameters.AddWithValue("@spin", SpinWheelType);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                found = true;
                name = Text(reader, 0);
                type = reader.GetInt64(1);
                options = Text(reader, 2);
                trigger = reader.GetInt64(3);
                delay = reader.GetInt64(4);
                frequency = reader.GetInt64(5);
            }
        }
        if (!found)
        {
            ctx.Response.Redirect("/Popup/SelectTemplate?msg=missing");
            return;
        }

        long limit = -1, existing = 0;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "select ifnull((select p.MaxPopups from Tenants t join SubscriptionPlans p on p.Id = t.SubscriptionPlanId where t.Id = @t), -1), " +
                "(select count(*) from Popups where TenantId = @t)";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                limit = reader.GetInt64(0);
                existing = reader.GetInt64(1);
            }
        }
        if (limit >= 0 && existing >= limit)
        {
            ctx.Response.Redirect("/Popup/SelectTemplate?msg=limit");
            return;
        }

        var o = ParseOptions(options);
        var content = JsonSerializer.Serialize(new { html = RenderTemplateHtml(type, o) });
        var now = Timestamp(DateTime.UtcNow);
        long newId;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText =
                "insert into Popups (Name, Type, Status, Content, Title, Subtitle, CallToAction, TargetingRules, Trigger, DelayMs, Frequency, " +
                "ShowOnMobile, ShowOnDesktop, TenantId, CreatedById, Views, Clicks, Conversions, CreatedAt, UpdatedAt) " +
                "values (@name, @type, 0, @content, @title, @subtitle, @cta, '{}', @trigger, @delay, @frequency, 1, 1, @tenant, @user, 0, 0, 0, @now, @now); " +
                "select last_insert_rowid();";
            cmd.Parameters.AddWithValue("@name", Clip(name, 180));
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@content", content);
            cmd.Parameters.AddWithValue("@title", Nullable(Clip(Opt(o, "Heading", Opt(o, "Message")), 300)));
            cmd.Parameters.AddWithValue("@subtitle", Nullable(Clip(Opt(o, "SubHeading", Opt(o, "Description")), 500)));
            cmd.Parameters.AddWithValue("@cta", Nullable(Clip(Opt(o, "ButtonText", Opt(o, "CTAText")), 100)));
            cmd.Parameters.AddWithValue("@trigger", trigger);
            cmd.Parameters.AddWithValue("@delay", delay);
            cmd.Parameters.AddWithValue("@frequency", frequency);
            cmd.Parameters.AddWithValue("@tenant", viewer.TenantId);
            cmd.Parameters.AddWithValue("@user", viewer.UserId);
            cmd.Parameters.AddWithValue("@now", now);
            newId = Convert.ToInt64(await cmd.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
        }
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "update Tenants set PopupCount = (select count(*) from Popups where TenantId = @t) where Id = @t";
            cmd.Parameters.AddWithValue("@t", viewer.TenantId);
            await cmd.ExecuteNonQueryAsync();
        }

        ctx.Response.Redirect("/Popup/Edit/" + newId.ToString(CultureInfo.InvariantCulture));
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
  .cats{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 26px;}
  .cats a{background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:7px 16px;font-size:14px;font-weight:500;text-decoration:none;color:var(--ink-soft);}
  .cats a:hover{border-color:var(--teal);color:var(--teal);}
  section{margin:0 0 38px;scroll-margin-top:20px;}
  section > h2{font-size:21px;margin:0 0 14px;}
  .tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px;}
  .tpl{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;}
  .tpl .thumb{display:block;width:100%;padding:0;border:0;aspect-ratio:8/5;background:#DCEEEE;cursor:pointer;position:relative;font:inherit;}
  .tpl .thumb img{display:block;width:100%;height:100%;object-fit:cover;}
  .tpl .thumb .peek{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--ink);color:#fff;border-radius:999px;padding:8px 18px;font-size:14px;font-weight:600;opacity:0;transition:opacity .15s;}
  .tpl .thumb:hover .peek,.tpl .thumb:focus-visible .peek{opacity:1;}
  .tpl-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:6px;}
  .tpl-actions .btn{text-align:center;padding:10px 8px;}
  dialog#pv{border:0;background:transparent;padding:16px;max-width:none;max-height:none;width:min(548px,100vw);color:var(--ink);}
  dialog#pv::backdrop{background:rgba(11,31,43,.78);}
  .pv-bar{display:flex;justify-content:space-between;align-items:center;gap:16px;color:#fff;margin-bottom:12px;font-size:17px;}
  .pv-close{background:none;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:999px;padding:5px 14px;font:inherit;font-size:14px;cursor:pointer;}
  .pv-stage{background:#fff;border-radius:12px;padding:40px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);}
  .pv-note{color:#cfe8e6;font-size:13px;text-align:center;margin:12px 0;}
  .pv-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
  .pv-actions form{margin:0;}
  header nav .spacer{flex:1;}
  @media (max-width:640px){header nav{flex-wrap:wrap;gap:14px;}.pv-stage{padding:40px 28px;}}
  .tpl-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:8px;flex:1;}
  .tpl-body h3{font-size:16.5px;margin:0;font-family:inherit;font-weight:600;}
  .tpl-body p{margin:0;color:var(--muted);font-size:14px;flex:1;}
  .tpl-body form{margin:0;}
  .tpl-body .btn{width:100%;}
  .tag{display:inline-block;background:#FFF1E6;color:#9a3b12;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:600;vertical-align:middle;}
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
  <a class="{{TEMPLATES}}" href="/Popup/SelectTemplate">Templates</a>
  <a class="{{LEADS}}" href="/admin/Leads">Leads</a>
  <a class="{{INTEGRATIONS}}" href="/admin/Integrations">Integrations</a>
  <a href="/admin/Analytics">Analytics</a>
  <a href="/admin/Settings">Settings</a>
</nav></header>
<main>
""";

    private static string Chrome(string current) =>
        PageTop.Replace("{{TITLE}}", current)
            .Replace("{{TEMPLATES}}", current == "Templates" ? "current" : "")
            .Replace("{{LEADS}}", current == "Leads" ? "current" : "")
            .Replace("{{INTEGRATIONS}}", current == "Integrations" ? "current" : "");

    private const string PublicNav = """
<header><nav>
  <a class="brand" href="/"><img src="/img/yeti-logo.png" alt="">OptinYeti</a>
  <a href="/Home/Features">Features</a>
  <a class="current" href="/Templates">Templates</a>
  <a href="/Home/Pricing">Pricing</a>
  <a href="/Blog">Blog</a>
  <span class="spacer"></span>
  <a href="/Account/Login">Log in</a>
  <a class="btn" href="/Account/Register" style="color:#fff">Start free</a>
</nav></header>
""";

    private static string PublicChrome()
    {
        var top = PageTop.Replace("{{TITLE}}", "Popup Templates")
            .Replace("<meta name=\"robots\" content=\"noindex\">",
                "<meta name=\"description\" content=\"Browse OptinYeti popup templates for email signups, sales, coupons, video and announcements. Preview each one live, then start free.\">\n<link rel=\"canonical\" href=\"https://optinyeti.com/Templates\">");
        var start = top.IndexOf("<header>", StringComparison.Ordinal);
        var end = top.IndexOf("</header>", StringComparison.Ordinal) + "</header>".Length;
        return top[..start] + PublicNav.Trim() + top[end..];
    }

    private const string PageBottom = """
</main>
</body>
</html>
""";
}
