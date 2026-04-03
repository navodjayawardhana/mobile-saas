<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('repair_id');
            $table->uuid('product_id')->nullable();
            $table->uuid('inventory_item_id')->nullable();
            $table->string('description');
            $table->enum('type', ['part', 'service'])->default('part');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();

            $table->foreign('repair_id')->references('id')->on('repairs')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_items');
    }
};
