using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
// using System;
// using System.Collections.Generic;
// using System.ComponentModel.DataAnnotations;

namespace ai_hr.Models
{
    [Table("hiring_user_profiles")]
    public class HiringUserProfile : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("FirstName")]
        public string FirstName { get; set; }

        [Column("LastName")]
        public string LastName { get; set; }

        [Column("Email")]
        public string Email { get; set; }

        [Column("user_type")]
        public string UserType { get; set; }

        [Column("company_id")]
        public Guid? CompanyId { get; set; }

        [Column("bio")]
        public string Bio { get; set; }

        [Column("linkedin_url")]
        public string LinkedinUrl { get; set; }

        [Column("location")]
        public Dictionary<string, object> Location { get; set; }

        [Column("preferences")]
        public Dictionary<string, object> Preferences { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}