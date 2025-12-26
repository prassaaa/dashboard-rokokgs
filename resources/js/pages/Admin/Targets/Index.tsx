import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Can } from '@/components/Can';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface TargetData {
    id: number;
    branch: Branch;
    user: User;
    type: 'revenue' | 'quantity';
    amount: number | null;
    quantity: number | null;
    period_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    year: number;
    month: number | null;
    start_date: string | null;
    end_date: string | null;
}

interface PaginatedTargets {
    data: TargetData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface IndexProps {
    targets: PaginatedTargets;
    branches: Branch[];
    salesUsers: User[];
    filters: {
        branch_id?: string;
        user_id?: string;
        type?: string;
        period_type?: string;
        year?: string;
        month?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Target', href: '/admin/targets' },
];

const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const periodTypeLabels: Record<string, string> = {
    monthly: 'Bulanan',
    quarterly: 'Kuartalan',
    yearly: 'Tahunan',
    custom: 'Custom',
};

const typeLabels: Record<string, string> = {
    revenue: 'Omset',
    quantity: 'Kuantitas',
};

export default function Index({
    targets,
    branches,
    salesUsers,
    filters,
}: IndexProps) {
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        targetId: number | null;
    }>({
        open: false,
        targetId: null,
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...filters };
        if (value === 'all') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        router.get('/admin/targets', newFilters, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.targetId) return;

        router.delete(`/admin/targets/${deleteDialog.targetId}`, {
            onSuccess: () => setDeleteDialog({ open: false, targetId: null }),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPeriodLabel = (target: TargetData) => {
        if (target.period_type === 'monthly' && target.month) {
            return `${monthNames[target.month - 1]} ${target.year}`;
        }
        if (target.period_type === 'yearly') {
            return `Tahun ${target.year}`;
        }
        if (target.period_type === 'quarterly') {
            return `Q${Math.ceil((target.month || 1) / 3)} ${target.year}`;
        }
        if (target.period_type === 'custom' && target.start_date && target.end_date) {
            return `${target.start_date} - ${target.end_date}`;
        }
        return '-';
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Target" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen Target</h1>
                        <p className="text-muted-foreground">
                            Kelola target penjualan untuk setiap sales
                        </p>
                    </div>
                    <Can permission="create-targets">
                        <Button asChild>
                            <Link href="/admin/targets/create">
                                <Plus className="mr-2 size-4" />
                                Tambah Target
                            </Link>
                        </Button>
                    </Can>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Branch Filter */}
                        {branches.length > 1 && (
                            <div className="w-full md:w-40">
                                <label className="mb-2 block text-sm font-medium">
                                    Cabang
                                </label>
                                <Select
                                    value={filters.branch_id || 'all'}
                                    onValueChange={(value) =>
                                        handleFilterChange('branch_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
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
                        )}

                        {/* Sales Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Sales
                            </label>
                            <Select
                                value={filters.user_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('user_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Sales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Sales</SelectItem>
                                    {salesUsers.map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id.toString()}
                                        >
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Filter */}
                        <div className="w-full md:w-36">
                            <label className="mb-2 block text-sm font-medium">
                                Tipe
                            </label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="revenue">Omset</SelectItem>
                                    <SelectItem value="quantity">
                                        Kuantitas
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Period Type Filter */}
                        <div className="w-full md:w-36">
                            <label className="mb-2 block text-sm font-medium">
                                Periode
                            </label>
                            <Select
                                value={filters.period_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('period_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="monthly">Bulanan</SelectItem>
                                    <SelectItem value="quarterly">
                                        Kuartalan
                                    </SelectItem>
                                    <SelectItem value="yearly">Tahunan</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Year Filter */}
                        <div className="w-full md:w-32">
                            <label className="mb-2 block text-sm font-medium">
                                Tahun
                            </label>
                            <Select
                                value={filters.year || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('year', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {years.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Month Filter */}
                        <div className="w-full md:w-36">
                            <label className="mb-2 block text-sm font-medium">
                                Bulan
                            </label>
                            <Select
                                value={filters.month || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('month', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {monthNames.map((month, idx) => (
                                        <SelectItem
                                            key={idx}
                                            value={(idx + 1).toString()}
                                        >
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Targets Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Sales
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Tipe
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Target
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Periode
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {targets.data.length > 0 ? (
                                    targets.data.map((target) => (
                                        <tr
                                            key={target.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                                        <Target className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {target.user?.name ||
                                                                '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm">
                                                    {target.branch?.name || '-'}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        target.type === 'revenue'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {typeLabels[target.type]}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium">
                                                    {target.type === 'revenue'
                                                        ? formatCurrency(
                                                              target.amount || 0,
                                                          )
                                                        : `${target.quantity || 0} unit`}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <Badge variant="outline">
                                                        {
                                                            periodTypeLabels[
                                                                target.period_type
                                                            ]
                                                        }
                                                    </Badge>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {getPeriodLabel(target)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Can permission="edit-targets">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/targets/${target.id}/edit`}
                                                            >
                                                                <Edit className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="delete-targets">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    targetId:
                                                                        target.id,
                                                                })
                                                            }
                                                            className="text-destructive hover:bg-destructive hover:text-white"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data target
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {targets.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {targets.data.length} dari{' '}
                                {targets.total} target
                            </p>
                            <div className="flex gap-2">
                                {targets.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onOpenChange={(open) =>
                        setDeleteDialog({ ...deleteDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Target</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus target ini? Aksi
                                ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        targetId: null,
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
