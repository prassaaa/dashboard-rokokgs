import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Can } from '@/components/Can';
import { Checkbox } from '@/components/ui/checkbox';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, DollarSign, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Sales {
    id: number;
    name: string;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    customer_name: string;
    total: number;
}

interface Commission {
    id: number;
    sales: Sales;
    sales_transaction: SalesTransaction;
    commission_amount: number;
    commission_percentage: number;
    transaction_amount: number;
    status: 'pending' | 'approved' | 'paid';
    paid_at: string | null;
    created_at: string;
}

interface Branch {
    id: number;
    name: string;
}

interface PaginatedCommissions {
    data: Commission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface IndexProps {
    commissions: PaginatedCommissions;
    branches: Branch[];
    salesUsers: Sales[];
    filters: {
        branch_id?: string;
        sales_id?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Komisi', href: '#' },
];

const statusColors: Record<string, string> = {
    pending: 'warning',
    approved: 'default',
    paid: 'default',
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    paid: 'Dibayar',
};

export default function Index({
    commissions,
    branches,
    salesUsers,
    filters,
}: IndexProps) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [batchApproveDialog, setBatchApproveDialog] = useState(false);
    const [batchPayDialog, setBatchPayDialog] = useState(false);
    const [singleActionDialog, setSingleActionDialog] = useState<{
        open: boolean;
        type: 'approve' | 'pay' | null;
        id: number | null;
    }>({ open: false, type: null, id: null });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/commissions',
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

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/commissions',
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

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(commissions.data.map((c: Commission) => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((i) => i !== id));
        }
    };

    const handleBatchApprove = () => {
        router.post(
            '/admin/commissions/batch-approve',
            { commission_ids: selectedIds },
            {
                onSuccess: () => {
                    setBatchApproveDialog(false);
                    setSelectedIds([]);
                    toast.success(`${selectedIds.length} komisi berhasil disetujui`);
                },
                onError: () => toast.error('Gagal menyetujui komisi'),
            },
        );
    };

    const handleBatchPay = () => {
        router.post(
            '/admin/commissions/batch-pay',
            { commission_ids: selectedIds },
            {
                onSuccess: () => {
                    setBatchPayDialog(false);
                    setSelectedIds([]);
                    toast.success(`${selectedIds.length} komisi berhasil dibayar`);
                },
                onError: () => toast.error('Gagal membayar komisi'),
            },
        );
    };

    const handleSingleAction = () => {
        if (!singleActionDialog.id || !singleActionDialog.type) return;

        const endpoint =
            singleActionDialog.type === 'approve'
                ? `/admin/commissions/${singleActionDialog.id}/approve`
                : `/admin/commissions/${singleActionDialog.id}/pay`;

        const successMessage = singleActionDialog.type === 'approve'
            ? 'Komisi berhasil disetujui'
            : 'Komisi berhasil dibayar';

        router.post(endpoint, {}, {
            onSuccess: () => {
                setSingleActionDialog({ open: false, type: null, id: null });
                toast.success(successMessage);
            },
            onError: () => toast.error(`Gagal ${singleActionDialog.type === 'approve' ? 'menyetujui' : 'membayar'} komisi`),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const canBatchApprove = selectedIds.length > 0 &&
        commissions.data
            .filter((c: Commission) => selectedIds.includes(c.id))
            .every((c: Commission) => c.status === 'pending');

    const canBatchPay = selectedIds.length > 0 &&
        commissions.data
            .filter((c: Commission) => selectedIds.includes(c.id))
            .every((c: Commission) => c.status === 'approved');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Komisi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen Komisi</h1>
                        <p className="text-muted-foreground">
                            Kelola komisi penjualan sales
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <>
                                <Can permission="approve-commissions">
                                    <Button
                                        variant="outline"
                                        onClick={() => setBatchApproveDialog(true)}
                                        disabled={!canBatchApprove}
                                    >
                                        <CheckCircle className="mr-2 size-4" />
                                        Setujui ({selectedIds.length})
                                    </Button>
                                </Can>
                                <Can permission="pay-commissions">
                                    <Button
                                        onClick={() => setBatchPayDialog(true)}
                                        disabled={!canBatchPay}
                                    >
                                        <DollarSign className="mr-2 size-4" />
                                        Bayar ({selectedIds.length})
                                    </Button>
                                </Can>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-2">
                                <Label>Cabang</Label>
                                <Select
                                    value={filters.branch_id || 'all'}
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

                            <div className="space-y-2">
                                <Label>Sales</Label>
                                <Select
                                    value={filters.sales_id || 'all'}
                                    onValueChange={(value) =>
                                        handleFilterChange('sales_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
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

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) =>
                                        handleFilterChange('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            Menunggu
                                        </SelectItem>
                                        <SelectItem value="approved">
                                            Disetujui
                                        </SelectItem>
                                        <SelectItem value="paid">
                                            Dibayar
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
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

                            <div className="space-y-2">
                                <Label>Tanggal Akhir</Label>
                                <Input
                                    type="date"
                                    value={filters.end_date || ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'end_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSearch}>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari customer atau sales..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit">Cari</Button>
                            </div>
                        </form>
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-4 text-left">
                                        <Checkbox
                                            checked={
                                                selectedIds.length ===
                                                    commissions.data.length &&
                                                commissions.data.length > 0
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Sales
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Customer
                                    </th>
                                    <th className="p-4 text-right text-sm font-semibold">
                                        Total Transaksi
                                    </th>
                                    <th className="p-4 text-right text-sm font-semibold">
                                        Komisi
                                    </th>
                                    <th className="p-4 text-center text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Tanggal
                                    </th>
                                    <th className="p-4 text-center text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {commissions.data.map((commission: Commission) => (
                                    <tr key={commission.id}>
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedIds.includes(
                                                    commission.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    handleSelectOne(
                                                        commission.id,
                                                        checked as boolean,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">
                                                    {commission.sales?.name ?? '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/admin/transactions/${commission.sales_transaction?.id}`}
                                                className="hover:underline"
                                            >
                                                {
                                                    commission.sales_transaction
                                                        ?.customer_name ?? '-'
                                                }
                                            </Link>
                                        </td>
                                        <td className="p-4 text-right">
                                            {formatCurrency(
                                                commission.sales_transaction
                                                    ?.total ?? 0,
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatCurrency(commission.commission_amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge
                                                variant={
                                                    statusColors[
                                                        commission.status
                                                    ] as 'default' | 'warning' | 'destructive'
                                                }
                                            >
                                                {
                                                    statusLabels[
                                                        commission.status
                                                    ]
                                                }
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm">
                                                    {format(
                                                        parseISO(
                                                            commission.created_at,
                                                        ),
                                                        'dd MMM yyyy',
                                                        { locale: idLocale },
                                                    )}
                                                </p>
                                                {commission.paid_at && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Dibayar:{' '}
                                                        {format(
                                                            parseISO(
                                                                commission.paid_at,
                                                            ),
                                                            'dd MMM yyyy',
                                                            {
                                                                locale: idLocale,
                                                            },
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                {commission.status ===
                                                    'pending' && (
                                                    <Can permission="approve-commissions">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setSingleActionDialog(
                                                                    {
                                                                        open: true,
                                                                        type: 'approve',
                                                                        id: commission.id,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <CheckCircle className="mr-2 size-4" />
                                                            Setujui
                                                        </Button>
                                                    </Can>
                                                )}
                                                {commission.status ===
                                                    'approved' && (
                                                    <Can permission="pay-commissions">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setSingleActionDialog(
                                                                    {
                                                                        open: true,
                                                                        type: 'pay',
                                                                        id: commission.id,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <DollarSign className="mr-2 size-4" />
                                                            Bayar
                                                        </Button>
                                                    </Can>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {commissions.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {commissions.from} -{' '}
                                {commissions.to} dari {commissions.total} komisi
                            </p>
                            <div className="flex gap-2">
                                {commissions.links.map((link: { url: string | null; label: string; active: boolean }, index: number) => (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
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
            </div>

            {/* Batch Approve Dialog */}
            <Dialog
                open={batchApproveDialog}
                onOpenChange={setBatchApproveDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Komisi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui{' '}
                            {selectedIds.length} komisi terpilih?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBatchApproveDialog(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleBatchApprove}>
                            Setujui Komisi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Pay Dialog */}
            <Dialog open={batchPayDialog} onOpenChange={setBatchPayDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bayar Komisi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menandai {selectedIds.length}{' '}
                            komisi terpilih sebagai sudah dibayar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBatchPayDialog(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleBatchPay}>Bayar Komisi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Single Action Dialog */}
            <Dialog
                open={singleActionDialog.open}
                onOpenChange={(open) =>
                    setSingleActionDialog({ ...singleActionDialog, open })
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {singleActionDialog.type === 'approve'
                                ? 'Setujui Komisi'
                                : 'Bayar Komisi'}
                        </DialogTitle>
                        <DialogDescription>
                            {singleActionDialog.type === 'approve'
                                ? 'Apakah Anda yakin ingin menyetujui komisi ini?'
                                : 'Apakah Anda yakin ingin menandai komisi ini sebagai sudah dibayar?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setSingleActionDialog({
                                    open: false,
                                    type: null,
                                    id: null,
                                })
                            }
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSingleAction}>
                            {singleActionDialog.type === 'approve'
                                ? 'Setujui'
                                : 'Bayar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
