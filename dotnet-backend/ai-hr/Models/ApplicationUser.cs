using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("ApplicationUser")]
    public class ApplicationUser : BaseModel
    {
        [PrimaryKey("id", false)]
        public int Id { get; set; }
        [Column("Email")]
        public string Email { get; set; }
        [Column("Password")]
        public string Password { get; set; }
        [Column("FirstName")]
        public string FirstName { get; set; }
        [Column("LastName")]
        public string LastName { get; set; }
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}