<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class BranchDTO extends BaseDTO
{
    public function __construct(
        public string $code,
        public string $name,
        public ?string $address = null,
        public ?string $city = null,
        public ?string $province = null,
        public ?string $phone = null,
        public ?string $email = null,
        public bool $is_active = true,
    ) {
    }
}
