<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Commission>
 */
class CommissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $transactionAmount = fake()->numberBetween(10000, 1000000);
        $commissionPercentage = 2.0;
        $commissionAmount = $transactionAmount * ($commissionPercentage / 100);

        return [
            'sales_transaction_id' => \App\Models\SalesTransaction::factory(),
            'sales_id' => \App\Models\User::factory(),
            'transaction_amount' => $transactionAmount,
            'commission_percentage' => $commissionPercentage,
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
            'paid_at' => null,
        ];
    }
}
