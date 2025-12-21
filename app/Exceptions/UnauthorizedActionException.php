<?php

declare(strict_types=1);

namespace App\Exceptions;

class UnauthorizedActionException extends BusinessException
{
    public function __construct(string $action = 'perform this action')
    {
        parent::__construct(
            "You are not authorized to {$action}.",
            403
        );
    }
}
