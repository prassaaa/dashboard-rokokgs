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
import { CheckCircle, Eye, MapPin, UserCheck, Search, XCircle, Calendar, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface Sales {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
}

interface Visit {
    id: number;
    visit_number: string;
    customer_name: string;
    customer_address: string | null;
    visit_type: string;
    status: 'pending' | 'approved' | 'rejected';
    purpose: string | null;
    visit_date: string;
    sales: Sales | null;
    branch: Branch | null;
    area: Area | null;
    created_at: string;
}

interface PaginatedVisits {
    data: Visit[];
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

interface Statistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    today: number;
    this_week: number;
    this_month: number;
}

interface VisitType {
    value: string;
    label: string;
}

interface IndexProps {
    visits: PaginatedVisits;
    branches: Branch[];
    salesUsers: Sales[];
    statistics: Statistics;
    visitTypes: VisitType[];
    filters: {
        branch_id?: string;
        sales_id?: string;
        status?: string;
        visit_type?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Kunjungan', href: '/admin/visits' },
];

const statusColors: Record<string, string> = {
    pending: 'warning',
    approved: 'default',
    rejected: 'destructive',
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

const visitTypeColors: Record<string, string> = {
    routine: 'secondary',
    prospecting: 'outline',
    follow_up: 'default',
    complaint: 'destructive',
    other: 'secondary',
};

export default function Index({
    visits,
    branches,
    salesUsers,
    statistics,
    visitTypes,
    filters,
}: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [approveDialog, setApproveDialog] = useState<{
        open: boolean;
        visitId: number | null;
    }>({ open: false, visitId: null });
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        visitId: number | null;
        reason: string;
    }>({ open: false, visitId: null, reason: '' });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/visits',
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
            '/admin/visits',
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
        if (!approveDialog.visitId) return;

        router.post(
            `/admin/visits/${approveDialog.visitId}/approve`,
            {},
            {
                onSuccess: () => {
                    setApproveDialog({ open: false, visitId: null });
                    toast.success('Kunjungan berhasil disetujui');
                },
                onError: () => toast.error('Gagal menyetujui kunjungan'),
            },
        );
    };

    const handleReject = () => {
        if (!rejectDialog.visitId || !rejectDialog.reason) return;

        router.post(
            `/admin/visits/${rejectDialog.visitId}/reject`,
            { rejection_reason: rejectDialog.reason },
            {
                onSuccess: () => {
                    setRejectDialog({
                        open: false,
                        visitId: null,
                        reason: '',
                    });
                    toast.success('Kunjungan berhasil ditolak');
                },
                onError: () => toast.error('Gagal menolak kunjungan'),
            },
        );
    };

    const getVisitTypeLabel = (type: string) => {
        const found = visitTypes.find(vt => vt.value === type);
        return found?.label || type;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kunjungan" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manajemen Kunjungan
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor dan kelola kunjungan sales ke pelanggan
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/admin/visits/locations">
                            <MapPin className="mr-2 h-4 w-4" />
                            Lihat Peta Lokasi
                        </Link>
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                                <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Kunjungan</p>
                                <p className="text-2xl font-bold">{statistics.total}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
                                <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Menunggu Approval</p>
                                <p className="text-2xl font-bold">{statistics.pending}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Hari Ini</p>
                                <p className="text-2xl font-bold">{statistics.today}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
                                <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Bulan Ini</p>
                                <p className="text-2xl font-bold">{statistics.this_month}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="grid gap-4 md:grid-cols-7">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium">
                                Cari Kunjungan
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

                        {/* Visit Type Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Tipe Kunjungan
                            </label>
                            <Select
                                value={filters.visit_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('visit_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe
                                    </SelectItem>
                                    {visitTypes.map((type) => (
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
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
                                    <SelectItem value="approved">
                                        Disetujui
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Ditolak
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
                                        No. Kunjungan
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Sales
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Tipe
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
                                {visits.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-muted-foreground"
                                        >
                                            <UserCheck className="mx-auto mb-4 h-12 w-12 opacity-20" />
                                            <p className="text-lg font-medium">
                                                Tidak ada kunjungan
                                            </p>
                                            <p className="mt-1 text-sm">
                                                Kunjungan akan muncul di sini
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    visits.data.map((visit) => (
                                        <tr
                                            key={visit.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-sm">
                                                    {visit.visit_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">
                                                    {visit.customer_name}
                                                </div>
                                                {visit.customer_address && (
                                                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {visit.customer_address}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{visit.sales?.name ?? 'N/A'}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {visit.branch?.name ?? 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={
                                                        visitTypeColors[visit.visit_type] as 'default' | 'secondary' | 'outline' | 'destructive'
                                                    }
                                                >
                                                    {getVisitTypeLabel(visit.visit_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={
                                                        statusColors[
                                                            visit.status
                                                        ] as 'default' | 'warning' | 'destructive'
                                                    }
                                                >
                                                    {statusLabels[visit.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm">
                                                {format(
                                                    parseISO(visit.created_at),
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
                                                            href={`/admin/visits/${visit.id}`}
                                                        >
                                                            <Eye className="mr-1 h-3 w-3" />
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                    {visit.status === 'pending' && (
                                                        <Can permission="approve-sales-transactions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setApproveDialog({
                                                                        open: true,
                                                                        visitId: visit.id,
                                                                    })
                                                                }
                                                            >
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setRejectDialog({
                                                                        open: true,
                                                                        visitId: visit.id,
                                                                        reason: '',
                                                                    })
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
                    {visits.data.length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {visits.data.length} dari{' '}
                                {visits.total} kunjungan
                            </div>
                            <div className="flex gap-2">
                                {visits.links.map((link, index) => {
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
                        <DialogTitle>Setujui Kunjungan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui kunjungan ini?
                            Status kunjungan akan diubah menjadi "Disetujui".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setApproveDialog({ open: false, visitId: null })
                            }
                        >
                            Batal
                        </Button>
                        <Button onClick={handleApprove}>
                            Setujui Kunjungan
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
                        <DialogTitle>Tolak Kunjungan</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan kunjungan ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                Alasan Penolakan *
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Contoh: Lokasi tidak valid, foto tidak jelas, dll."
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
                                    visitId: null,
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
                            Tolak Kunjungan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
