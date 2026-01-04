import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowDown, ArrowLeft, ArrowUp, History } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    code: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Stock {
    id: number;
    product: Product;
    branch: Branch;
    quantity: number;
    minimum_stock: number;
}

interface User {
    id: number;
    name: string;
}

interface StockMovement {
    id: number;
    type: 'in' | 'out';
    quantity: number;
    reference_id: number | null;
    notes: string | null;
    created_at: string;
    creator: User;
}

interface PaginatedMovements {
    data: StockMovement[];
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

interface MovementsProps {
    stock: Stock;
    movements: PaginatedMovements;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Stok', href: '/admin/stocks' },
    { title: 'Riwayat Pergerakan', href: '#' },
];

export default function Movements({ stock, movements }: MovementsProps) {
    const getMovementTypeLabel = (type: 'in' | 'out') => {
        return type === 'in' ? 'Masuk' : 'Keluar';
    };

    const getMovementTypeColor = (type: 'in' | 'out') => {
        return type === 'in' ? 'text-green-600' : 'text-red-600';
    };

    const getMovementTypeBadge = (type: 'in' | 'out') => {
        return type === 'in' ? 'default' : 'destructive';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Pergerakan Stok" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <Button variant="ghost" size="sm" className="mb-4" asChild>
                        <Link href="/admin/stocks">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">
                        Riwayat Pergerakan Stok
                    </h1>
                    <p className="text-muted-foreground">
                        Lihat semua aktivitas pergerakan stok produk
                    </p>
                </div>

                {/* Stock Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                        Informasi Stok
                    </h3>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Produk
                            </p>
                            <p className="mt-1 font-medium">
                                {stock.product.name}
                            </p>
                            <code className="mt-1 inline-block rounded bg-muted px-2 py-1 text-xs">
                                {stock.product.code}
                            </code>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Cabang
                            </p>
                            <p className="mt-1 font-medium">
                                {stock.branch.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Stok Saat Ini
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {stock.quantity}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Minimum Stok
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {stock.minimum_stock}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Movements Timeline */}
                <Card>
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Timeline Pergerakan
                            </h3>
                            <Badge variant="outline">
                                {movements.total} Aktivitas
                            </Badge>
                        </div>

                        {movements.data.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <History className="mx-auto mb-4 h-12 w-12 opacity-20" />
                                <p className="text-lg font-medium">
                                    Belum ada riwayat pergerakan
                                </p>
                                <p className="mt-1 text-sm">
                                    Pergerakan stok akan muncul di sini
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {movements.data.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="relative flex gap-4 border-l-2 border-muted pb-4 pl-6 last:border-l-0"
                                    >
                                        {/* Timeline Dot */}
                                        <div
                                            className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 ${
                                                movement.type === 'in'
                                                    ? 'border-green-500 bg-green-500'
                                                    : 'border-red-500 bg-red-500'
                                            }`}
                                        />

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {movement.type ===
                                                        'in' ? (
                                                            <ArrowDown className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <ArrowUp className="h-4 w-4 text-red-600" />
                                                        )}
                                                        <span
                                                            className={`font-semibold ${getMovementTypeColor(movement.type)}`}
                                                        >
                                                            Stok{' '}
                                                            {getMovementTypeLabel(
                                                                movement.type,
                                                            )}
                                                        </span>
                                                        <Badge
                                                            variant={getMovementTypeBadge(
                                                                movement.type,
                                                            )}
                                                        >
                                                            {
                                                                movement.type === 'in' ? '+' : '-'
                                                            }
                                                            {movement.quantity}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-2 space-y-1 text-sm">
                                                        {movement.notes && (
                                                            <p className="text-muted-foreground">
                                                                <span className="font-medium text-foreground">
                                                                    Catatan:
                                                                </span>{' '}
                                                                {movement.notes}
                                                            </p>
                                                        )}
                                                        <p className="text-muted-foreground">
                                                            <span className="font-medium text-foreground">
                                                                Oleh:
                                                            </span>{' '}
                                                            {
                                                                movement.creator
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right text-sm text-muted-foreground">
                                                    {format(
                                                        parseISO(
                                                            movement.created_at,
                                                        ),
                                                        'dd MMM yyyy',
                                                        { locale: idLocale },
                                                    )}
                                                    <br />
                                                    {format(
                                                        parseISO(
                                                            movement.created_at,
                                                        ),
                                                        'HH:mm',
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {movements.data.length > 0 && movements.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                Halaman {movements.current_page} dari{' '}
                                {movements.last_page}
                            </div>
                            <div className="flex gap-2">
                                {movements.links.map((link, index) => {
                                    if (!link.url) return null;

                                    return (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active ? 'default' : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => router.get(link.url!)}
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
        </AppLayout>
    );
}
