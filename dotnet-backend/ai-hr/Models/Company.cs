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

        [Column("email")]
        public string email { get; set; }

        // NEW: Track who created this company for Admin role assignment
        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        // NEW: Temporary field to store creator email until they register
        [Column("creator_email")]
        public string? CreatorEmail { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}