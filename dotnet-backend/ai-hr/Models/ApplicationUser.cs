using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("ApplicationUser")]
    public class ApplicationUser : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }
        [Column("Email")]
        public string Email { get; set; }
        [Column("Password")]
        public string Password { get; set; }
        [Column("FirstName")]
        public string FirstName { get; set; }
        [Column("LastName")]
        public string LastName { get; set; }
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }
        [Column("RefreshToken")]
        public string? RefreshToken { get; set; }
        [Column("RefreshTokenExpiry")]
        public DateTime? RefreshTokenExpiry { get; set; }
        [Column("IsActive")]
        public bool IsActive { get; set; } = true;
        [Column("Roles")]
        public string Roles { get; set; } = "User";
    }
}