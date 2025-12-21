<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mild = ProductCategory::where('slug', 'mild')->first();
        $fullFlavor = ProductCategory::where('slug', 'full-flavor')->first();
        $menthol = ProductCategory::where('slug', 'menthol')->first();
        $kretek = ProductCategory::where('slug', 'kretek')->first();

        $products = [
            // Mild Category
            [
                'product_category_id' => $mild->id,
                'code' => 'GS-MLD-001',
                'name' => 'GS Mild 12',
                'barcode' => '8991234567001',
                'description' => 'Rokok GS Mild dengan 12 batang per pack',
                'price' => 25000,
                'cost' => 20000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],
            [
                'product_category_id' => $mild->id,
                'code' => 'GS-MLD-002',
                'name' => 'GS Mild 16',
                'barcode' => '8991234567002',
                'description' => 'Rokok GS Mild dengan 16 batang per pack',
                'price' => 28000,
                'cost' => 22000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],

            // Full Flavor Category
            [
                'product_category_id' => $fullFlavor->id,
                'code' => 'GS-FF-001',
                'name' => 'GS Bold 12',
                'barcode' => '8991234567003',
                'description' => 'Rokok GS Bold Full Flavor 12 batang',
                'price' => 26000,
                'cost' => 21000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],
            [
                'product_category_id' => $fullFlavor->id,
                'code' => 'GS-FF-002',
                'name' => 'GS Bold 16',
                'barcode' => '8991234567004',
                'description' => 'Rokok GS Bold Full Flavor 16 batang',
                'price' => 29000,
                'cost' => 23000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],

            // Menthol Category
            [
                'product_category_id' => $menthol->id,
                'code' => 'GS-MEN-001',
                'name' => 'GS Menthol 12',
                'barcode' => '8991234567005',
                'description' => 'Rokok GS Menthol dengan sensasi mint',
                'price' => 26000,
                'cost' => 21000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],
            [
                'product_category_id' => $menthol->id,
                'code' => 'GS-MEN-002',
                'name' => 'GS Menthol 16',
                'barcode' => '8991234567006',
                'description' => 'Rokok GS Menthol 16 batang',
                'price' => 29000,
                'cost' => 23000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],

            // Kretek Category
            [
                'product_category_id' => $kretek->id,
                'code' => 'GS-KRT-001',
                'name' => 'GS Kretek Premium 12',
                'barcode' => '8991234567007',
                'description' => 'Rokok kretek GS dengan cengkeh pilihan',
                'price' => 27000,
                'cost' => 22000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],
            [
                'product_category_id' => $kretek->id,
                'code' => 'GS-KRT-002',
                'name' => 'GS Kretek Premium 16',
                'barcode' => '8991234567008',
                'description' => 'Rokok kretek GS Premium 16 batang',
                'price' => 30000,
                'cost' => 24000,
                'unit' => 'pack',
                'items_per_carton' => 10,
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
