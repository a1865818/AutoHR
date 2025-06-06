// using System;
// using System.Collections.Generic;
// using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class CreateCompanyRequest
    {

        public string Name { get; set; }

        public string Description { get; set; }

        public string Website { get; set; }

        public string LogoUrl { get; set; }

        public string Industry { get; set; }

        public string CompanySize { get; set; }

        public Dictionary<string, string> Headquarters { get; set; }

        public int? FoundedYear { get; set; }

        public string email { get; set; }
    }
}