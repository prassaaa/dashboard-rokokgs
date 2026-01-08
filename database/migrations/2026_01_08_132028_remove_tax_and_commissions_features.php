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
        // Drop commissions table
        Schema::dropIfExists('commissions');

        // Remove tax column from sales_transactions
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn('tax');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add tax column to sales_transactions
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->decimal('tax', 15, 2)->default(0)->after('discount');
        });

        // Re-create commissions table
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_transaction_id')->constrained('sales_transactions')->onDelete('cascade');
            $table->foreignId('sales_id')->constrained('users')->onDelete('cascade');
            $table->decimal('transaction_amount', 15, 2);
            $table->decimal('commission_percentage', 5, 2);
            $table->decimal('commission_amount', 15, 2);
            $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
