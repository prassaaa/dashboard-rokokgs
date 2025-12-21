<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Mild',
                'slug' => Str::slug('Mild'),
                'description' => 'Rokok dengan kandungan tar dan nikotin rendah',
                'is_active' => true,
            ],
            [
                'name' => 'Full Flavor',
                'slug' => Str::slug('Full Flavor'),
                'description' => 'Rokok dengan cita rasa penuh dan kuat',
                'is_active' => true,
            ],
            [
                'name' => 'Menthol',
                'slug' => Str::slug('Menthol'),
                'description' => 'Rokok dengan sensasi mint menyegarkan',
                'is_active' => true,
            ],
            [
                'name' => 'Kretek',
                'slug' => Str::slug('Kretek'),
                'description' => 'Rokok khas Indonesia dengan campuran cengkeh',
                'is_active' => true,
            ],
            [
                'name' => 'Filter',
                'slug' => Str::slug('Filter'),
                'description' => 'Rokok dengan filter standar',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            ProductCategory::create($category);
        }
    }
}
