using System.Net;
using System.Net.Mail;
using BizCore.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BizCore.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUser = _configuration["EmailSettings:SmtpUsername"];
            var smtpPass = _configuration["EmailSettings:SmtpPassword"];
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? "noreply@bizcore.com";
            var fromName = _configuration["EmailSettings:FromName"] ?? "BizCore ERP";
            var enableSsl = bool.Parse(_configuration["EmailSettings:EnableSsl"] ?? "true");

            if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
            {
                _logger.LogWarning("Email settings are missing. Email to {To} with subject '{Subject}' was NOT sent.", to, subject);
                _logger.LogInformation("EMAIL CONTENT (MOCK): \nTo: {To}\nSubject: {Subject}\nBody: {Body}", to, subject, body);
                return;
            }

            using var client = new SmtpClient(smtpServer)
            {
                Port = smtpPort,
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = enableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            // We don't throw here to avoid breaking the onboarding flow if email fails
        }
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string businessName, string tempPassword)
    {
        var subject = $"Welcome to BizCore - Your {businessName} Account";
        var body = $@"
            <html>
            <body style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                    <h2 style='color: #4F46E5;'>Welcome to BizCore ERP!</h2>
                    <p>Hello,</p>
                    <p>Your business account <strong>{businessName}</strong> has been created successfully.</p>
                    
                    <div style='background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0;'>Login Credentials:</h3>
                        <p><strong>Email:</strong> {toEmail}</p>
                        <p><strong>Temporary Password:</strong> <code style='background: #eef2ff; color: #4F46E5; padding: 2px 6px; border-radius: 4px; font-weight: bold;'>{tempPassword}</code></p>
                    </div>
                    
                    <p style='color: #ef4444; font-weight: bold;'>Important: Please change your password immediately after your first login.</p>
                    
                    <div style='margin-top: 30px;'>
                        <a href='https://app.bizcore.com/login' style='background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>
                            Login to Your Account
                        </a>
                    </div>
                    
                    <hr style='margin: 30px 0; border: 0; border-top: 1px solid #eee;' />
                    <p style='font-size: 12px; color: #666;'>
                        This is an automated message from BizCore ERP. Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>";
        
        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetTokenOrPassword)
    {
        // If it's a GUID/Token, it's a forgot password flow. If it's shorter, it's likely a SuperAdmin reset.
        bool isTempPassword = resetTokenOrPassword.Length <= 16;
        
        var subject = isTempPassword ? "Your Password Has Been Reset - BizCore ERP" : "Password Reset Request - BizCore ERP";
        
        string content;
        if (isTempPassword)
        {
            content = $@"
                <p>Your password has been reset by an administrator.</p>
                <p><strong>Temporary Password:</strong> <code style='background: #f3f4f6; padding: 2px 6px; border-radius: 4px;'>{resetTokenOrPassword}</code></p>
                <p>You will be forced to change this password on your next login.</p>";
        }
        else
        {
            var resetLink = $"https://app.bizcore.com/reset-password?token={Uri.EscapeDataString(resetTokenOrPassword)}&email={Uri.EscapeDataString(toEmail)}";
            content = $@"
                <p>We received a request to reset your password.</p>
                <p>Click the button below to set a new password (link valid for 1 hour):</p>
                <div style='margin: 20px 0;'>
                    <a href='{resetLink}' style='background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Reset Password</a>
                </div>
                <p>If you didn't request this, please ignore this email.</p>";
        }

        var body = $@"
            <html>
            <body style='font-family: sans-serif;'>
                <h2>BizCore Security Update</h2>
                {content}
                <p style='font-size: 12px; color: #666; margin-top: 30px;'>BizCore ERP Team</p>
            </body>
            </html>";
        
        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendPasswordChangedEmailAsync(string toEmail)
    {
        var subject = "Security Alert: Password Changed - BizCore ERP";
        var body = @"
            <html>
            <body style='font-family: sans-serif;'>
                <h2>Password Changed Successfully</h2>
                <p>Your password has been changed. If you did not make this change, please contact support immediately to secure your account.</p>
                <p style='font-size: 12px; color: #666; margin-top: 30px;'>BizCore ERP Team</p>
            </body>
            </html>";
        
        await SendEmailAsync(toEmail, subject, body);
    }
}
