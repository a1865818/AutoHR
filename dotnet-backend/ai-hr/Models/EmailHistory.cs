using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("email_history")]
    public class EmailHistory : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("application_id")]
        public Guid ApplicationId { get; set; }

        [Column("template_id")]
        public Guid? TemplateId { get; set; }

        [Column("sent_at")]
        public DateTime SentAt { get; set; }

        [Column("status")]
        public string Status { get; set; }

        [Column("subject")]
        public string Subject { get; set; }

        [Column("body")]
        public string Body { get; set; }
    }
}