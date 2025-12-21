<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class ProductDTO extends BaseDTO
{
    public function __construct(
        public int $product_category_id,
        public string $code,
        public string $name,
        public float $price,
        public ?string $barcode = null,
        public ?string $description = null,
        public ?float $cost = null,
        public string $unit = 'pack',
        public int $items_per_carton = 10,
        public ?string $image = null,
        public bool $is_active = true,
    ) {
    }
}
