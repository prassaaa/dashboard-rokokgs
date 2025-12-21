<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Mild', 'Full Flavor', 'Menthol', 'Kretek', 'Filter'];
        $name = $categories[array_rand($categories)] . ' ' . fake()->unique()->word();

        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name) . '-' . fake()->unique()->randomNumber(4),
            'description' => fake()->sentence(),
        ];
    }
}
