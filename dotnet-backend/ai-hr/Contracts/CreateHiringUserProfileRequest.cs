// using System;
// using System.Collections.Generic;
// using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class CreateHiringUserProfileRequest
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string UserType { get; set; } // Will validate against allowed values

        public Guid? CompanyId { get; set; }

        public string Bio { get; set; }

        public string LinkedinUrl { get; set; }

        public Dictionary<string, object> Location { get; set; }

        public Dictionary<string, object> Preferences { get; set; }
    }
}