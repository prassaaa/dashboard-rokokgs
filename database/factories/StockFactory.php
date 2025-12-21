<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Stock>
 */
class StockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => \App\Models\Product::factory(),
            'branch_id' => \App\Models\Branch::factory(),
            'quantity' => fake()->numberBetween(10, 500),
            'minimum_stock' => fake()->numberBetween(5, 50),
        ];
    }
}
