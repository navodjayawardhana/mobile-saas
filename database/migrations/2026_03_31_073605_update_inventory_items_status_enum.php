<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing 'available' values to 'in_stock' first
        DB::table('inventory_items')
            ->where('status', 'available')
            ->update(['status' => 'in_stock']);

        // Modify the enum to include new values
        DB::statement("ALTER TABLE inventory_items MODIFY COLUMN status ENUM('in_stock', 'available', 'sold', 'reserved', 'in_repair', 'returned', 'damaged') DEFAULT 'in_stock'");
    }

    public function down(): void
    {
        // Revert 'in_stock' back to 'available'
        DB::table('inventory_items')
            ->where('status', 'in_stock')
            ->update(['status' => 'available']);

        DB::statement("ALTER TABLE inventory_items MODIFY COLUMN status ENUM('available', 'sold', 'reserved', 'in_repair', 'returned') DEFAULT 'available'");
    }
};
