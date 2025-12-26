import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    DollarSign,
    Clock,
    CheckCircle,
    Banknote,
    TrendingUp,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface Summary {
    total_commissions: number;
    pending_commissions: number;
    approved_commissions: number;
    paid_commissions: number;
    count_pending: number;
    count_approved: number;
    count_paid: number;
}

interface CommissionsProps {
    summary: Summary;
    branches: Branch[];
    filters: {
        start_date?: string;
        end_date?: string;
        branch_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Laporan', href: '#' },
    { title: 'Komisi', href: '#' },
];

export default function Commissions({
    summary,
    branches,
    filters,
}: CommissionsProps) {
    const [localFilters, setLocalFilters] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        branch_id: filters.branch_id || 'all',
    });

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters({ ...localFilters, [key]: value });
    };

    const handleApplyFilters = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/reports/commissions',
            {
                start_date: localFilters.start_date,
                end_date: localFilters.end_date,
                branch_id:
                    localFilters.branch_id === 'all'
                        ? undefined
                        : localFilters.branch_id,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalCount =
        summary.count_pending + summary.count_approved + summary.count_paid;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Komisi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Laporan Komisi</h1>
                    <p className="text-muted-foreground">
                        Ringkasan pembayaran komisi sales
                    </p>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <form onSubmit={handleApplyFilters}>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Tanggal Mulai</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.start_date}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'start_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Akhir</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.end_date}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'end_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cabang</Label>
                                    <Select
                                        value={localFilters.branch_id}
                                        onValueChange={(value) =>
                                            handleFilterChange('branch_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Cabang
                                            </SelectItem>
                                            {branches.map((branch) => (
                                                <SelectItem
                                                    key={branch.id}
                                                    value={branch.id.toString()}
                                                >
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">
                                    Tampilkan Laporan
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Komisi
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(summary.total_commissions)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {totalCount} komisi
                                </p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <DollarSign className="size-6 text-primary" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Menunggu
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(summary.pending_commissions)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.count_pending} komisi
                                </p>
                            </div>
                            <div className="rounded-full bg-orange-500/10 p-3">
                                <Clock className="size-6 text-orange-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Disetujui
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(
                                        summary.approved_commissions,
                                    )}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.count_approved} komisi
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-500/10 p-3">
                                <CheckCircle className="size-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Dibayar
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(summary.paid_commissions)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.count_paid} komisi
                                </p>
                            </div>
                            <div className="rounded-full bg-green-500/10 p-3">
                                <Banknote className="size-6 text-green-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Status Breakdown */}
                <Card>
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Rincian Status Komisi
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-orange-500/10 p-2">
                                        <Clock className="size-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            Komisi Menunggu Persetujuan
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Belum disetujui oleh admin
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">
                                        {formatCurrency(
                                            summary.pending_commissions,
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {summary.count_pending} komisi (
                                        {totalCount > 0
                                            ? (
                                                  (summary.count_pending /
                                                      totalCount) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-blue-500/10 p-2">
                                        <CheckCircle className="size-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            Komisi Disetujui
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Menunggu pembayaran
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">
                                        {formatCurrency(
                                            summary.approved_commissions,
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {summary.count_approved} komisi (
                                        {totalCount > 0
                                            ? (
                                                  (summary.count_approved /
                                                      totalCount) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-500/10 p-2">
                                        <Banknote className="size-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            Komisi Dibayar
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Sudah diselesaikan
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">
                                        {formatCurrency(summary.paid_commissions)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {summary.count_paid} komisi (
                                        {totalCount > 0
                                            ? (
                                                  (summary.count_paid /
                                                      totalCount) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Payment Progress */}
                <Card>
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Progress Pembayaran
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="mb-2 flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Sudah Dibayar
                                    </span>
                                    <span className="font-medium">
                                        {summary.total_commissions > 0
                                            ? (
                                                  (summary.paid_commissions /
                                                      summary.total_commissions) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{
                                            width: `${summary.total_commissions > 0 ? (summary.paid_commissions / summary.total_commissions) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="size-5 text-primary" />
                                    <span className="text-sm font-medium">
                                        Sisa yang perlu dibayar
                                    </span>
                                </div>
                                <span className="text-lg font-bold">
                                    {formatCurrency(
                                        summary.pending_commissions +
                                            summary.approved_commissions,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
