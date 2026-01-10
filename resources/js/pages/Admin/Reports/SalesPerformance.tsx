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
import { TrendingUp, DollarSign } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Sales {
    id: number;
    name: string;
    email: string;
}

interface SalesStat {
    sales: Sales;
    total_transactions: number;
    total_revenue: number;
}

interface Branch {
    id: number;
    name: string;
}

interface SalesPerformanceProps {
    salesStats: SalesStat[];
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
    { title: 'Performa Sales', href: '#' },
];

export default function SalesPerformance({
    salesStats,
    branches,
    filters,
}: SalesPerformanceProps) {
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
            '/admin/reports/sales-performance',
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

    const formatCurrency = (amount: number | string | null | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount) || 0);
    };

    const totalTransactions = salesStats.reduce(
        (sum, stat) => sum + (Number(stat.total_transactions) || 0),
        0,
    );
    const totalRevenue = salesStats.reduce(
        (sum, stat) => sum + (Number(stat.total_revenue) || 0),
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Performa Sales" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Laporan Performa Sales</h1>
                    <p className="text-muted-foreground">
                        Analisis kinerja tim penjualan
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
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Transaksi
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {totalTransactions}
                                </p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <TrendingUp className="size-6 text-primary" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Pendapatan
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                            <div className="rounded-full bg-green-500/10 p-3">
                                <DollarSign className="size-6 text-green-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sales Stats Table */}
                <Card>
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Performa Sales
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-3 text-left text-sm font-semibold">
                                            #
                                        </th>
                                        <th className="pb-3 text-left text-sm font-semibold">
                                            Sales
                                        </th>
                                        <th className="pb-3 text-center text-sm font-semibold">
                                            Transaksi
                                        </th>
                                        <th className="pb-3 text-right text-sm font-semibold">
                                            Total Penjualan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {salesStats.length > 0 ? (
                                        salesStats.map((stat, index) => (
                                            <tr key={stat.sales.id}>
                                                <td className="py-3 text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {stat.sales?.name ?? 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {stat.sales?.email ?? 'N/A'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    {stat.total_transactions}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {formatCurrency(
                                                        stat.total_revenue,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data performa sales
                                                untuk periode ini
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
