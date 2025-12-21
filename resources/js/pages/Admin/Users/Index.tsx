import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    CheckCircle,
    Edit,
    Plus,
    Search,
    Trash2,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Role {
    name: string;
}

interface Area {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    branch: Branch;
    roles: Role[];
    areas: Area[];
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Filters {
    status?: string;
    role?: string;
    search?: string;
}

interface UsersIndexProps {
    users: PaginatedUsers;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'User Management', href: '/admin/users' },
];

export default function UsersIndex({ users, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        userId: number | null;
        userName: string;
    }>({ open: false, userId: null, userName: '' });
    const [approveDialog, setApproveDialog] = useState<{
        open: boolean;
        userId: number | null;
        userName: string;
    }>({ open: false, userId: null, userName: '' });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/users',
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/users',
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveState: true },
        );
    };

    const handleApprove = () => {
        if (approveDialog.userId) {
            router.post(
                `/admin/users/${approveDialog.userId}/approve`,
                {},
                {
                    onSuccess: () =>
                        setApproveDialog({
                            open: false,
                            userId: null,
                            userName: '',
                        }),
                },
            );
        }
    };

    const handleDelete = () => {
        if (deleteDialog.userId) {
            router.delete(`/admin/users/${deleteDialog.userId}`, {
                onSuccess: () =>
                    setDeleteDialog({ open: false, userId: null, userName: '' }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">
                            Kelola pengguna sistem dan hak akses
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/users/create">
                            <Plus className="mr-2 size-4" />
                            Tambah User
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <label className="mb-2 block text-sm font-medium">
                                Cari User
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama atau email..."
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

                        {/* Role Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Role
                            </label>
                            <Select
                                value={filters.role || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('role', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Role
                                    </SelectItem>
                                    <SelectItem value="Super Admin">
                                        Super Admin
                                    </SelectItem>
                                    <SelectItem value="Admin Cabang">
                                        Admin Cabang
                                    </SelectItem>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Users Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <TooltipProvider>
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Nama
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Email
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Role
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Area
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="p-4 text-center text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium">
                                                        {user.name}
                                                    </p>
                                                    {user.phone && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.phone}
                                                    <p className="text-xs text-muted-foreground">
                                                        Dibuat:{' '}
                                                        {format(
                                                            parseISO(
                                                                user.created_at,
                                                            ),
                                                            'dd MMM yyyy',
                                                            {
                                                                locale: idLocale,
                                                            },
                                                        )}
                                                    </p>
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {user.email}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {user.branch.name}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role.name}
                                                            variant="secondary"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.areas.length > 0 ? (
                                                        user.areas.map(
                                                            (area) => (
                                                                <Badge
                                                                    key={area.id}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {area.name}
                                                                </Badge>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {user.is_active ? (
                                                    <Badge
                                                        variant="success"
                                                        className="gap-1"
                                                    >
                                                        <CheckCircle className="size-3" />
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="warning"
                                                        className="gap-1"
                                                    >
                                                        <XCircle className="size-3" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    {!user.is_active && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setApproveDialog(
                                                                            {
                                                                                open: true,
                                                                                userId: user.id,
                                                                                userName:
                                                                                    user.name,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <UserCheck className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Approve User
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                <Link
                                                                    href={`/admin/users/${user.id}/edit`}
                                                                >
                                                                    <Edit className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit User
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setDeleteDialog(
                                                                        {
                                                                            open: true,
                                                                            userId: user.id,
                                                                            userName:
                                                                                user.name,
                                                                        },
                                                                    )
                                                                }
                                                                className="text-destructive hover:bg-destructive hover:text-white"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Hapus User
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data user
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </TooltipProvider>
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {users.data.length} dari{' '}
                                {users.total} user
                            </p>
                            <div className="flex gap-2">
                                {users.links.map((link, index) => (
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

                {/* Approve Confirmation Dialog */}
                <Dialog
                    open={approveDialog.open}
                    onOpenChange={(open) =>
                        setApproveDialog({ ...approveDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve User</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menyetujui registrasi{' '}
                                <strong>{approveDialog.userName}</strong>? User
                                akan dapat login setelah diapprove.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setApproveDialog({
                                        open: false,
                                        userId: null,
                                        userName: '',
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button onClick={handleApprove}>
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onOpenChange={(open) =>
                        setDeleteDialog({ ...deleteDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus User</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus user{' '}
                                <strong>{deleteDialog.userName}</strong>? Aksi
                                ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        userId: null,
                                        userName: '',
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
            </div>
        </AppLayout>
    );
}
