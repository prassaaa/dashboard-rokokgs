<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class SalesTransactionDTO extends BaseDTO
{
    public function __construct(
        public int $branch_id,
        public int $sales_id,
        public float $subtotal,
        public float $total,
        public string $payment_method,
        public array $items,
        public ?string $transaction_number = null,
        public ?int $area_id = null,
        public ?string $customer_name = null,
        public ?string $customer_phone = null,
        public ?string $customer_address = null,
        public float $discount = 0,
        public string $status = 'pending',
        public ?string $notes = null,
        public ?float $latitude = null,
        public ?float $longitude = null,
        public ?string $proof_photo = null,
    ) {
    }
}
