using System.Threading.Tasks;

namespace BizCore.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendWelcomeEmailAsync(string toEmail, string businessName, string tempPassword);
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken);
    Task SendPasswordChangedEmailAsync(string toEmail);
}
