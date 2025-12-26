import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Can } from '@/components/Can';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, Eye, Receipt, Search, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface Sales {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    customer_name: string;
    total: number;
    discount: number;
    tax: number;
    status: 'pending' | 'completed' | 'cancelled';
    sales: Sales;
    branch: Branch;
    created_at: string;
}

interface PaginatedTransactions {
    data: Transaction[];
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
    transactions: PaginatedTransactions;
    branches: Branch[];
    salesUsers: Sales[];
    filters: {
        branch_id?: string;
        sales_id?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Transaksi', href: '/admin/transactions' },
];

const statusColors: Record<string, string> = {
    pending: 'warning',
    completed: 'default',
    cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

export default function Index({
    transactions,
    branches,
    salesUsers,
    filters,
}: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [approveDialog, setApproveDialog] = useState<{
        open: boolean;
        transactionId: number | null;
    }>({ open: false, transactionId: null });
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        transactionId: number | null;
        reason: string;
    }>({ open: false, transactionId: null, reason: '' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/transactions',
            {
                ...filters,
                search,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/transactions',
            {
                ...filters,
                [key]: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleApprove = () => {
        if (!approveDialog.transactionId) return;

        router.post(
            `/admin/transactions/${approveDialog.transactionId}/approve`,
            {},
            {
                onSuccess: () => {
                    setApproveDialog({ open: false, transactionId: null });
                    toast.success('Transaksi berhasil disetujui');
                },
                onError: () => toast.error('Gagal menyetujui transaksi'),
            },
        );
    };

    const handleReject = () => {
        if (!rejectDialog.transactionId || !rejectDialog.reason) return;

        router.post(
            `/admin/transactions/${rejectDialog.transactionId}/reject`,
            { rejection_reason: rejectDialog.reason },
            {
                onSuccess: () => {
                    setRejectDialog({
                        open: false,
                        transactionId: null,
                        reason: '',
                    });
                    toast.success('Transaksi berhasil ditolak');
                },
                onError: () => toast.error('Gagal menolak transaksi'),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Transaksi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manajemen Transaksi
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor dan kelola transaksi penjualan
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="grid gap-4 md:grid-cols-6">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium">
                                Cari Transaksi
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="size-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Branch Filter */}
                        <div>
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
                                    <SelectValue placeholder="Semua Cabang" />
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

                        {/* Sales Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sales
                            </label>
                            <Select
                                value={filters.sales_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('sales_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Sales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Sales
                                    </SelectItem>
                                    {salesUsers.map((sales) => (
                                        <SelectItem
                                            key={sales.id}
                                            value={sales.id.toString()}
                                        >
                                            {sales.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Menunggu
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Selesai
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Dibatalkan
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Tanggal
                            </label>
                            <Input
                                type="date"
                                value={filters.start_date || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'start_date',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Sales
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Tanggal
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-muted-foreground"
                                        >
                                            <Receipt className="mx-auto mb-4 h-12 w-12 opacity-20" />
                                            <p className="text-lg font-medium">
                                                Tidak ada transaksi
                                            </p>
                                            <p className="mt-1 text-sm">
                                                Transaksi akan muncul di sini
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.data.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium">
                                                    {transaction.customer_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {transaction.sales.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {transaction.branch.name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(
                                                    transaction.total,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={
                                                        statusColors[
                                                            transaction.status
                                                        ] as 'default' | 'warning' | 'destructive'
                                                    }
                                                >
                                                    {
                                                        statusLabels[
                                                            transaction.status
                                                        ]
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm">
                                                {format(
                                                    parseISO(
                                                        transaction.created_at,
                                                    ),
                                                    'dd MMM yyyy',
                                                    { locale: idLocale },
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/transactions/${transaction.id}`}
                                                        >
                                                            <Eye className="mr-1 h-3 w-3" />
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                    {transaction.status ===
                                                        'pending' && (
                                                        <Can permission="approve-sales-transactions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setApproveDialog(
                                                                        {
                                                                            open: true,
                                                                            transactionId:
                                                                                transaction.id,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setRejectDialog(
                                                                        {
                                                                            open: true,
                                                                            transactionId:
                                                                                transaction.id,
                                                                            reason: '',
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="mr-1 h-3 w-3" />
                                                                Tolak
                                                            </Button>
                                                        </Can>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transactions.data.length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {transactions.data.length} dari{' '}
                                {transactions.total} transaksi
                            </div>
                            <div className="flex gap-2">
                                {transactions.links.map((link, index) => {
                                    if (!link.url) return null;

                                    return (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active ? 'default' : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(link.url!)
                                            }
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Approve Dialog */}
            <Dialog
                open={approveDialog.open}
                onOpenChange={(open) =>
                    setApproveDialog({ ...approveDialog, open })
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Transaksi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui transaksi ini?
                            Status transaksi akan diubah menjadi "Selesai".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setApproveDialog({ open: false, transactionId: null })
                            }
                        >
                            Batal
                        </Button>
                        <Button onClick={handleApprove}>
                            Setujui Transaksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog
                open={rejectDialog.open}
                onOpenChange={(open) =>
                    setRejectDialog({ ...rejectDialog, open })
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Transaksi</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan transaksi ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                Alasan Penolakan *
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Contoh: Data tidak valid, duplicate transaksi, dll."
                                value={rejectDialog.reason}
                                onChange={(e) =>
                                    setRejectDialog({
                                        ...rejectDialog,
                                        reason: e.target.value,
                                    })
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setRejectDialog({
                                    open: false,
                                    transactionId: null,
                                    reason: '',
                                })
                            }
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectDialog.reason}
                        >
                            Tolak Transaksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
