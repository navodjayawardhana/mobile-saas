<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shop_id');
            $table->uuid('product_id');
            $table->string('serial_number')->nullable();
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->enum('condition', ['new', 'used', 'refurbished', 'damaged'])->default('new');
            $table->enum('status', ['in_stock', 'sold', 'reserved', 'in_repair', 'returned', 'damaged'])->default('in_stock');
            $table->date('warranty_expires_at')->nullable();
            $table->uuid('purchase_order_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->unique(['shop_id', 'serial_number']);
            $table->index(['shop_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
