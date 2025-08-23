using FluentValidation;
using ai_hr.Contracts;
using System.Text.RegularExpressions;

namespace ai_hr.Validators
{
    public class CreateJobRequestValidator : AbstractValidator<CreateJobRequest>
    {
        public CreateJobRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Job title is required")
                .Length(1, 200).WithMessage("Job title must be between 1 and 200 characters")
                .Must(BeValidTitle).WithMessage("Job title contains invalid characters or potentially malicious content");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Job description is required")
                .Length(10, 10000).WithMessage("Description must be between 10 and 10,000 characters")
                .Must(BeValidDescription).WithMessage("Job description contains potentially malicious content");

            RuleFor(x => x.Department)
                .Length(0, 100).WithMessage("Department must not exceed 100 characters")
                .Must(BeValidText).WithMessage("Department contains invalid characters")
                .When(x => !string.IsNullOrEmpty(x.Department));

            RuleFor(x => x.CompanyId)
                .NotEmpty().WithMessage("Company ID is required")
                .Must(x => x != Guid.Empty).WithMessage("Company ID must be a valid GUID");

            RuleFor(x => x.CreatedBy)
                .NotEmpty().WithMessage("Created By is required")
                .Must(x => x != Guid.Empty).WithMessage("Created By must be a valid GUID");

            RuleFor(x => x.EmploymentType)
                .Must(BeValidEmploymentType).WithMessage("Employment type must be one of: Full-time, Part-time, Contract, Temporary, Internship")
                .When(x => !string.IsNullOrEmpty(x.EmploymentType));

            RuleFor(x => x.SeniorityLevel)
                .Must(BeValidSeniorityLevel).WithMessage("Seniority level must be one of: Entry, Junior, Mid, Senior, Lead, Manager, Director, Executive")
                .When(x => !string.IsNullOrEmpty(x.SeniorityLevel));

            RuleFor(x => x.ExperienceYearsMin)
                .GreaterThanOrEqualTo(0).WithMessage("Minimum experience years must be 0 or greater")
                .LessThan(50).WithMessage("Minimum experience years must be less than 50")
                .When(x => x.ExperienceYearsMin.HasValue);

            RuleFor(x => x.LocationType)
                .Must(BeValidLocationType).WithMessage("Location type must be one of: Remote, On-site, Hybrid")
                .When(x => !string.IsNullOrEmpty(x.LocationType));

            RuleFor(x => x.SalaryMin)
                .GreaterThanOrEqualTo(0).WithMessage("Minimum salary must be 0 or greater")
                .LessThan(10000000).WithMessage("Minimum salary must be less than 10,000,000")
                .When(x => x.SalaryMin.HasValue);

            RuleFor(x => x.SalaryMax)
                .GreaterThanOrEqualTo(0).WithMessage("Maximum salary must be 0 or greater")
                .LessThan(10000000).WithMessage("Maximum salary must be less than 10,000,000")
                .GreaterThanOrEqualTo(x => x.SalaryMin ?? 0).WithMessage("Maximum salary must be greater than or equal to minimum salary")
                .When(x => x.SalaryMax.HasValue);

            RuleFor(x => x.SalaryCurrency)
                .Length(3, 3).WithMessage("Salary currency must be exactly 3 characters (e.g., USD, EUR)")
                .Must(BeValidCurrency).WithMessage("Salary currency must contain only uppercase letters")
                .When(x => !string.IsNullOrEmpty(x.SalaryCurrency));

            RuleFor(x => x.ApplicationDeadline)
                .GreaterThan(DateTime.UtcNow).WithMessage("Application deadline must be in the future")
                .When(x => x.ApplicationDeadline.HasValue);

            RuleFor(x => x.Status)
                .Must(BeValidJobStatus).WithMessage("Status must be one of: Draft, Active, Paused, Closed, Expired")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.SkillMatchThreshold)
                .GreaterThanOrEqualTo(0.1m).WithMessage("Skill match threshold must be at least 0.1")
                .LessThanOrEqualTo(1.0m).WithMessage("Skill match threshold must be at most 1.0")
                .When(x => x.SkillMatchThreshold != 0.70m); // Allow default value

            RuleFor(x => x.InterviewTemplateId)
                .Must(x => x == null || (x.HasValue && x.Value != Guid.Empty)).WithMessage("Interview template ID must be a valid GUID")
                .When(x => x.InterviewTemplateId.HasValue);

            // Validate lists
            RuleFor(x => x.Responsibilities)
                .Must(BeValidStringList).WithMessage("Responsibilities contain invalid or potentially malicious content")
                .When(x => x.Responsibilities != null);

            RuleFor(x => x.Requirements)
                .Must(BeValidStringList).WithMessage("Requirements contain invalid or potentially malicious content")
                .When(x => x.Requirements != null);

            RuleFor(x => x.Qualifications)
                .Must(BeValidStringList).WithMessage("Qualifications contain invalid or potentially malicious content")
                .When(x => x.Qualifications != null);

            RuleFor(x => x.Benefits)
                .Must(BeValidStringList).WithMessage("Benefits contain invalid or potentially malicious content")
                .When(x => x.Benefits != null);
        }

        private bool BeValidTitle(string title)
        {
            if (string.IsNullOrEmpty(title))
                return false;

            // Check for potentially malicious content
            var maliciousPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"onload=",
                @"onclick=",
                @"onerror=",
                @"<iframe",
                @"<object",
                @"<embed",
                @"eval\(",
                @"expression\("
            };

            foreach (var pattern in maliciousPatterns)
            {
                if (Regex.IsMatch(title, pattern, RegexOptions.IgnoreCase))
                    return false;
            }

            return true;
        }

        private bool BeValidDescription(string description)
        {
            if (string.IsNullOrEmpty(description))
                return false;

            // Allow basic HTML tags but block potentially dangerous ones
            var dangerousPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"onload=",
                @"onclick=",
                @"onerror=",
                @"<iframe",
                @"<object",
                @"<embed",
                @"eval\(",
                @"expression\("
            };

            foreach (var pattern in dangerousPatterns)
            {
                if (Regex.IsMatch(description, pattern, RegexOptions.IgnoreCase))
                    return false;
            }

            return true;
        }

        private bool BeValidText(string text)
        {
            if (string.IsNullOrEmpty(text))
                return true;

            // Check for basic XSS patterns
            var xssPatterns = new[]
            {
                @"<script",
                @"javascript:",
                @"vbscript:",
                @"onload=",
                @"onclick="
            };

            foreach (var pattern in xssPatterns)
            {
                if (text.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return false;
            }

            return true;
        }


        private bool BeValidEmploymentType(string employmentType)
        {
            if (string.IsNullOrEmpty(employmentType))
                return true;

            var validTypes = new[] { "Full-time", "Part-time", "Contract", "Temporary", "Internship" };
            return validTypes.Contains(employmentType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidSeniorityLevel(string seniorityLevel)
        {
            if (string.IsNullOrEmpty(seniorityLevel))
                return true;

            var validLevels = new[] { "Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director", "Executive" };
            return validLevels.Contains(seniorityLevel, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidLocationType(string locationType)
        {
            if (string.IsNullOrEmpty(locationType))
                return true;

            var validTypes = new[] { "Remote", "On-site", "Hybrid" };
            return validTypes.Contains(locationType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidCurrency(string currency)
        {
            if (string.IsNullOrEmpty(currency))
                return true;

            return Regex.IsMatch(currency, @"^[A-Z]{3}$");
        }

        private bool BeValidJobStatus(string status)
        {
            if (string.IsNullOrEmpty(status))
                return true;

            var validStatuses = new[] { "Draft", "Active", "Paused", "Closed", "Expired" };
            return validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidStringList(List<string> items)
        {
            if (items == null)
                return true;

            // Check each item in the list
            foreach (var item in items)
            {
                if (string.IsNullOrEmpty(item))
                    continue;

                if (item.Length > 1000) // Individual items shouldn't be too long
                    return false;

                if (!BeValidText(item))
                    return false;
            }

            return true;
        }
    }
}