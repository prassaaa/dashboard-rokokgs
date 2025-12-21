<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class SalesTransactionDTO extends BaseDTO
{
    public function __construct(
        public string $transaction_number,
        public int $branch_id,
        public int $sales_id,
        public float $subtotal,
        public float $total,
        public string $payment_method,
        public array $items,
        public ?int $area_id = null,
        public ?string $customer_name = null,
        public ?string $customer_phone = null,
        public ?string $customer_address = null,
        public float $discount = 0,
        public float $tax = 0,
        public string $status = 'pending',
        public ?string $notes = null,
        public ?string $latitude = null,
        public ?string $longitude = null,
    ) {
    }
}
