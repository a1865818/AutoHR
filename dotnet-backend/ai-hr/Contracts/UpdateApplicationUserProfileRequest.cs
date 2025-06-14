using System;
using System.Collections.Generic;
using System.Text.Json;

namespace ai_hr.Contracts
{
    public class UpdateApplicationUserProfileRequest
    {
        public List<JsonElement>? Education { get; set; }

        public List<JsonElement>? Experience { get; set; }

        public JsonElement? SocialLink { get; set; }

        public string? PhoneNumber { get; set; }

        public JsonElement? Location { get; set; }

        public List<JsonElement>? ResumeList { get; set; }
    }
}