<?php

/**
 * Test Mail Configuration
 * DELETE THIS FILE AFTER TESTING
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

header('Content-Type: application/json');

try {
    $testEmail = $_GET['email'] ?? 'test@example.com';

    // Show current mail config
    $config = [
        'MAIL_MAILER' => config('mail.default'),
        'MAIL_HOST' => config('mail.mailers.smtp.host'),
        'MAIL_PORT' => config('mail.mailers.smtp.port'),
        'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
        'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
        'MAIL_FROM_ADDRESS' => config('mail.from.address'),
        'MAIL_FROM_NAME' => config('mail.from.name'),
    ];

    echo json_encode([
        'config' => $config,
        'message' => 'Mail config loaded. Add ?send=1&email=your@email.com to send test email'
    ], JSON_PRETTY_PRINT);

    if (isset($_GET['send'])) {
        \Illuminate\Support\Facades\Mail::raw('This is a test email from Mobile Shop.', function ($message) use ($testEmail) {
            $message->to($testEmail)
                ->subject('Test Email - Mobile Shop');
        });

        echo json_encode([
            'success' => true,
            'message' => 'Test email sent to ' . $testEmail
        ]);
    }

} catch (\Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
