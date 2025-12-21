<?php

declare(strict_types=1);

namespace App\Exceptions;

class DuplicateException extends BusinessException
{
    public function __construct(string $field, string $value)
    {
        parent::__construct(
            "The {$field} '{$value}' already exists.",
            409
        );
    }
}
