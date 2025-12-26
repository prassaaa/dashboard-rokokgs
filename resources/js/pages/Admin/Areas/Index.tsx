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
import { Edit, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Branch {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    branch: Branch;
    users_count: number;
}

interface PaginatedAreas {
    data: Area[];
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
    areas: PaginatedAreas;
    branches: Branch[];
    filters: {
        branch_id?: string;
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Area', href: '/admin/areas' },
];

export default function Index({ areas, branches, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        areaId: number | null;
        areaName: string;
    }>({
        open: false,
        areaId: null,
        areaName: '',
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/areas',
            { ...filters, search },
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
        router.get('/admin/areas', newFilters, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.areaId) return;

        router.delete(`/admin/areas/${deleteDialog.areaId}`, {
            onSuccess: () => {
                setDeleteDialog({ open: false, areaId: null, areaName: '' });
                toast.success('Area berhasil dihapus');
            },
            onError: () => toast.error('Gagal menghapus area'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Area" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen Area</h1>
                        <p className="text-muted-foreground">
                            Kelola area dan wilayah penjualan
                        </p>
                    </div>
                    <Can permission="create-areas">
                        <Button asChild>
                            <Link href="/admin/areas/create">
                                <Plus className="mr-2 size-4" />
                                Tambah Area
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
                                Cari Area
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama atau kode area..."
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
                        {branches.length > 1 && (
                            <div className="w-full md:w-48">
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
                        )}

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
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">
                                        Tidak Aktif
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Areas Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Area
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Deskripsi
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Sales
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {areas.data.length > 0 ? (
                                    areas.data.map((area) => (
                                        <tr
                                            key={area.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                                        <MapPin className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {area.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {area.code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm">
                                                    {area.branch?.name || '-'}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="max-w-xs text-sm text-muted-foreground">
                                                    {area.description || '-'}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">
                                                    <Users className="mr-1 size-3" />
                                                    {area.users_count} sales
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        area.is_active
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {area.is_active
                                                        ? 'Aktif'
                                                        : 'Tidak Aktif'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Can permission="edit-areas">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/areas/${area.id}/edit`}
                                                            >
                                                                <Edit className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="delete-areas">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    areaId: area.id,
                                                                    areaName: area.name,
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
                                            Tidak ada data area
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {areas.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {areas.data.length} dari {areas.total}{' '}
                                area
                            </p>
                            <div className="flex gap-2">
                                {areas.links.map((link, index) => (
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
                            <DialogTitle>Hapus Area</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus area{' '}
                                <strong>{deleteDialog.areaName}</strong>? Aksi ini
                                tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        areaId: null,
                                        areaName: '',
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
