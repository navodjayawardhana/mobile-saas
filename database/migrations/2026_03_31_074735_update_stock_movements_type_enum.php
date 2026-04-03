<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing 'adjustment' values to 'adjustment_in'
        DB::table('stock_movements')
            ->where('type', 'adjustment')
            ->where('quantity', '>=', 0)
            ->update(['type' => 'adjustment_in']);

        DB::table('stock_movements')
            ->where('type', 'adjustment')
            ->where('quantity', '<', 0)
            ->update(['type' => 'adjustment_out']);

        // Modify the enum to include new values
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('purchase', 'sale', 'adjustment', 'adjustment_in', 'adjustment_out', 'return', 'damage', 'transfer', 'initial') DEFAULT 'adjustment_in'");
    }

    public function down(): void
    {
        // Revert adjustment_in/out back to adjustment
        DB::table('stock_movements')
            ->whereIn('type', ['adjustment_in', 'adjustment_out'])
            ->update(['type' => 'adjustment']);

        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('purchase', 'sale', 'adjustment', 'return', 'damage', 'transfer') DEFAULT 'adjustment'");
    }
};
