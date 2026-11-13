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
                Console.Error.WriteLine("[OptinYeti.Leads] job file " + file + " could not be renamed: " + ex.Message);
            }
            Console.WriteLine("[OptinYeti.Leads] job " + Path.GetFileName(file) + (ok ? " done" : " failed"));
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
}
