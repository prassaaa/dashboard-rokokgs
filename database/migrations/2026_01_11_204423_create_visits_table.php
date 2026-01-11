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
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('visit_number')->unique();
            $table->date('visit_date');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('sales_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('area_id')->nullable()->constrained('areas')->onDelete('set null');
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->text('customer_address')->nullable();
            $table->enum('visit_type', ['routine', 'prospecting', 'follow_up', 'complaint', 'other'])->default('routine');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('purpose')->nullable(); // tujuan kunjungan
            $table->text('result')->nullable(); // hasil kunjungan
            $table->text('notes')->nullable();
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->string('photo')->nullable(); // foto bukti kunjungan
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
