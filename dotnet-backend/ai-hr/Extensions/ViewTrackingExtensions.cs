using ai_hr.Services;

namespace ai_hr.Extensions
{
    public static class ViewTrackingExtensions
    {
        public static IServiceCollection AddViewTracking(this IServiceCollection services)
        {
            // Register the view tracking service
            services.AddScoped<IJobViewTrackingService, JobViewTrackingService>();

            // Add session support for anonymous user tracking
            services.AddDistributedMemoryCache();
            services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromHours(24); // 24 hour session timeout
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.Name = ".AI_HR.Session";
            });

            return services;
        }

        public static WebApplication UseViewTracking(this WebApplication app)
        {
            // Enable session middleware (must be before UseRouting)
            app.UseSession();

            return app;
        }
    }
}