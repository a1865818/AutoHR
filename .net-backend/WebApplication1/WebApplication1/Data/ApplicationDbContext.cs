using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using WebApplication1.Entities;

namespace WebApplication1.Data
{
    public class ApplicationDbContext:IdentityDbContext<ApplicationUser>
    {
       public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Jobs> Jobs { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<ApplicationUser> (entity =>
            {
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
            });

            builder.Entity<Jobs>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                      .IsRequired();
                

                entity.Property(e => e.Title)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.Company)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.Location)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.Type)
                      .IsRequired()
                      .HasMaxLength(20); 

                entity.Property(e => e.Experience)
                      .HasMaxLength(100);

                entity.Property(e => e.Salary).HasMaxLength(100);

                entity.Property(e => e.Description)
                      .HasMaxLength(500);

                entity.Property(e => e.PostedDate)
                      .IsRequired();
           

                entity.Property(e => e.Status)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.Urgency)
                      .HasMaxLength(20);

                entity.Property(e => e.Applicants)
                      .IsRequired();

                entity.Property(e => e.Requirements)
                        .HasColumnName("Requirements")
                        .HasColumnType("nvarchar(max)");

            });


        }
    }
}
