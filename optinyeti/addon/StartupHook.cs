// The app's deps.json does not list this add-on, so the runtime would not find it by name.
// DOTNET_STARTUP_HOOKS loads this assembly by path before the app starts; the resolver below
// then answers the by-name lookup made for ASPNETCORE_HOSTINGSTARTUPASSEMBLIES.
internal class StartupHook
{
    public static void Initialize()
    {
        System.Runtime.Loader.AssemblyLoadContext.Default.Resolving += (context, name) =>
            name.Name == "OptinYeti.Leads"
                ? context.LoadFromAssemblyPath(typeof(StartupHook).Assembly.Location)
                : null;
    }
}
