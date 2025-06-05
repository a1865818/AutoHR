// using System;
// using System.Collections.Generic;

namespace ai_hr.Contracts
{
    public class UpdateCompanyRequest
    {
        public string Name { get; set; }

        public string Description { get; set; }

        public string Website { get; set; }

        public string LogoUrl { get; set; }

        public string Industry { get; set; }

        public string CompanySize { get; set; }

        public Dictionary<string, string> Headquarters { get; set; }

        public int? FoundedYear { get; set; }

        public bool? IsVerified { get; set; }

        public string email { get; set; }
    }
}