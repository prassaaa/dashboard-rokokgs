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
            foreach ($products as $product) {
                // Random stock between 50-500
                $quantity = rand(50, 500);
                $minimumStock = 20;

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
