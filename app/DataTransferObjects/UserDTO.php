<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

readonly class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public ?int $branch_id = null,
        public ?string $phone = null,
        public ?string $avatar = null,
        public bool $is_active = true,
        public ?array $roles = null,
    ) {
    }
}
