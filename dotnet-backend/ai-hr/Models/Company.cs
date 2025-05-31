using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
// using System;
// using System.Collections.Generic;

namespace ai_hr.Models
{
    [Table("companies")]
    public class Company : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("website")]
        public string Website { get; set; }

        [Column("logo_url")]
        public string LogoUrl { get; set; }

        [Column("industry")]
        public string Industry { get; set; }

        [Column("company_size")]
        public string CompanySize { get; set; }

        [Column("headquarters")]
        public Dictionary<string, string> Headquarters { get; set; }

        [Column("founded_year")]
        public int? FoundedYear { get; set; }

        [Column("is_verified")]
        public bool IsVerified { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}