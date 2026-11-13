// Reporting and heat maps.
//   POST /api/cro/collect          one beacon per pageview from the popup script: page, device, source, scroll depth, time, clicks
//   GET  /api/cro/heat             click and scroll data for one page, for the overlay drawn on the customer's own site
//   GET  /admin/Reports            campaigns, pages, sources, A/B tests over 7/30/90 days
//   GET  /admin/Reports/export     pages as CSV
//   GET  /admin/Reports/heat       opens the customer's page with a signed, short-lived heat-map token
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;

namespace OptinYeti.Leads;

internal static class Reports
{
    private const int MaxClicksPerPageview = 200;
    private const int RetentionDays = 90;
    private static long _lastPrune;

    public static async Task<bool> Handle(HttpContext ctx, string path)
    {
        switch (path.TrimEnd('/').ToLowerInvariant())
        {
            case "/api/cro/collect": await Collect(ctx); return true;
            case "/api/cro/heat": await Heat(ctx); return true;
            case "/admin/reports": await Page(ctx); return true;
            case "/admin/reports/export": await Export(ctx); return true;
            case "/admin/reports/heat": await OpenHeat(ctx); return true;
            default: return false;
        }
    }

    // ------------------------------------------------------------------ collect

    private static string NormalizeUrl(string raw)
    {
        if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri) || (uri.Scheme != "http" && uri.Scheme != "https")) return "";
        var path = uri.AbsolutePath;
        if (path.Length > 1) path = path.TrimEnd('/');
        var url = uri.Scheme + "://" + uri.Host + path;
        return url.Length > 300 ? url[..300] : url;
    }

    private static string DeviceFrom(string ua)
    {
        if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase) || ua.Contains("Tablet", StringComparison.OrdinalIgnoreCase)) return "Tablet";
        if (ua.Contains("Mobi", StringComparison.OrdinalIgnoreCase) || ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) return "Mobile";
        return "Desktop";
    }

    private static string? Domain(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri)) return LeadsMiddleware.Clip(raw.Trim(), 100);
        return uri.Host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? uri.Host[4..] : uri.Host;
    }

    private static async Task Collect(HttpContext ctx)
    {
        LeadsMiddleware.OpenCors(ctx.Response);
        ctx.Response.Headers["Cache-Control"] = "no-store";
        if (HttpMethods.IsOptions(ctx.Request.Method)) { ctx.Response.StatusCode = 204; return; }
        if (!HttpMethods.IsPost(ctx.Request.Method)) { await LeadsMiddleware.Json(ctx, 405, false, "Use POST"); return; }
        if (!LeadsMiddleware.AllowTrack(LeadsMiddleware.ClientIp(ctx))) { await LeadsMiddleware.Json(ctx, 429, false, "Too many requests"); return; }
        var body = await LeadsMiddleware.ReadBody(ctx, 48 * 1024);
        if (body == null) { await LeadsMiddleware.Json(ctx, 413, false, "Request too large"); return; }

        long tenantId; string url, referrer, utmSource, utmMedium, utmCampaign; int vw, docH, depth, duration;
        var clicks = new List<(double X, int Y, string? Selector)>();
        try
        {
            using var doc = JsonDocument.Parse(body);
            var r = doc.RootElement;
            tenantId = LeadsMiddleware.Int(r, "tenantId") ?? 0;
            url = NormalizeUrl(LeadsMiddleware.Str(r, "url"));
            referrer = LeadsMiddleware.Str(r, "referrer");
            utmSource = LeadsMiddleware.Clip(LeadsMiddleware.Str(r, "utmSource"), 80);
            utmMedium = LeadsMiddleware.Clip(LeadsMiddleware.Str(r, "utmMedium"), 80);
            utmCampaign = LeadsMiddleware.Clip(LeadsMiddleware.Str(r, "utmCampaign"), 120);
            vw = (int)Math.Clamp(LeadsMiddleware.Int(r, "vw") ?? 0, 0, 10000);
            docH = (int)Math.Clamp(LeadsMiddleware.Int(r, "docH") ?? 0, 0, 200000);
            depth = (int)Math.Clamp(LeadsMiddleware.Int(r, "depth") ?? 0, 0, 100);
            duration = (int)Math.Clamp(LeadsMiddleware.Int(r, "duration") ?? 0, 0, 86400);
            if (LeadsMiddleware.TryGet(r, "clicks", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var c in arr.EnumerateArray())
                {
                    if (clicks.Count >= MaxClicksPerPageview) break;
                    if (c.ValueKind != JsonValueKind.Object) continue;
                    if (!LeadsMiddleware.TryGet(c, "x", out var xe) || !xe.TryGetDouble(out var x)) continue;
                    if (!LeadsMiddleware.TryGet(c, "y", out var ye) || !ye.TryGetDouble(out var y)) continue;
                    if (x < 0 || x > 1 || y < 0 || y > 200000) continue;
                    var sel = LeadsMiddleware.Clip(LeadsMiddleware.Str(c, "s"), 120);
                    clicks.Add((Math.Round(x, 4), (int)y, sel.Length == 0 ? null : sel));
                }
            }
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException)
        {
            await LeadsMiddleware.Json(ctx, 400, false, "Invalid JSON");
            return;
        }
        if (tenantId <= 0 || url.Length == 0) { await LeadsMiddleware.Json(ctx, 400, false, "tenantId and url are required"); return; }

        var now = DateTime.UtcNow;
        var at = LeadsMiddleware.Timestamp(now);
        var device = DeviceFrom(ctx.Request.Headers.UserAgent.ToString());
        await using var db = await LeadsMiddleware.Open();
        await using (var check = db.CreateCommand())
        {
            check.CommandText = "select 1 from Tenants where Id = @t";
            check.Parameters.AddWithValue("@t", tenantId);
            if (await check.ExecuteScalarAsync() == null) { await LeadsMiddleware.Json(ctx, 404, false, "Unknown site"); return; }
        }
        await using var tx = await db.BeginTransactionAsync();
        await using (var cmd = db.CreateCommand())
        {
            cmd.Transaction = (SqliteTransaction)tx;
            cmd.CommandText = "insert into CroPageviews (TenantId, Url, Device, ReferrerDomain, UtmSource, UtmMedium, UtmCampaign, ViewportW, DocH, ScrollDepth, Duration, Clicks, At) " +
                              "values (@t, @u, @d, @r, @us, @um, @uc, @vw, @dh, @depth, @dur, @n, @at)";
            cmd.Parameters.AddWithValue("@t", tenantId);
            cmd.Parameters.AddWithValue("@u", url);
            cmd.Parameters.AddWithValue("@d", device);
            cmd.Parameters.AddWithValue("@r", (object?)Domain(referrer) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@us", LeadsMiddleware.Nullable(utmSource));
            cmd.Parameters.AddWithValue("@um", LeadsMiddleware.Nullable(utmMedium));
            cmd.Parameters.AddWithValue("@uc", LeadsMiddleware.Nullable(utmCampaign));
            cmd.Parameters.AddWithValue("@vw", vw);
            cmd.Parameters.AddWithValue("@dh", docH);
            cmd.Parameters.AddWithValue("@depth", depth);
            cmd.Parameters.AddWithValue("@dur", duration);
            cmd.Parameters.AddWithValue("@n", clicks.Count);
            cmd.Parameters.AddWithValue("@at", at);
            await cmd.ExecuteNonQueryAsync();
        }
        if (clicks.Count > 0)
        {
            await using var cmd = db.CreateCommand();
            cmd.Transaction = (SqliteTransaction)tx;
            cmd.CommandText = "insert into CroClicks (TenantId, Url, X, Y, DocH, Selector, At) values (@t, @u, @x, @y, @dh, @s, @at)";
            var px = cmd.Parameters.Add("@x", SqliteType.Real);
            var py = cmd.Parameters.Add("@y", SqliteType.Integer);
            var ps = cmd.Parameters.Add("@s", SqliteType.Text);
            cmd.Parameters.AddWithValue("@t", tenantId);
            cmd.Parameters.AddWithValue("@u", url);
            cmd.Parameters.AddWithValue("@dh", docH);
            cmd.Parameters.AddWithValue("@at", at);
            foreach (var (x, y, sel) in clicks)
            {
                px.Value = x; py.Value = y; ps.Value = (object?)sel ?? DBNull.Value;
                await cmd.ExecuteNonQueryAsync();
            }
        }
        await tx.CommitAsync();

        // Old data goes away on its own, at most once an hour.
        var hour = now.Ticks / TimeSpan.TicksPerHour;
        if (Interlocked.Exchange(ref _lastPrune, hour) != hour)
        {
            await using var prune = db.CreateCommand();
            prune.CommandText = "delete from CroClicks where At < @cut; delete from CroPageviews where At < @cut";
            prune.Parameters.AddWithValue("@cut", LeadsMiddleware.Timestamp(now.AddDays(-RetentionDays)));
            await prune.ExecuteNonQueryAsync();
        }
        await LeadsMiddleware.Json(ctx, 200, true, "ok");
    }

    // --------------------------------------------------------------- heat token

    private static byte[]? _secret;

    private static async Task<byte[]> Secret(SqliteConnection db)
    {
        if (_secret != null) return _secret;
        await using (var read = db.CreateCommand())
        {
            read.CommandText = "select Value from AddonSettings where Key = 'heat_secret'";
            if (await read.ExecuteScalarAsync() is string stored) return _secret = Convert.FromBase64String(stored);
        }
        var fresh = RandomNumberGenerator.GetBytes(32);
        await using (var write = db.CreateCommand())
        {
            write.CommandText = "insert or ignore into AddonSettings (Key, Value) values ('heat_secret', @v)";
            write.Parameters.AddWithValue("@v", Convert.ToBase64String(fresh));
            await write.ExecuteNonQueryAsync();
        }
        await using (var read = db.CreateCommand())
        {
            read.CommandText = "select Value from AddonSettings where Key = 'heat_secret'";
            return _secret = Convert.FromBase64String((string)(await read.ExecuteScalarAsync())!);
        }
    }

    private static string B64(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static async Task<string> MakeToken(SqliteConnection db, long tenantId, string url, long expires)
    {
        var mac = HMACSHA256.HashData(await Secret(db), Encoding.UTF8.GetBytes(tenantId + "|" + url + "|" + expires));
        return expires.ToString(CultureInfo.InvariantCulture) + "." + B64(mac);
    }

    private static async Task<bool> CheckToken(SqliteConnection db, long tenantId, string url, string token)
    {
        var dot = token.IndexOf('.');
        if (dot <= 0 || !long.TryParse(token[..dot], NumberStyles.None, CultureInfo.InvariantCulture, out var expires)) return false;
        if (expires < DateTimeOffset.UtcNow.ToUnixTimeSeconds()) return false;
        var expected = await MakeToken(db, tenantId, url, expires);
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(token));
    }

    private static async Task Heat(HttpContext ctx)
    {
        LeadsMiddleware.OpenCors(ctx.Response);
        ctx.Response.Headers["Cache-Control"] = "no-store";
        if (HttpMethods.IsOptions(ctx.Request.Method)) { ctx.Response.StatusCode = 204; return; }
        if (!HttpMethods.IsGet(ctx.Request.Method)) { await LeadsMiddleware.Json(ctx, 405, false, "Use GET"); return; }
        long.TryParse(ctx.Request.Query["tenantId"], NumberStyles.None, CultureInfo.InvariantCulture, out var tenantId);
        var url = NormalizeUrl(ctx.Request.Query["url"].ToString());
        var token = ctx.Request.Query["token"].ToString();
        await using var db = await LeadsMiddleware.Open();
        if (tenantId <= 0 || url.Length == 0 || !await CheckToken(db, tenantId, url, token))
        {
            await LeadsMiddleware.Json(ctx, 403, false, "Heat map link has expired. Open it again from Reports.");
            return;
        }
        var clicks = new List<object>();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select X, Y, DocH from CroClicks where TenantId = @t and Url = @u order by Id desc limit 5000";
            cmd.Parameters.AddWithValue("@t", tenantId);
            cmd.Parameters.AddWithValue("@u", url);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                clicks.Add(new { x = reader.GetDouble(0), y = reader.GetInt64(1), h = reader.GetInt64(2) });
        }
        var depth = new int[10];
        long views = 0;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select ScrollDepth from CroPageviews where TenantId = @t and Url = @u";
            cmd.Parameters.AddWithValue("@t", tenantId);
            cmd.Parameters.AddWithValue("@u", url);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                views++;
                var d = reader.GetInt64(0);
                for (var band = 0; band < 10; band++) if (d >= (band + 1) * 10) depth[band]++;
            }
        }
        var top = new List<object>();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "select Selector, count(*) from CroClicks where TenantId = @t and Url = @u and Selector is not null group by Selector order by 2 desc limit 10";
            cmd.Parameters.AddWithValue("@t", tenantId);
            cmd.Parameters.AddWithValue("@u", url);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) top.Add(new { selector = reader.GetString(0), clicks = reader.GetInt64(1) });
        }
        ctx.Response.ContentType = "application/json; charset=utf-8";
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { pageviews = views, clicks, depth, top }));
    }

    private static async Task OpenHeat(HttpContext ctx)
    {
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var url = NormalizeUrl(ctx.Request.Query["url"].ToString());
        long.TryParse(ctx.Request.Query["tenantId"], NumberStyles.None, CultureInfo.InvariantCulture, out var asked);
        var tenantId = viewer.SeesAllTenants && asked > 0 ? asked : viewer.TenantId;
        if (url.Length == 0 || tenantId <= 0) { ctx.Response.Redirect("/admin/Reports"); return; }
        await using var db = await LeadsMiddleware.Open();
        var token = await MakeToken(db, tenantId, url, DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds());
        ctx.Response.Headers["Cache-Control"] = "no-store";
        ctx.Response.Redirect(url + "#oyheat=" + tenantId.ToString(CultureInfo.InvariantCulture) + ":" + token);
    }

    // ------------------------------------------------------------------- report

    private sealed record Row(string Key, long A, long B, long C, long D, double E);

    private static int Days(HttpContext ctx)
    {
        int.TryParse(ctx.Request.Query["days"], NumberStyles.None, CultureInfo.InvariantCulture, out var days);
        return days is 7 or 30 or 90 ? days : 30;
    }

    private static string Num(long n) => n.ToString("#,0", CultureInfo.InvariantCulture);
    private static string Pct(long part, long whole) => LeadsMiddleware.Percent(part, whole);
    private static string H(string s) => LeadsMiddleware.H(s);

    private static async Task<List<Row>> PagesRows(SqliteConnection db, long tenantId, bool all, string since)
    {
        var rows = new List<Row>();
        await using var cmd = db.CreateCommand();
        cmd.CommandText =
            "select p.Url, count(*) as Views, avg(p.ScrollDepth), avg(p.Duration), sum(p.Clicks), " +
            "(select count(*) from EmailCaptures e where (@all = 1 or e.TenantId = @t) and e.CapturedAt >= @since and e.Source like p.Url || '%') as Leads " +
            "from CroPageviews p where (@all = 1 or p.TenantId = @t) and p.At >= @since group by p.Url order by Views desc limit 200";
        cmd.Parameters.AddWithValue("@t", tenantId);
        cmd.Parameters.AddWithValue("@all", all ? 1 : 0);
        cmd.Parameters.AddWithValue("@since", since);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            rows.Add(new Row(reader.GetString(0), reader.GetInt64(1), (long)Math.Round(reader.GetDouble(2)), (long)Math.Round(reader.GetDouble(3)), reader.GetInt64(4), reader.GetInt64(5)));
        return rows;
    }

    private static async Task Page(HttpContext ctx)
    {
        if (!HttpMethods.IsGet(ctx.Request.Method)) { ctx.Response.StatusCode = 405; return; }
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var days = Days(ctx);
        var sinceDate = DateTime.UtcNow.Date.AddDays(-(days - 1));
        var since = LeadsMiddleware.Timestamp(sinceDate);
        var all = viewer.SeesAllTenants;
        var t = viewer.TenantId;

        await using var db = await LeadsMiddleware.Open();
        SqliteCommand Cmd(string sql)
        {
            var c = db.CreateCommand();
            c.CommandText = sql;
            c.Parameters.AddWithValue("@t", t);
            c.Parameters.AddWithValue("@all", all ? 1 : 0);
            c.Parameters.AddWithValue("@since", since);
            return c;
        }

        // Headline numbers
        long pageviews = 0, popupViews = 0, popupConversions = 0, leads = 0, mobile = 0, desktop = 0, tablet = 0;
        await using (var cmd = Cmd("select count(*), sum(case Device when 'Mobile' then 1 else 0 end), sum(case Device when 'Desktop' then 1 else 0 end), sum(case Device when 'Tablet' then 1 else 0 end) from CroPageviews where (@all = 1 or TenantId = @t) and At >= @since"))
        await using (var r = await cmd.ExecuteReaderAsync())
            if (await r.ReadAsync()) { pageviews = r.GetInt64(0); mobile = r.IsDBNull(1) ? 0 : r.GetInt64(1); desktop = r.IsDBNull(2) ? 0 : r.GetInt64(2); tablet = r.IsDBNull(3) ? 0 : r.GetInt64(3); }
        await using (var cmd = Cmd("select ifnull(sum(a.Views),0), ifnull(sum(a.Conversions),0) from PopupAnalytics a join Popups p on p.Id = a.PopupId where (@all = 1 or p.TenantId = @t) and a.Date >= @since"))
        await using (var r = await cmd.ExecuteReaderAsync())
            if (await r.ReadAsync()) { popupViews = r.GetInt64(0); popupConversions = r.GetInt64(1); }
        await using (var cmd = Cmd("select count(*) from EmailCaptures where (@all = 1 or TenantId = @t) and CapturedAt >= @since"))
            leads = Convert.ToInt64(await cmd.ExecuteScalarAsync(), CultureInfo.InvariantCulture);

        // Daily series
        var daily = new SortedDictionary<string, (long Views, long Conv, long Leads)>();
        for (var d = 0; d < days; d++) daily[sinceDate.AddDays(d).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)] = (0, 0, 0);
        await using (var cmd = Cmd("select substr(a.Date,1,10), sum(a.Views), sum(a.Conversions) from PopupAnalytics a join Popups p on p.Id = a.PopupId where (@all = 1 or p.TenantId = @t) and a.Date >= @since group by 1"))
        await using (var r = await cmd.ExecuteReaderAsync())
            while (await r.ReadAsync()) { var k = r.GetString(0); if (daily.ContainsKey(k)) daily[k] = (r.GetInt64(1), r.GetInt64(2), daily[k].Leads); }
        await using (var cmd = Cmd("select substr(CapturedAt,1,10), count(*) from EmailCaptures where (@all = 1 or TenantId = @t) and CapturedAt >= @since group by 1"))
        await using (var r = await cmd.ExecuteReaderAsync())
            while (await r.ReadAsync()) { var k = r.GetString(0); if (daily.ContainsKey(k)) daily[k] = (daily[k].Views, daily[k].Conv, r.GetInt64(1)); }

        // Campaigns
        var campaigns = new StringBuilder();
        await using (var cmd = Cmd("select p.Id, p.Name, p.Status, ifnull(sum(a.Views),0), ifnull(sum(a.Clicks),0), ifnull(sum(a.Conversions),0), ifnull(sum(a.MobileViews),0), ifnull(sum(a.DesktopViews),0), " +
                                   "(select count(*) from EmailCaptures e where e.PopupId = p.Id and e.CapturedAt >= @since) " +
                                   "from Popups p left join PopupAnalytics a on a.PopupId = p.Id and a.Date >= @since where (@all = 1 or p.TenantId = @t) group by p.Id order by 4 desc"))
        await using (var r = await cmd.ExecuteReaderAsync())
            while (await r.ReadAsync())
            {
                var id = r.GetInt64(0); var views = r.GetInt64(3); var conv = r.GetInt64(5); var mob = r.GetInt64(6); var desk = r.GetInt64(7);
                campaigns.Append("<tr><td class=\"email\"><a href=\"/Popup/Edit/").Append(id).Append("\">").Append(H(r.GetString(1))).Append("</a></td>")
                    .Append("<td>").Append(r.GetInt64(2) == 1 ? "Published" : "Draft").Append("</td><td>").Append(Num(views)).Append("</td><td>").Append(Num(r.GetInt64(4))).Append("</td>")
                    .Append("<td>").Append(Num(conv)).Append("</td><td>").Append(Pct(conv, views)).Append("</td><td>").Append(Num(r.GetInt64(8))).Append("</td>")
                    .Append("<td class=\"when\">").Append(views == 0 ? "-" : Pct(mob, mob + desk) + " mobile").Append("</td>")
                    .Append("<td><a href=\"/Popup/Test/").Append(id).Append("\">A/B</a></td></tr>");
            }

        // Pages
        var pageRows = await PagesRows(db, t, all, since);
        var pages = new StringBuilder();
        foreach (var row in pageRows)
            pages.Append("<tr><td class=\"src\" title=\"").Append(H(row.Key)).Append("\">").Append(H(row.Key)).Append("</td><td>").Append(Num(row.A)).Append("</td><td>").Append(row.B).Append("%</td>")
                .Append("<td>").Append(row.C).Append("s</td><td>").Append(Num(row.D)).Append("</td><td>").Append(Num((long)row.E)).Append("</td><td>").Append(Pct((long)row.E, row.A)).Append("</td>")
                .Append("<td><a href=\"/admin/Reports/heat?url=").Append(Uri.EscapeDataString(row.Key)).Append(all ? "&amp;tenantId=" + t : "").Append("\" target=\"_blank\" rel=\"noopener\">Heat map</a></td></tr>");

        // Sources
        var sources = new StringBuilder();
        await using (var cmd = Cmd("select coalesce(nullif(UtmSource,''), nullif(ReferrerDomain,''), 'Direct / unknown') as Src, coalesce(nullif(UtmCampaign,''), '') as Camp, count(*), avg(ScrollDepth) " +
                                   "from CroPageviews where (@all = 1 or TenantId = @t) and At >= @since group by 1, 2 order by 3 desc limit 25"))
        await using (var r = await cmd.ExecuteReaderAsync())
            while (await r.ReadAsync())
                sources.Append("<tr><td class=\"email\">").Append(H(r.GetString(0))).Append("</td><td>").Append(H(r.GetString(1))).Append("</td><td>").Append(Num(r.GetInt64(2))).Append("</td><td>").Append(Math.Round(r.GetDouble(3))).Append("%</td></tr>");

        // A/B tests
        var tests = new StringBuilder();
        await using (var cmd = Cmd("select p.Id, p.Name, x.IsRunning, x.ViewsA, x.ConversionsA, x.ViewsB, x.ConversionsB from PopupTests x join Popups p on p.Id = x.PopupId where (@all = 1 or p.TenantId = @t) order by x.UpdatedAt desc"))
        await using (var r = await cmd.ExecuteReaderAsync())
            while (await r.ReadAsync())
                tests.Append("<tr><td class=\"email\"><a href=\"/Popup/Test/").Append(r.GetInt64(0)).Append("\">").Append(H(r.GetString(1))).Append("</a></td><td>").Append(r.GetInt64(2) == 1 ? "Running" : "Paused")
                    .Append("</td><td>").Append(Pct(r.GetInt64(4), r.GetInt64(3))).Append(" (").Append(r.GetInt64(3)).Append(")</td><td>").Append(Pct(r.GetInt64(6), r.GetInt64(5))).Append(" (").Append(r.GetInt64(5)).Append(")</td><td>")
                    .Append(H(LeadsMiddleware.Verdict(r.GetInt64(3), r.GetInt64(4), r.GetInt64(5), r.GetInt64(6)))).Append("</td></tr>");

        // Chart (inline SVG, no scripts)
        var chart = Chart(daily);
        string Tab(int n) => "<a class=\"btn" + (n == days ? "" : " ghost") + "\" href=\"/admin/Reports?days=" + n + "\">" + n + " days</a>";

        var body = new StringBuilder();
        body.Append("<div class=\"head\"><div><h1>Reports</h1><p class=\"sub\">Last ").Append(days).Append(" days. Page data comes from sites running your OptinYeti script.</p></div>")
            .Append("<div class=\"actions\">").Append(Tab(7)).Append(Tab(30)).Append(Tab(90)).Append("<a class=\"btn ghost\" href=\"/admin/Reports/export?days=").Append(days).Append("\">Export pages CSV</a></div></div>")
            .Append("<div class=\"kpis\">")
            .Append(Kpi("Pageviews", Num(pageviews), pageviews == 0 ? "No page data yet" : Pct(mobile, pageviews) + " mobile · " + Pct(desktop, pageviews) + " desktop" + (tablet > 0 ? " · " + Pct(tablet, pageviews) + " tablet" : "")))
            .Append(Kpi("Popups shown", Num(popupViews), popupViews == 0 ? "No popup views in this period" : "across " + Pct(popupViews, Math.Max(pageviews, 1)) + " of pageviews"))
            .Append(Kpi("Popup conversions", Num(popupConversions), Pct(popupConversions, popupViews) + " of popups shown"))
            .Append(Kpi("Leads captured", Num(leads), Pct(leads, pageviews) + " of pageviews"))
            .Append("</div>")
            .Append("<section><h2>Popups shown, conversions and leads by day</h2><div class=\"card chart\">").Append(chart).Append("</div></section>")
            .Append("<section><h2>Campaigns</h2>").Append(campaigns.Length == 0 ? Empty("No campaigns yet.") :
                "<div class=\"card\"><table><thead><tr><th>Campaign</th><th>Status</th><th>Shown</th><th>Clicks</th><th>Conversions</th><th>Rate</th><th>Leads</th><th>Devices</th><th></th></tr></thead><tbody>" + campaigns + "</tbody></table></div>").Append("</section>")
            .Append("<section><h2>Pages</h2>").Append(pages.Length == 0 ? Empty("No page data yet. Pages are recorded once the OptinYeti script is on your site and visitors arrive.") :
                "<div class=\"card\"><table><thead><tr><th>Page</th><th>Pageviews</th><th>Avg scroll</th><th>Avg time</th><th>Clicks</th><th>Leads</th><th>Lead rate</th><th></th></tr></thead><tbody>" + pages + "</tbody></table></div>").Append("</section>")
            .Append("<section><h2>Where visitors came from</h2>").Append(sources.Length == 0 ? Empty("No source data yet.") :
                "<div class=\"card\"><table><thead><tr><th>Source</th><th>Campaign (UTM)</th><th>Pageviews</th><th>Avg scroll</th></tr></thead><tbody>" + sources + "</tbody></table></div>").Append("</section>")
            .Append("<section><h2>A/B tests</h2>").Append(tests.Length == 0 ? Empty("No tests yet. Open any popup and press A/B test.") :
                "<div class=\"card\"><table><thead><tr><th>Popup</th><th>State</th><th>A rate (views)</th><th>B rate (views)</th><th>Reading</th></tr></thead><tbody>" + tests + "</tbody></table></div>").Append("</section>")
            .Append("<p class=\"sub\" style=\"max-width:720px\">Heat maps open the live page on your site with click density and scroll-depth bands drawn over it. Links work for two hours. Click data is kept for ").Append(RetentionDays).Append(" days and holds positions and element names only, never text or personal data. Visitors with Do Not Track on are not recorded.</p>");

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(LeadsMiddleware.Chrome("Reports") + Styles + body + LeadsMiddleware.PageBottom);
    }

    private static string Kpi(string label, string value, string note) =>
        "<div class=\"kpi\"><span class=\"kpi-label\">" + label + "</span><span class=\"kpi-value\">" + value + "</span><span class=\"kpi-note\">" + H(note) + "</span></div>";

    private static string Empty(string text) => "<div class=\"empty\"><p>" + H(text) + "</p></div>";

    private static string Chart(SortedDictionary<string, (long Views, long Conv, long Leads)> daily)
    {
        const int w = 1040, h = 220, left = 46, bottom = 30, top = 14;
        var n = daily.Count;
        var max = Math.Max(1, daily.Values.Max(v => Math.Max(v.Views, Math.Max(v.Conv, v.Leads))));
        var plotW = w - left - 10; var plotH = h - top - bottom;
        double X(int i) => left + (n == 1 ? plotW / 2.0 : plotW * i / (double)(n - 1));
        double Y(long v) => top + plotH - plotH * v / (double)max;
        string Path(Func<(long Views, long Conv, long Leads), long> pick)
        {
            var sb = new StringBuilder();
            var i = 0;
            foreach (var v in daily.Values) { sb.Append(i == 0 ? "M" : "L").Append(X(i).ToString("0.#", CultureInfo.InvariantCulture)).Append(' ').Append(Y(pick(v)).ToString("0.#", CultureInfo.InvariantCulture)); i++; }
            return sb.ToString();
        }
        var svg = new StringBuilder();
        svg.Append("<svg viewBox=\"0 0 ").Append(w).Append(' ').Append(h).Append("\" width=\"100%\" role=\"img\" aria-label=\"Daily popups shown, conversions and leads\" style=\"font:12px IBM Plex Sans,system-ui,sans-serif\">");
        for (var g = 0; g <= 4; g++)
        {
            var val = max * g / 4; var y = Y(val);
            svg.Append("<line x1=\"").Append(left).Append("\" x2=\"").Append(w - 10).Append("\" y1=\"").Append(y.ToString("0.#", CultureInfo.InvariantCulture)).Append("\" y2=\"").Append(y.ToString("0.#", CultureInfo.InvariantCulture)).Append("\" stroke=\"#dfeeed\"/>")
               .Append("<text x=\"").Append(left - 6).Append("\" y=\"").Append((y + 4).ToString("0.#", CultureInfo.InvariantCulture)).Append("\" text-anchor=\"end\" fill=\"#4d6b70\">").Append(val).Append("</text>");
        }
        var keys = daily.Keys.ToList();
        var step = Math.Max(1, n / 10);
        for (var i = 0; i < n; i += step)
            svg.Append("<text x=\"").Append(X(i).ToString("0.#", CultureInfo.InvariantCulture)).Append("\" y=\"").Append(h - 8).Append("\" text-anchor=\"middle\" fill=\"#4d6b70\">").Append(keys[i][5..]).Append("</text>");
        svg.Append("<path d=\"").Append(Path(v => v.Views)).Append("\" fill=\"none\" stroke=\"#0F6B6B\" stroke-width=\"2.5\"/>")
           .Append("<path d=\"").Append(Path(v => v.Conv)).Append("\" fill=\"none\" stroke=\"#FF8A3D\" stroke-width=\"2.5\"/>")
           .Append("<path d=\"").Append(Path(v => v.Leads)).Append("\" fill=\"none\" stroke=\"#0B1F2B\" stroke-width=\"2\" stroke-dasharray=\"5 4\"/>")
           .Append("<g transform=\"translate(").Append(left).Append(",2)\"><rect width=\"12\" height=\"3\" y=\"5\" fill=\"#0F6B6B\"/><text x=\"16\" y=\"10\">Popups shown</text>")
           .Append("<rect x=\"120\" width=\"12\" height=\"3\" y=\"5\" fill=\"#FF8A3D\"/><text x=\"136\" y=\"10\">Conversions</text>")
           .Append("<rect x=\"230\" width=\"12\" height=\"3\" y=\"5\" fill=\"#0B1F2B\"/><text x=\"246\" y=\"10\">Leads</text></g></svg>");
        return svg.ToString();
    }

    private static async Task Export(HttpContext ctx)
    {
        var viewer = await LeadsMiddleware.RequireViewer(ctx);
        if (viewer == null) return;
        var days = Days(ctx);
        var since = LeadsMiddleware.Timestamp(DateTime.UtcNow.Date.AddDays(-(days - 1)));
        await using var db = await LeadsMiddleware.Open();
        var rows = await PagesRows(db, viewer.TenantId, viewer.SeesAllTenants, since);
        var sb = new StringBuilder("Page,Pageviews,Average scroll depth %,Average time s,Clicks,Leads,Lead rate\r\n");
        foreach (var r in rows)
            sb.Append(LeadsMiddleware.Csv(r.Key)).Append(',').Append(r.A).Append(',').Append(r.B).Append(',').Append(r.C).Append(',').Append(r.D).Append(',').Append((long)r.E).Append(',').Append(Pct((long)r.E, r.A)).Append("\r\n");
        ctx.Response.ContentType = "text/csv; charset=utf-8";
        ctx.Response.Headers["Content-Disposition"] = "attachment; filename=\"optinyeti-pages-" + days + "d.csv\"";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        await ctx.Response.WriteAsync(sb.ToString());
    }

    private const string Styles = """
<style>
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:0 0 26px;}
  .kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:4px;}
  .kpi-label{font-size:13px;color:var(--muted);font-weight:600;}
  .kpi-value{font-family:"Baloo 2",system-ui,sans-serif;font-size:34px;line-height:1.1;font-weight:700;}
  .kpi-note{font-size:13px;color:var(--muted);}
  .chart{padding:18px 20px 10px;}
  section{margin:0 0 30px;}
  section > h2{font-size:20px;margin:0 0 12px;}
  td.src{max-width:360px;}
</style>
""";
}
