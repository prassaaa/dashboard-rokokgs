import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, CheckCircle, ExternalLink, MapPin, XCircle } from 'lucide-react';
import { useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

interface Product {
    id: number;
    name: string;
    code: string;
}

interface TransactionItem {
    id: number;
    product: Product;
    quantity: number;
    price: number;
    subtotal: number;
}

interface Sales {
    id: number;
    name: string;
    email: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    customer_name: string;
    customer_phone: string | null;
    customer_address: string | null;
    total: number;
    discount: number;
    notes: string | null;
    status: 'pending' | 'approved' | 'cancelled';
    sales: Sales;
    branch: Branch;
    items: TransactionItem[];
    created_at: string;
    latitude: string | null;
    longitude: string | null;
}

interface ShowProps {
    transaction: Transaction;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Transaksi', href: '/admin/transactions' },
    { title: 'Detail Transaksi', href: '#' },
];

const statusColors: Record<string, string> = {
    pending: 'warning',
    approved: 'default',
    cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    cancelled: 'Dibatalkan',
};

// Custom marker icon for Leaflet
const markerIcon = icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function Show({ transaction }: ShowProps) {
    const [approveDialog, setApproveDialog] = useState(false);
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        reason: string;
    }>({ open: false, reason: '' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleApprove = () => {
        router.post(
            `/admin/transactions/${transaction.id}/approve`,
            {},
            {
                onSuccess: () => {
                    setApproveDialog(false);
                    toast.success('Transaksi berhasil disetujui');
                },
                onError: () => toast.error('Gagal menyetujui transaksi'),
            },
        );
    };

    const handleReject = () => {
        if (!rejectDialog.reason) return;

        router.post(
            `/admin/transactions/${transaction.id}/reject`,
            { rejection_reason: rejectDialog.reason },
            {
                onSuccess: () => {
                    setRejectDialog({ open: false, reason: '' });
                    toast.success('Transaksi berhasil ditolak');
                },
                onError: () => toast.error('Gagal menolak transaksi'),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Transaksi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" size="sm" className="mb-4" asChild>
                            <Link href="/admin/transactions">
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">Detail Transaksi</h1>
                        <p className="text-muted-foreground">
                            Informasi lengkap transaksi penjualan
                        </p>
                    </div>
                    {transaction.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setApproveDialog(true)}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui Transaksi
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    setRejectDialog({ open: true, reason: '' })
                                }
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak Transaksi
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Transaction Info */}
                    <Card className="lg:col-span-2">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Informasi Transaksi
                                </h3>
                                <Badge
                                    variant={
                                        statusColors[transaction.status] as 'default' | 'warning' | 'destructive'
                                    }
                                >
                                    {statusLabels[transaction.status]}
                                </Badge>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Customer
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {transaction.customer_name}
                                    </p>
                                </div>
                                {transaction.customer_phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            No. Telepon
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {transaction.customer_phone}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Sales
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {transaction.sales.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {transaction.sales.email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Cabang
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {transaction.branch.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tanggal Transaksi
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {format(
                                            parseISO(transaction.created_at),
                                            'dd MMMM yyyy, HH:mm',
                                            { locale: idLocale },
                                        )}
                                    </p>
                                </div>
                            </div>

                            {transaction.customer_address && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Alamat Customer
                                    </p>
                                    <p className="mt-1">
                                        {transaction.customer_address}
                                    </p>
                                </div>
                            )}

                            {transaction.latitude && transaction.longitude && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Lokasi Transaksi
                                    </p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {transaction.latitude}, {transaction.longitude}
                                        </span>
                                        <a
                                            href={`https://www.google.com/maps?q=${transaction.latitude},${transaction.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Google Maps
                                        </a>
                                    </div>
                                    <div className="h-[250px] w-full rounded-lg overflow-hidden border">
                                        <MapContainer
                                            center={[parseFloat(transaction.latitude), parseFloat(transaction.longitude)]}
                                            zoom={15}
                                            scrollWheelZoom={false}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker
                                                position={[parseFloat(transaction.latitude), parseFloat(transaction.longitude)]}
                                                icon={markerIcon}
                                            >
                                                <Popup>
                                                    <div className="text-sm">
                                                        <p className="font-semibold">{transaction.customer_name}</p>
                                                        <p className="text-muted-foreground">{transaction.customer_address}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                </div>
                            )}

                            {transaction.notes && (
                                <div className="mt-4 rounded-lg bg-muted p-4">
                                    <p className="text-sm font-medium">
                                        Catatan:
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {transaction.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold">
                                Ringkasan
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(
                                            transaction.total +
                                                transaction.discount,
                                        )}
                                    </span>
                                </div>
                                {transaction.discount > 0 && (
                                    <div className="flex justify-between text-destructive">
                                        <span>Diskon</span>
                                        <span>
                                            -{' '}
                                            {formatCurrency(
                                                transaction.discount,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold">
                                            Total
                                        </span>
                                        <span className="text-lg font-bold">
                                            {formatCurrency(transaction.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Items */}
                <Card>
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Item Transaksi
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-3 text-left text-sm font-semibold">
                                            Produk
                                        </th>
                                        <th className="pb-3 text-center text-sm font-semibold">
                                            Jumlah
                                        </th>
                                        <th className="pb-3 text-right text-sm font-semibold">
                                            Harga
                                        </th>
                                        <th className="pb-3 text-right text-sm font-semibold">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transaction.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product.name}
                                                    </p>
                                                    <code className="text-xs text-muted-foreground">
                                                        {item.product.code}
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                {item.quantity}
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {formatCurrency(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
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
                            onClick={() => setApproveDialog(false)}
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
                            <Label htmlFor="reason">Alasan Penolakan *</Label>
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
                                setRejectDialog({ open: false, reason: '' })
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
