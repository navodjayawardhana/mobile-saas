<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE customers MODIFY COLUMN customer_type ENUM('regular', 'wholesale', 'vip', 'business', 'individual') DEFAULT 'regular'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE customers MODIFY COLUMN customer_type ENUM('regular', 'wholesale', 'vip') DEFAULT 'regular'");
    }
};
