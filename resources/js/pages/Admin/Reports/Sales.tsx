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
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Receipt,
    Percent,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface DailySale {
    date: string;
    transactions: number;
    revenue: number;
}

interface Summary {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    total_discount: number;
    total_tax: number;
}

interface SalesProps {
    summary: Summary;
    dailySales: DailySale[];
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
    { title: 'Penjualan', href: '#' },
];

export default function Sales({
    summary,
    dailySales,
    branches,
    filters,
}: SalesProps) {
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
            '/admin/reports/sales',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
                    <p className="text-muted-foreground">
                        Analisis performa penjualan berdasarkan periode
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Transaksi
                                </p>
                                <p className="mt-2 text-xl font-bold lg:text-2xl">
                                    {summary.total_transactions}
                                </p>
                            </div>
                            <div className="shrink-0 rounded-full bg-primary/10 p-3">
                                <Receipt className="size-6 text-primary" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Pendapatan
                                </p>
                                <p className="mt-2 text-lg font-bold xl:text-xl">
                                    {formatCurrency(summary.total_revenue)}
                                </p>
                            </div>
                            <div className="shrink-0 rounded-full bg-green-500/10 p-3">
                                <DollarSign className="size-6 text-green-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Rata-rata Transaksi
                                </p>
                                <p className="mt-2 text-lg font-bold xl:text-xl">
                                    {formatCurrency(summary.average_transaction)}
                                </p>
                            </div>
                            <div className="shrink-0 rounded-full bg-blue-500/10 p-3">
                                <ShoppingCart className="size-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Diskon
                                </p>
                                <p className="mt-2 text-lg font-bold xl:text-xl">
                                    {formatCurrency(summary.total_discount)}
                                </p>
                            </div>
                            <div className="shrink-0 rounded-full bg-orange-500/10 p-3">
                                <Percent className="size-6 text-orange-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Pajak
                                </p>
                                <p className="mt-2 text-lg font-bold xl:text-xl">
                                    {formatCurrency(summary.total_tax)}
                                </p>
                            </div>
                            <div className="shrink-0 rounded-full bg-purple-500/10 p-3">
                                <TrendingUp className="size-6 text-purple-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Daily Sales Table */}
                <Card>
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Penjualan Harian
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-3 text-left text-sm font-semibold">
                                            Tanggal
                                        </th>
                                        <th className="pb-3 text-center text-sm font-semibold">
                                            Jumlah Transaksi
                                        </th>
                                        <th className="pb-3 text-right text-sm font-semibold">
                                            Total Pendapatan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {dailySales.length > 0 ? (
                                        dailySales.map((daily, index) => (
                                            <tr key={index}>
                                                <td className="py-3">
                                                    {format(
                                                        parseISO(daily.date),
                                                        'EEEE, dd MMMM yyyy',
                                                        { locale: idLocale },
                                                    )}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {daily.transactions}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {formatCurrency(
                                                        daily.revenue,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data penjualan untuk
                                                periode ini
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
