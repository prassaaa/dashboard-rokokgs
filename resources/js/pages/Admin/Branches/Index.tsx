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
import { Building2, Edit, Plus, Power, Search, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    users_count: number;
    stocks_count: number;
}

interface PaginatedBranches {
    data: Branch[];
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
    branches: PaginatedBranches;
    filters: {
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Cabang', href: '/admin/branches' },
];

export default function Index({ branches, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        branchId: number | null;
        branchName: string;
    }>({
        open: false,
        branchId: null,
        branchName: '',
    });
    const [toggleDialog, setToggleDialog] = useState<{
        open: boolean;
        branchId: number | null;
        branchName: string;
        isActive: boolean;
    }>({
        open: false,
        branchId: null,
        branchName: '',
        isActive: false,
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/branches',
            { search, status: filters.status },
            { preserveState: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...filters };
        if (value === 'all') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        router.get('/admin/branches', newFilters, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.branchId) return;

        router.delete(`/admin/branches/${deleteDialog.branchId}`, {
            onSuccess: () => {
                setDeleteDialog({ open: false, branchId: null, branchName: '' });
                toast.success('Cabang berhasil dihapus');
            },
            onError: () => toast.error('Gagal menghapus cabang'),
        });
    };

    const handleToggleStatus = () => {
        if (!toggleDialog.branchId) return;

        router.post(`/admin/branches/${toggleDialog.branchId}/toggle-status`, {}, {
            onSuccess: () => {
                const status = toggleDialog.isActive ? 'dinonaktifkan' : 'diaktifkan';
                setToggleDialog({ open: false, branchId: null, branchName: '', isActive: false });
                toast.success(`Cabang berhasil ${status}`);
            },
            onError: () => toast.error('Gagal mengubah status cabang'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Cabang" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen Cabang</h1>
                        <p className="text-muted-foreground">
                            Kelola cabang dan lokasi bisnis
                        </p>
                    </div>
                    <Can permission="create-branches">
                        <Button asChild>
                            <Link href="/admin/branches/create">
                                <Plus className="mr-2 size-4" />
                                Tambah Cabang
                            </Link>
                        </Button>
                    </Can>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <label className="mb-2 block text-sm font-medium">
                                Cari Cabang
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama atau kode cabang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="size-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Status Filter */}
                        <div className="w-full md:w-48">
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
                                    <SelectItem value="active">
                                        Aktif
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Tidak Aktif
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Branches Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Alamat
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Telepon
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Users
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Stok
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Dibuat
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {branches.data.length > 0 ? (
                                    branches.data.map((branch) => (
                                        <tr
                                            key={branch.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                                        <Building2 className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {branch.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {branch.code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="max-w-xs text-sm">
                                                    {branch.address}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm">
                                                    {branch.phone || '-'}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">
                                                    {branch.users_count} users
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">
                                                    {branch.stocks_count} items
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        branch.is_active
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {branch.is_active
                                                        ? 'Aktif'
                                                        : 'Tidak Aktif'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-muted-foreground">
                                                    {format(
                                                        parseISO(
                                                            branch.created_at,
                                                        ),
                                                        'dd MMM yyyy',
                                                        { locale: idLocale },
                                                    )}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Can permission="edit-branches">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/branches/${branch.id}/edit`}
                                                            >
                                                                <Edit className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="edit-branches">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setToggleDialog({
                                                                    open: true,
                                                                    branchId:
                                                                        branch.id,
                                                                    branchName:
                                                                        branch.name,
                                                                    isActive:
                                                                        branch.is_active,
                                                                })
                                                            }
                                                            className={
                                                                branch.is_active
                                                                    ? 'text-orange-600 hover:bg-orange-600 hover:text-white'
                                                                    : 'text-green-600 hover:bg-green-600 hover:text-white'
                                                            }
                                                            title={
                                                                branch.is_active
                                                                    ? 'Nonaktifkan cabang'
                                                                    : 'Aktifkan cabang'
                                                            }
                                                        >
                                                            <Power className="size-4" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="delete-branches">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    branchId:
                                                                        branch.id,
                                                                    branchName:
                                                                        branch.name,
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
                                            colSpan={8}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data cabang
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {branches.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {branches.data.length} dari{' '}
                                {branches.total} cabang
                            </p>
                            <div className="flex gap-2">
                                {branches.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
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
                            <DialogTitle>Hapus Cabang</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus cabang{' '}
                                <strong>{deleteDialog.branchName}</strong>? Aksi
                                ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        branchId: null,
                                        branchName: '',
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Toggle Status Confirmation Dialog */}
                <Dialog
                    open={toggleDialog.open}
                    onOpenChange={(open) =>
                        setToggleDialog({ ...toggleDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {toggleDialog.isActive
                                    ? 'Nonaktifkan Cabang'
                                    : 'Aktifkan Cabang'}
                            </DialogTitle>
                            <DialogDescription>
                                {toggleDialog.isActive ? (
                                    <>
                                        Apakah Anda yakin ingin menonaktifkan
                                        cabang{' '}
                                        <strong>
                                            {toggleDialog.branchName}
                                        </strong>
                                        ? Semua user di cabang ini tidak akan
                                        bisa login.
                                    </>
                                ) : (
                                    <>
                                        Apakah Anda yakin ingin mengaktifkan
                                        kembali cabang{' '}
                                        <strong>
                                            {toggleDialog.branchName}
                                        </strong>
                                        ?
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setToggleDialog({
                                        open: false,
                                        branchId: null,
                                        branchName: '',
                                        isActive: false,
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button
                                variant={
                                    toggleDialog.isActive
                                        ? 'destructive'
                                        : 'default'
                                }
                                onClick={handleToggleStatus}
                            >
                                {toggleDialog.isActive
                                    ? 'Nonaktifkan'
                                    : 'Aktifkan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
