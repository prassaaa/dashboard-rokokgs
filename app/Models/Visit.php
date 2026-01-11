<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visit extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'visit_number',
        'visit_date',
        'branch_id',
        'sales_id',
        'area_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'visit_type',
        'status',
        'purpose',
        'result',
        'notes',
        'latitude',
        'longitude',
        'photo',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the branch that owns the visit.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the sales that owns the visit.
     */
    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    /**
     * Get the area that owns the visit.
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the approver of the visit.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Generate unique visit number.
     */
    public static function generateVisitNumber(): string
    {
        $prefix = 'VST';
        $date = now()->format('Ymd');
        $lastVisit = self::whereDate('created_at', today())
            ->orderByDesc('id')
            ->first();

        $sequence = $lastVisit
            ? (int) substr($lastVisit->visit_number, -4) + 1
            : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
