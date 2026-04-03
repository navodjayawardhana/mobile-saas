<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->foreign('default_currency_id')->references('id')->on('currencies')->onDelete('set null');
        });

        // Add purchase_order_id foreign key to inventory_items
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropForeign(['default_currency_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
        });
    }
};
