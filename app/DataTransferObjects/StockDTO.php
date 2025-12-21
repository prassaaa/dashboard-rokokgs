<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class StockDTO extends BaseDTO
{
    public function __construct(
        public int $product_id,
        public int $branch_id,
        public int $quantity,
        public int $minimum_stock = 0,
    ) {
    }
}
