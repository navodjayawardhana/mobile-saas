<?php

/**
 * Deploy Migration Script
 * This script runs Laravel migrations after FTP deployment
 */

// Change to Laravel root directory first
chdir(dirname(__DIR__));

// Set content type
header('Content-Type: application/json');

$output = [];
$returnCode = 0;

// Run migrations
exec('php artisan migrate --force 2>&1', $output, $returnCode);

if ($returnCode !== 0) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed',
        'output' => implode("\n", $output)
    ]);
    exit;
}

// Run seeders (only if seed parameter is passed)
$seederOutput = [];
if (isset($_GET['seed'])) {
    exec('php artisan db:seed --force 2>&1', $seederOutput, $seederCode);
}

// Clear and cache config/routes/views
$cacheOutput = [];
exec('php artisan config:cache 2>&1', $cacheOutput);
exec('php artisan route:cache 2>&1', $cacheOutput);
exec('php artisan view:cache 2>&1', $cacheOutput);

echo json_encode([
    'success' => true,
    'message' => 'Deployment completed successfully',
    'migration_output' => implode("\n", $output),
    'seeder_output' => implode("\n", $seederOutput ?? []),
    'cache_output' => implode("\n", $cacheOutput),
    'timestamp' => date('Y-m-d H:i:s')
]);
