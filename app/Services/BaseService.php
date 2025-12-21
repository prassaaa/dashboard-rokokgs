<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

abstract class BaseService
{
    /**
     * Execute a database transaction.
     *
     * @param callable $callback
     * @return mixed
     * @throws \Throwable
     */
    protected function executeInTransaction(callable $callback): mixed
    {
        try {
            return DB::transaction($callback);
        } catch (\Throwable $e) {
            Log::error('Transaction failed: ' . $e->getMessage(), [
                'service' => static::class,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Log an action.
     */
    protected function logAction(string $action, array $context = []): void
    {
        Log::info($action, array_merge([
            'service' => static::class,
            'user_id' => auth()->id(),
        ], $context));
    }

    /**
     * Log an error.
     */
    protected function logError(string $message, \Throwable $exception): void
    {
        Log::error($message, [
            'service' => static::class,
            'user_id' => auth()->id(),
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    /**
     * Check if model exists.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    protected function findOrFail(string $modelClass, int|string $id): Model
    {
        return $modelClass::findOrFail($id);
    }
}
