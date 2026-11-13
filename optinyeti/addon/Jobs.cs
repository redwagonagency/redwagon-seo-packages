// Seed jobs: one-off work the owner drops next to the database and the app runs once at start-up.
// A job is a JSON file in <db folder>/jobs/. After it runs it is renamed *.done (or *.failed) with a
// result file beside it, so a job never runs twice. Jobs are written by the server owner only, which is
// why they can act for a tenant without a browser session.
//
//   { "job": "launch-kit", "tenantId": 5, "userId": "optional AspNetUsers id",
//     "sites": [ { "domain": "example.com", "offer": "a free audit", "button": "Send it" } ] }
//
// Known jobs:
//   launch-kit   the three Sites launch-kit popups for each listed site (site must be registered)
//   popups       a full set of template popups for one registered site:
//                { "job": "popups", "tenantId": 5, "domain": "example.com", "replace": ["Old popup name", ...],
//                  "popups": [ { "name": "...", "type": 1, "options": { ...template settings... },
//                                "layout": { "mode": "inline", ... }, "urlTargeting": "example.com/blog",
//                                "trigger": 1, "delay": 0, "frequency": 1, "status": 1 } ] }
//                "replace" removes popups of that name first, but only ones that never had a view.
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace OptinYeti.Leads;

internal static class Jobs
{
    private static int _ran;

    public static async Task RunPending(SqliteConnection db, string dbPath)
    {
        if (Interlocked.Exchange(ref _ran, 1) == 1) return;
        var dir = Path.Combine(Path.GetDirectoryName(dbPath) ?? ".", "jobs");
        if (!Directory.Exists(dir)) return;
        foreach (var file in Directory.GetFiles(dir, "*.json").OrderBy(f => f, StringComparer.Ordinal))
        {
            var log = new StringBuilder();
            var ok = false;
            try
            {
                using var doc = JsonDocument.Parse(await File.ReadAllTextAsync(file));
                var root = doc.RootElement;
                var job = root.TryGetProperty("job", out var j) ? j.GetString() ?? "" : "";
                switch (job)
                {
                    case "launch-kit": await LaunchKit(db, root, log); ok = true; break;
                    case "popups": await Popups(db, root, log); ok = true; break;
                    default: log.Append("unknown job: ").Append(job).Append('\n'); break;
                }
            }
            catch (Exception ex)
            {
                log.Append("failed: ").Append(ex.GetType().Name).Append(": ").Append(ex.Message).Append('\n');
            }
            var done = file[..^5] + (ok ? ".done" : ".failed");
            try
            {
                File.Move(file, done, overwrite: true);
                await File.WriteAllTextAsync(done + ".log", log.ToString());
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[OptinYeti.Leads jobs] job file " + file + " could not be renamed: " + ex.Message);
            }
            Console.WriteLine("[OptinYeti.Leads jobs] job " + Path.GetFileName(file) + (ok ? " done" : " failed"));
        }
    }

    private static async Task LaunchKit(SqliteConnection db, JsonElement root, StringBuilder log)
    {
        var tenantId = root.GetProperty("tenantId").GetInt64();
        var userId = root.TryGetProperty("userId", out var u) && u.ValueKind == JsonValueKind.String ? u.GetString() ?? "" : "";
        if (userId.Length == 0)
        {
            // The account owner: the first active user of the tenant.
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "select Id from AspNetUsers where TenantId = @t and IsActive = 1 order by Id limit 1";
            cmd.Parameters.AddWithValue("@t", tenantId);
            userId = (await cmd.ExecuteScalarAsync() as string) ?? throw new InvalidOperationException("tenant " + tenantId + " has no active user");
        }
        var sites = await Sites.List(db, tenantId);
        foreach (var site in root.GetProperty("sites").EnumerateArray())
        {
            var domain = Sites.NormalizeDomain(site.GetProperty("domain").GetString() ?? "") ?? "";
            var match = sites.FirstOrDefault(s => s.Domain == domain);
            if (match.Domain == null) { log.Append(domain).Append(": not registered, skipped\n"); continue; }
            var offer = site.TryGetProperty("offer", out var o) ? o.GetString() ?? "" : "";
            var button = site.TryGetProperty("button", out var b) ? b.GetString() ?? "" : "";
            long already;
            await using (var cmd = db.CreateCommand())
            {
                cmd.CommandText = "select count(*) from Popups where TenantId = @t and Name like @n";
                cmd.Parameters.AddWithValue("@t", tenantId);
                cmd.Parameters.AddWithValue("@n", (match.Name.Length == 0 ? domain : match.Name) + " - %");
                already = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
            }
            if (already > 0) { log.Append(domain).Append(": kit already present, skipped\n"); continue; }
            var ids = await Sites.CreateKit(db, tenantId, userId, domain, match.Name, LeadsMiddleware.Clip(offer, 140), LeadsMiddleware.Clip(button, 40));
            log.Append(domain).Append(": popups ").Append(string.Join(", ", ids)).Append('\n');
        }
    }

    private static async Task Popups(SqliteConnection db, JsonElement root, StringBuilder log)
    {
        var tenantId = root.GetProperty("tenantId").GetInt64();
        var domain = Sites.NormalizeDomain(root.GetProperty("domain").GetString() ?? "") ?? throw new InvalidOperationException("bad domain");
        var sites = await Sites.List(db, tenantId);
        if (!sites.Any(s => s.Domain == domain)) throw new InvalidOperationException(domain + " is not registered for tenant " + tenantId);
        var userId = root.TryGetProperty("userId", out var u) && u.ValueKind == JsonValueKind.String ? u.GetString() ?? "" : "";
        if (userId.Length == 0)
        {
            await using var cmd = db.CreateCommand();
            cmd.CommandText = "select Id from AspNetUsers where TenantId = @t and IsActive = 1 order by Id limit 1";
            cmd.Parameters.AddWithValue("@t", tenantId);
            userId = (await cmd.ExecuteScalarAsync() as string) ?? throw new InvalidOperationException("tenant " + tenantId + " has no active user");
        }
        if (root.TryGetProperty("replace", out var replace) && replace.ValueKind == JsonValueKind.Array)
        {
            foreach (var name in replace.EnumerateArray())
            {
                await using var cmd = db.CreateCommand();
                cmd.CommandText = "delete from Popups where TenantId = @t and Name = @n and Views = 0 and Clicks = 0 and Conversions = 0";
                cmd.Parameters.AddWithValue("@t", tenantId);
                cmd.Parameters.AddWithValue("@n", name.GetString() ?? "");
                var n = await cmd.ExecuteNonQueryAsync();
                log.Append("removed ").Append(n).Append(" x ").Append(name.GetString()).Append('\n');
            }
        }
        foreach (var p in root.GetProperty("popups").EnumerateArray())
        {
            var name = LeadsMiddleware.Clip(p.GetProperty("name").GetString() ?? "", 180);
            long exists;
            await using (var cmd = db.CreateCommand())
            {
                cmd.CommandText = "select count(*) from Popups where TenantId = @t and Name = @n";
                cmd.Parameters.AddWithValue("@t", tenantId);
                cmd.Parameters.AddWithValue("@n", name);
                exists = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
            }
            if (exists > 0) { log.Append(name).Append(": already exists, skipped\n"); continue; }
            var type = p.TryGetProperty("type", out var ty) ? ty.GetInt64() : 1;
            var options = LeadsMiddleware.ParseOptions(p.TryGetProperty("options", out var o) ? o.GetRawText() : "{}");
            Dictionary<string, object>? layout = null;
            if (p.TryGetProperty("layout", out var l) && l.ValueKind == JsonValueKind.Object)
            {
                layout = new Dictionary<string, object>();
                foreach (var prop in l.EnumerateObject())
                    layout[prop.Name] = prop.Value.ValueKind switch
                    {
                        JsonValueKind.Number => prop.Value.GetInt64(),
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        _ => prop.Value.GetString() ?? ""
                    };
            }
            var targeting = p.TryGetProperty("urlTargeting", out var ut) && ut.ValueKind == JsonValueKind.String && (ut.GetString() ?? "").Length > 0
                ? ut.GetString()! : domain;
            var id = await LeadsMiddleware.InsertPopup(db, tenantId, userId, name, type, options, layout,
                JsonSerializer.Serialize(new { urlTargeting = targeting }),
                trigger: p.TryGetProperty("trigger", out var tr) ? tr.GetInt64() : 0,
                delay: p.TryGetProperty("delay", out var de) ? de.GetInt64() : 0,
                frequency: p.TryGetProperty("frequency", out var fr) ? fr.GetInt64() : 1,
                status: p.TryGetProperty("status", out var st) ? st.GetInt64() : 1);
            log.Append(name).Append(": popup ").Append(id).Append('\n');
        }
        await LeadsMiddleware.RefreshPopupCount(db, tenantId);
    }
}
