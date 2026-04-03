<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4361ee;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .content p {
            margin: 0 0 15px;
        }
        .button {
            display: inline-block;
            background-color: #4361ee;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
        }
        .button:hover {
            background-color: #3651d4;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
        }
        .link-text {
            word-break: break-all;
            color: #4361ee;
            font-size: 12px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 12px;
            font-size: 14px;
            color: #856404;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Mobile Shop</h1>
        </div>

        <div class="content">
            <p>Hello {{ $user->name }},</p>

            <p>We received a request to reset your password for your Mobile Shop account. Click the button below to reset your password:</p>

            <div class="button-container">
                <a href="{!! $resetUrl !!}" class="button">Reset Password</a>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link-text">{!! $resetUrl !!}</p>

            <div class="warning">
                <strong>Note:</strong> This link will expire in 60 minutes. If you didn't request a password reset, you can safely ignore this email.
            </div>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Mobile Shop. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
