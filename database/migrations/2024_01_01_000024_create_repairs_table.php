<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shop_id');
            $table->uuid('customer_id')->nullable();
            $table->uuid('technician_id')->nullable();
            $table->uuid('received_by_id')->nullable();
            $table->string('job_number')->unique();
            $table->string('device_type');
            $table->string('device_brand')->nullable();
            $table->string('device_model')->nullable();
            $table->string('serial_imei')->nullable();
            $table->text('device_condition')->nullable();
            $table->text('reported_issues');
            $table->text('diagnosis')->nullable();
            $table->json('accessories_received')->nullable();
            $table->decimal('estimated_cost', 15, 2)->default(0);
            $table->decimal('final_cost', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->enum('status', [
                'received',
                'diagnosing',
                'waiting_approval',
                'waiting_parts',
                'in_progress',
                'completed',
                'delivered',
                'cancelled'
            ])->default('received');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->dateTime('received_at');
            $table->dateTime('estimated_completion')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->integer('warranty_days')->default(0);
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('technician_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('received_by_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['shop_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairs');
    }
};
