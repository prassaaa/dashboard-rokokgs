<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SalesTransaction>
 */
class SalesTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(100000, 1000000);
        $discount = fake()->numberBetween(0, 50000);

        return [
            'transaction_number' => 'TRX-' . now()->format('Ymd') . '-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'transaction_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'branch_id' => \App\Models\Branch::factory(),
            'sales_id' => \App\Models\User::factory(),
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->phoneNumber(),
            'customer_address' => fake()->address(),
            'latitude' => fake()->latitude(-10, 10),
            'longitude' => fake()->longitude(90, 140),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $subtotal - $discount,
            'payment_method' => fake()->randomElement(['cash', 'transfer', 'credit']),
            'status' => 'pending',
            'notes' => fake()->optional()->sentence(),
            'approved_at' => null,
            'approved_by' => null,
        ];
    }
}
