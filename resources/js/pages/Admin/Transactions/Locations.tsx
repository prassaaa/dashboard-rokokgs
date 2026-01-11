import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Eye, List, MapPin, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

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
    customer_address: string | null;
    total: number;
    status: 'pending' | 'approved' | 'cancelled';
    latitude: number;
    longitude: number;
    transaction_date: string | null;
    created_at: string;
    sales: Sales | null;
    branch: Branch | null;
}

interface LocationsProps {
    transactions: Transaction[];
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
    { title: 'Manajemen Transaksi', href: '/admin/transactions' },
    { title: 'Peta Lokasi', href: '/admin/transactions/locations' },
];

const statusColors: Record<string, 'default' | 'warning' | 'destructive'> = {
    pending: 'warning',
    approved: 'default',
    cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    cancelled: 'Dibatalkan',
};

// Custom marker icons based on status
const createMarkerIcon = (status: string) => {
    const colors: Record<string, string> = {
        pending: '#f59e0b', // amber
        approved: '#22c55e', // green
        cancelled: '#ef4444', // red
    };

    const color = colors[status] || '#6b7280';

    return icon({
        iconUrl: `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
                <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
            </svg>
        `)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

// Component to fit map bounds to all markers
function FitBounds({ transactions }: { transactions: Transaction[] }) {
    const map = useMap();

    useEffect(() => {
        if (transactions.length === 0) return;

        if (transactions.length === 1) {
            // Single marker: center and zoom
            map.setView(
                [transactions[0].latitude, transactions[0].longitude],
                15
            );
        } else {
            // Multiple markers: fit bounds
            const bounds = new LatLngBounds(
                transactions.map((t) => [t.latitude, t.longitude])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [transactions, map]);

    return null;
}

export default function Locations({
    transactions,
    branches,
    salesUsers,
    filters,
}: LocationsProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/transactions/locations',
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

    const handleRefresh = () => {
        router.reload({ only: ['transactions'] });
    };

    // Calculate map center based on transactions
    const mapCenter = useMemo(() => {
        if (transactions.length === 0) {
            // Default center: Indonesia (Jakarta area)
            return { lat: -6.2088, lng: 106.8456 };
        }

        const sumLat = transactions.reduce((sum, t) => sum + t.latitude, 0);
        const sumLng = transactions.reduce((sum, t) => sum + t.longitude, 0);

        return {
            lat: sumLat / transactions.length,
            lng: sumLng / transactions.length,
        };
    }, [transactions]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: transactions.length,
            pending: transactions.filter((t) => t.status === 'pending').length,
            approved: transactions.filter((t) => t.status === 'approved').length,
            cancelled: transactions.filter((t) => t.status === 'cancelled').length,
            totalValue: transactions.reduce((sum, t) => sum + t.total, 0),
        };
    }, [transactions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Peta Lokasi Transaksi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Peta Lokasi Transaksi</h1>
                        <p className="text-muted-foreground">
                            Visualisasi lokasi transaksi penjualan
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/transactions">
                                <List className="mr-2 h-4 w-4" />
                                Lihat Daftar
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Total Lokasi</div>
                        <div className="mt-1 text-2xl font-bold">{stats.total}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Menunggu</div>
                        <div className="mt-1 text-2xl font-bold text-amber-500">
                            {stats.pending}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Disetujui</div>
                        <div className="mt-1 text-2xl font-bold text-green-500">
                            {stats.approved}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Dibatalkan</div>
                        <div className="mt-1 text-2xl font-bold text-red-500">
                            {stats.cancelled}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Total Nilai</div>
                        <div className="mt-1 text-lg font-bold">
                            {formatCurrency(stats.totalValue)}
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="grid gap-4 md:grid-cols-5">
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
                                    <SelectItem value="all">Semua Cabang</SelectItem>
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
                                    <SelectItem value="all">Semua Sales</SelectItem>
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
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="pending">Menunggu</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Dari Tanggal
                            </label>
                            <Input
                                type="date"
                                value={filters.start_date || ''}
                                onChange={(e) =>
                                    handleFilterChange('start_date', e.target.value)
                                }
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sampai Tanggal
                            </label>
                            <Input
                                type="date"
                                value={filters.end_date || ''}
                                onChange={(e) =>
                                    handleFilterChange('end_date', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </Card>

                {/* Map & List */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Map */}
                    <Card className="lg:col-span-2 overflow-hidden">
                        <div className="h-[600px] w-full">
                            {transactions.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <p className="mt-4 text-lg font-medium text-muted-foreground">
                                            Tidak ada data lokasi
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Transaksi dengan koordinat akan muncul di sini
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <MapContainer
                                    center={[mapCenter.lat, mapCenter.lng]}
                                    zoom={12}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <FitBounds transactions={transactions} />
                                    {transactions.map((transaction) => (
                                        <Marker
                                            key={transaction.id}
                                            position={[
                                                transaction.latitude,
                                                transaction.longitude,
                                            ]}
                                            icon={createMarkerIcon(transaction.status)}
                                            eventHandlers={{
                                                click: () =>
                                                    setSelectedTransaction(transaction),
                                            }}
                                        >
                                            <Popup>
                                                <div className="min-w-[200px] space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold">
                                                            {transaction.customer_name}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                statusColors[
                                                                    transaction.status
                                                                ]
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {
                                                                statusLabels[
                                                                    transaction.status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </div>
                                                    {transaction.customer_address && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {transaction.customer_address}
                                                        </p>
                                                    )}
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">
                                                            Sales:{' '}
                                                        </span>
                                                        {transaction.sales?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                        {formatCurrency(transaction.total)}
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/transactions/${transaction.id}`}
                                                            >
                                                                <Eye className="mr-1 h-3 w-3" />
                                                                Detail
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            asChild
                                                        >
                                                            <a
                                                                href={`https://www.google.com/maps?q=${transaction.latitude},${transaction.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="mr-1 h-3 w-3" />
                                                                GMaps
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            )}
                        </div>
                    </Card>

                    {/* Transaction List */}
                    <Card className="max-h-[600px] overflow-hidden">
                        <div className="border-b p-4">
                            <h3 className="font-semibold">Daftar Transaksi</h3>
                            <p className="text-sm text-muted-foreground">
                                {transactions.length} transaksi dengan lokasi
                            </p>
                        </div>
                        <div className="h-[520px] overflow-y-auto">
                            {transactions.length === 0 ? (
                                <div className="flex h-full items-center justify-center p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada transaksi
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
                                                selectedTransaction?.id ===
                                                transaction.id
                                                    ? 'bg-muted'
                                                    : ''
                                            }`}
                                            onClick={() =>
                                                setSelectedTransaction(transaction)
                                            }
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {transaction.customer_name}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                statusColors[
                                                                    transaction.status
                                                                ]
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {
                                                                statusLabels[
                                                                    transaction.status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {transaction.sales?.name ||
                                                            'N/A'}{' '}
                                                        •{' '}
                                                        {transaction.branch?.name ||
                                                            'N/A'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {transaction.created_at &&
                                                            format(
                                                                parseISO(
                                                                    transaction.created_at,
                                                                ),
                                                                'dd MMM yyyy, HH:mm',
                                                                { locale: idLocale },
                                                            )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {formatCurrency(
                                                            transaction.total,
                                                        )}
                                                    </p>
                                                    <Link
                                                        href={`/admin/transactions/${transaction.id}`}
                                                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        Detail
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Legend */}
                <Card className="p-4">
                    <h4 className="mb-3 text-sm font-semibold">Keterangan Marker</h4>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-amber-500" />
                            <span className="text-sm">Menunggu Persetujuan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-green-500" />
                            <span className="text-sm">Disetujui</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-red-500" />
                            <span className="text-sm">Dibatalkan</span>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
