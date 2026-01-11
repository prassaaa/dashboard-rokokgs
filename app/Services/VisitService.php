<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\VisitDTO;
use App\Exceptions\UnauthorizedActionException;
use App\Models\Visit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class VisitService extends BaseService
{
    /**
     * Get paginated visits.
     */
    public function getPaginated(
        int $perPage = 15,
        ?int $branchId = null,
        ?int $salesId = null,
        ?string $status = null,
        ?string $visitType = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): LengthAwarePaginator {
        $query = Visit::with(['branch', 'sales', 'area']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($salesId) {
            $query->where('sales_id', $salesId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($visitType) {
            $query->where('visit_type', $visitType);
        }

        if ($startDate) {
            $query->whereDate('visit_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('visit_date', '<=', $endDate);
        }

        return $query->orderBy('visit_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get visit by ID.
     */
    public function getById(int $id): Visit
    {
        return $this->findOrFail(Visit::class, $id);
    }

    /**
     * Create new visit.
     */
    public function create(VisitDTO $dto): Visit
    {
        return $this->executeInTransaction(function () use ($dto) {
            $visit = Visit::create([
                'visit_number' => Visit::generateVisitNumber(),
                'visit_date' => today(),
                'branch_id' => $dto->branch_id,
                'sales_id' => $dto->sales_id,
                'area_id' => $dto->area_id,
                'customer_name' => $dto->customer_name,
                'customer_phone' => $dto->customer_phone,
                'customer_address' => $dto->customer_address,
                'visit_type' => $dto->visit_type,
                'purpose' => $dto->purpose,
                'result' => $dto->result,
                'notes' => $dto->notes,
                'latitude' => $dto->latitude,
                'longitude' => $dto->longitude,
                'photo' => $dto->photo,
                'status' => 'pending',
            ]);

            $this->logAction('Visit created', [
                'visit_id' => $visit->id,
                'visit_number' => $visit->visit_number,
                'customer_name' => $visit->customer_name,
            ]);

            return $visit;
        });
    }

    /**
     * Approve visit.
     *
     * @throws UnauthorizedActionException
     */
    public function approve(int $visitId, int $approvedBy): Visit
    {
        return $this->executeInTransaction(function () use ($visitId, $approvedBy) {
            $visit = $this->getById($visitId);

            if ($visit->status !== 'pending') {
                throw new UnauthorizedActionException('Only pending visits can be approved');
            }

            $visit->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $approvedBy,
            ]);

            $this->logAction('Visit approved', [
                'visit_id' => $visit->id,
                'approved_by' => $approvedBy,
            ]);

            return $visit->fresh();
        });
    }

    /**
     * Reject visit.
     *
     * @throws UnauthorizedActionException
     */
    public function reject(int $visitId, int $rejectedBy, string $reason): Visit
    {
        return $this->executeInTransaction(function () use ($visitId, $rejectedBy, $reason) {
            $visit = $this->getById($visitId);

            if ($visit->status !== 'pending') {
                throw new UnauthorizedActionException('Only pending visits can be rejected');
            }

            $visit->update([
                'status' => 'rejected',
                'notes' => ($visit->notes ? $visit->notes . ' | ' : '') . 'Rejected: ' . $reason,
            ]);

            $this->logAction('Visit rejected', [
                'visit_id' => $visit->id,
                'rejected_by' => $rejectedBy,
                'reason' => $reason,
            ]);

            return $visit->fresh();
        });
    }

    /**
     * Get visits with location data.
     */
    public function getWithLocations(
        ?int $branchId = null,
        ?int $salesId = null,
        ?string $status = null,
        ?string $visitType = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): Collection {
        $query = Visit::with(['branch', 'sales'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($salesId) {
            $query->where('sales_id', $salesId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($visitType) {
            $query->where('visit_type', $visitType);
        }

        if ($startDate) {
            $query->whereDate('visit_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('visit_date', '<=', $endDate);
        }

        return $query->orderBy('visit_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get statistics for visits.
     */
    public function getStatistics(?int $branchId = null, ?int $salesId = null): array
    {
        $query = Visit::query();

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($salesId) {
            $query->where('sales_id', $salesId);
        }

        $total = $query->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();

        $today = (clone $query)->whereDate('visit_date', today())->count();
        $thisWeek = (clone $query)->whereBetween('visit_date', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $thisMonth = (clone $query)->whereMonth('visit_date', now()->month)->whereYear('visit_date', now()->year)->count();

        return [
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'today' => $today,
            'this_week' => $thisWeek,
            'this_month' => $thisMonth,
        ];
    }
}
