<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesTransaction extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'transaction_number',
        'transaction_date',
        'branch_id',
        'sales_id',
        'area_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'subtotal',
        'discount',
        'tax',
        'total',
        'payment_method',
        'status',
        'notes',
        'latitude',
        'longitude',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the branch that owns the transaction.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the sales that owns the transaction.
     */
    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    /**
     * Get the area that owns the transaction.
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the approver of the transaction.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the items for the transaction.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesTransactionItem::class);
    }

    /**
     * Get the commission for the transaction.
     */
    public function commission(): HasOne
    {
        return $this->hasOne(Commission::class);
    }
}
