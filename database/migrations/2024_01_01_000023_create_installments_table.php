<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('installment_plan_id');
            $table->integer('installment_number');
            $table->decimal('amount', 15, 2);
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'partial', 'overdue'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('installment_plan_id')->references('id')->on('installment_plans')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
