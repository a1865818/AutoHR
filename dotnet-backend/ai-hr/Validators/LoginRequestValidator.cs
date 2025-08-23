using FluentValidation;
using ai_hr.Contracts;
using System.Text.RegularExpressions;

namespace ai_hr.Validators
{
    public class LoginRequestValidator : AbstractValidator<LoginRequest>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email must be a valid email address")
                .Length(5, 254).WithMessage("Email must be between 5 and 254 characters")
                .Must(BeSecureEmail).WithMessage("Email contains invalid characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .Length(1, 128).WithMessage("Password must be between 1 and 128 characters")
                .Must(BeSecurePassword).WithMessage("Password contains invalid characters");
        }

        private bool BeSecureEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            // Check for XSS patterns
            var xssPatterns = new[]
            {
                @"<script",
                @"javascript:",
                @"vbscript:",
                @"onload=",
                @"onclick=",
                @"eval\(",
                @"expression\("
            };

            foreach (var pattern in xssPatterns)
            {
                if (email.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return false;
            }

            return true;
        }

        private bool BeSecurePassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return false;

            // Check for potential injection patterns - be strict but not too restrictive for login
            var suspiciousPatterns = new[]
            {
                @"<script",
                @"javascript:",
                @"vbscript:",
                @"eval\(",
                @"expression\(",
                @"<iframe",
                @"<object",
                @"<embed"
            };

            foreach (var pattern in suspiciousPatterns)
            {
                if (password.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return false;
            }

            return true;
        }
    }
}