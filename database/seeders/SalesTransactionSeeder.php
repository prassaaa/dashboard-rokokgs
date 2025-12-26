<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Models\Stock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SalesTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $salesUsers = User::role('Sales')->with(['branch', 'areas'])->get();
        $products = Product::all();

        $customerNames = [
            'Toko Berkah Jaya',
            'Warung Pak Joni',
            'Kios Bu Siti',
            'Toko Makmur',
            'Warung Barokah',
            'Kios Sejahtera',
            'Toko Maju Bersama',
            'Warung Subur',
            'Kios Untung',
            'Toko Jaya Abadi',
            'Warung Sentosa',
            'Kios Melati',
            'Toko Sumber Rezeki',
            'Warung Gemilang',
            'Kios Harapan',
        ];

        $statuses = ['pending', 'approved', 'approved', 'approved', 'cancelled'];

        foreach ($salesUsers as $sales) {
            // Create 5-15 transactions per sales
            $transactionCount = rand(5, 15);

            for ($i = 0; $i < $transactionCount; $i++) {
                // Random date in the last 30 days
                $date = Carbon::now()->subDays(rand(0, 30));
                $status = $statuses[array_rand($statuses)];

                // Get area if available
                $area = $sales->areas->isNotEmpty() ? $sales->areas->random() : null;

                $transaction = SalesTransaction::create([
                    'branch_id' => $sales->branch_id,
                    'sales_id' => $sales->id,
                    'area_id' => $area?->id,
                    'transaction_number' => 'TRX-' . $date->format('Ymd') . '-' . strtoupper(Str::random(6)),
                    'transaction_date' => $date->format('Y-m-d'),
                    'customer_name' => $customerNames[array_rand($customerNames)],
                    'customer_phone' => '08' . rand(1000000000, 9999999999),
                    'customer_address' => 'Jl. ' . Str::random(10) . ' No. ' . rand(1, 100),
                    'subtotal' => 0,
                    'discount' => rand(0, 1) ? rand(1, 5) * 5000 : 0,
                    'tax' => 0,
                    'total' => 0,
                    'payment_method' => ['cash', 'transfer', 'credit'][array_rand(['cash', 'transfer', 'credit'])],
                    'status' => $status,
                    'notes' => rand(0, 1) ? 'Catatan transaksi #' . ($i + 1) : null,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                // Create 1-5 items per transaction
                $itemCount = rand(1, 5);
                $selectedProducts = $products->random($itemCount);
                $subtotal = 0;

                foreach ($selectedProducts as $product) {
                    $quantity = rand(1, 20);
                    $price = $product->price;
                    $itemSubtotal = $quantity * $price;
                    $subtotal += $itemSubtotal;

                    SalesTransactionItem::create([
                        'sales_transaction_id' => $transaction->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'price' => $price,
                        'subtotal' => $itemSubtotal,
                    ]);

                    // Reduce stock if transaction is approved
                    if ($status === 'approved') {
                        $stock = Stock::where('branch_id', $sales->branch_id)
                            ->where('product_id', $product->id)
                            ->first();

                        if ($stock && $stock->quantity >= $quantity) {
                            $stock->decrement('quantity', $quantity);
                        }
                    }
                }

                // Calculate tax (11%)
                $tax = round($subtotal * 0.11);
                $total = $subtotal - $transaction->discount + $tax;

                $transaction->update([
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $total,
                ]);
            }
        }
    }
}
