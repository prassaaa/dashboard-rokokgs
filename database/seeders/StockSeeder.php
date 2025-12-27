<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Database\Seeder;

class StockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::where('code', '!=', 'PUSAT')->get();
        $products = Product::all();

        foreach ($branches as $branch) {
            foreach ($products as $index => $product) {
                $minimumStock = 20;

                // Create varied stock levels for realistic scenarios:
                // - 70% normal stock (50-500)
                // - 20% low stock (10-25) - for alert testing
                // - 10% critical stock (0-10) - for urgent alert testing
                $rand = rand(1, 100);
                if ($rand <= 10) {
                    // Critical stock (10%)
                    $quantity = rand(0, 10);
                } elseif ($rand <= 30) {
                    // Low stock (20%)
                    $quantity = rand(10, 25);
                } else {
                    // Normal stock (70%)
                    $quantity = rand(50, 500);
                }

                Stock::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'minimum_stock' => $minimumStock,
                ]);
            }
        }
    }
}
