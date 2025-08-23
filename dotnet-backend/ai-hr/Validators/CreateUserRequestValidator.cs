using FluentValidation;
using ai_hr.Contracts;
using System.Text.RegularExpressions;

namespace ai_hr.Validators
{
    public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
    {
        public CreateUserRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email must be a valid email address")
                .Length(5, 254).WithMessage("Email must be between 5 and 254 characters")
                .Must(BeSecureEmail).WithMessage("Email contains invalid characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters long")
                .MaximumLength(128).WithMessage("Password must not exceed 128 characters")
                .Must(BeStrongPassword).WithMessage("Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .Length(1, 50).WithMessage("First name must be between 1 and 50 characters")
                .Must(BeValidName).WithMessage("First name contains invalid characters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .Length(1, 50).WithMessage("Last name must be between 1 and 50 characters")
                .Must(BeValidName).WithMessage("Last name contains invalid characters");

            RuleFor(x => x.CreatedAt)
                .NotEmpty().WithMessage("Created date is required")
                .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Created date cannot be in the future");
        }

        private bool BeSecureEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            // Check for basic XSS patterns in email
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
                if (email.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return false;
            }

            // Additional email security checks
            if (email.Contains("..") || email.StartsWith(".") || email.EndsWith("."))
                return false;

            return true;
        }

        private bool BeStrongPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return false;

            // Check for at least one uppercase letter
            if (!Regex.IsMatch(password, @"[A-Z]"))
                return false;

            // Check for at least one lowercase letter
            if (!Regex.IsMatch(password, @"[a-z]"))
                return false;

            // Check for at least one digit
            if (!Regex.IsMatch(password, @"\d"))
                return false;

            // Check for at least one special character
            if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
                return false;

            // Check for common weak patterns
            var weakPatterns = new[]
            {
                @"^password",
                @"^123456",
                @"^qwerty",
                @"^admin",
                @"(.)\1{3,}" // Same character repeated 4+ times
            };

            foreach (var pattern in weakPatterns)
            {
                if (Regex.IsMatch(password, pattern, RegexOptions.IgnoreCase))
                    return false;
            }

            return true;
        }

        private bool BeValidName(string name)
        {
            if (string.IsNullOrEmpty(name))
                return true;

            // Only allow letters, spaces, apostrophes, and hyphens
            return Regex.IsMatch(name, @"^[a-zA-Z\s'\-]+$") && !ContainsMaliciousContent(name);
        }

        private bool ContainsMaliciousContent(string content)
        {
            if (string.IsNullOrEmpty(content))
                return false;

            // Check for XSS patterns
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
                @"expression\(",
                @"<link",
                @"<style[^>]*>.*?</style>",
                @"@import",
                @"url\(",
                @"data:text/html"
            };

            foreach (var pattern in maliciousPatterns)
            {
                if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
                    return true;
            }

            return false;
        }
    }
}