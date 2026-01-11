<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visit>
 */
class VisitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'visit_number' => 'VST-' . now()->format('Ymd') . '-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'visit_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'branch_id' => \App\Models\Branch::factory(),
            'sales_id' => \App\Models\User::factory(),
            'area_id' => null,
            'customer_name' => fake()->company(),
            'customer_phone' => fake()->phoneNumber(),
            'customer_address' => fake()->address(),
            'visit_type' => fake()->randomElement(['routine', 'prospecting', 'follow_up', 'complaint', 'other']),
            'status' => 'pending',
            'purpose' => fake()->optional()->sentence(),
            'result' => fake()->optional()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'latitude' => fake()->latitude(-10, 10),
            'longitude' => fake()->longitude(90, 140),
            'photo' => null,
            'approved_at' => null,
            'approved_by' => null,
        ];
    }

    /**
     * Indicate that the visit is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    /**
     * Indicate that the visit is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'notes' => 'Rejected: ' . fake()->sentence(),
        ]);
    }

    /**
     * Indicate that the visit is a routine type.
     */
    public function routine(): static
    {
        return $this->state(fn (array $attributes) => [
            'visit_type' => 'routine',
        ]);
    }

    /**
     * Indicate that the visit is a complaint type.
     */
    public function complaint(): static
    {
        return $this->state(fn (array $attributes) => [
            'visit_type' => 'complaint',
        ]);
    }

    /**
     * Indicate that the visit is a prospecting type.
     */
    public function prospecting(): static
    {
        return $this->state(fn (array $attributes) => [
            'visit_type' => 'prospecting',
        ]);
    }
}
