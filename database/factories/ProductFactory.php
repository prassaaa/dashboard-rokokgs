<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_category_id' => \App\Models\ProductCategory::factory(),
            'code' => strtoupper(fake()->unique()->bothify('PRD-###')),
            'name' => 'GS ' . fake()->word(),
            'price' => fake()->randomElement([25000, 27000, 30000]),
            'barcode' => fake()->unique()->ean13(),
            'cost' => fake()->randomElement([20000, 22000, 25000]),
            'unit' => 'bungkus',
            'items_per_carton' => 10,
            'is_active' => true,
        ];
    }
}
