<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->enum('type', ['revenue', 'quantity'])->comment('Target type: revenue for amount target, quantity for unit target');
            $table->decimal('amount', 15, 2)->nullable()->comment('Target amount in IDR');
            $table->integer('quantity')->nullable()->comment('Target quantity in units');
            $table->string('period_type')->default('monthly')->comment('Period: monthly, quarterly, yearly, custom');
            $table->integer('year');
            $table->integer('month')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('targets');
    }
};
