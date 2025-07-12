using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("email_templates")]
    public class EmailTemplate : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("company_id")]
        public Guid CompanyId { get; set; }

        [Column("name")]
        public string Name { get; set; }

        [Column("subject")]
        public string Subject { get; set; }

        [Column("body")]
        public string Body { get; set; }

        [Column("is_default")]
        public bool IsDefault { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}