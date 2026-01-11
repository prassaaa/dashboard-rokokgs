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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, CheckCircle, ExternalLink, MapPin, XCircle, User, Building2, Calendar, Target } from 'lucide-react';
import { useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

interface Sales {
    id: number;
    name: string;
    email: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
}

interface Approver {
    id: number;
    name: string;
}

interface Visit {
    id: number;
    visit_number: string;
    customer_name: string;
    customer_phone: string | null;
    customer_address: string | null;
    visit_type: string;
    purpose: string | null;
    result: string | null;
    notes: string | null;
    status: 'pending' | 'approved' | 'rejected';
    sales: Sales | null;
    branch: Branch | null;
    area: Area | null;
    approver: Approver | null;
    visit_date: string;
    created_at: string;
    approved_at: string | null;
    latitude: string | null;
    longitude: string | null;
    photo: string | null;
}

interface ShowProps {
    visit: Visit;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Kunjungan', href: '/admin/visits' },
    { title: 'Detail Kunjungan', href: '#' },
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

const visitTypeLabels: Record<string, string> = {
    routine: 'Rutin',
    prospecting: 'Prospecting',
    follow_up: 'Follow Up',
    complaint: 'Komplain',
    other: 'Lainnya',
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

export default function Show({ visit }: ShowProps) {
    const [approveDialog, setApproveDialog] = useState(false);
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        reason: string;
    }>({ open: false, reason: '' });

    const handleApprove = () => {
        router.post(
            `/admin/visits/${visit.id}/approve`,
            {},
            {
                onSuccess: () => {
                    setApproveDialog(false);
                    toast.success('Kunjungan berhasil disetujui');
                },
                onError: () => toast.error('Gagal menyetujui kunjungan'),
            },
        );
    };

    const handleReject = () => {
        if (!rejectDialog.reason) return;

        router.post(
            `/admin/visits/${visit.id}/reject`,
            { rejection_reason: rejectDialog.reason },
            {
                onSuccess: () => {
                    setRejectDialog({ open: false, reason: '' });
                    toast.success('Kunjungan berhasil ditolak');
                },
                onError: () => toast.error('Gagal menolak kunjungan'),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Kunjungan" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" size="sm" className="mb-4" asChild>
                            <Link href="/admin/visits">
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">Detail Kunjungan</h1>
                            <Badge
                                variant={
                                    statusColors[visit.status] as 'default' | 'warning' | 'destructive'
                                }
                            >
                                {statusLabels[visit.status]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground font-mono">
                            {visit.visit_number}
                        </p>
                    </div>
                    {visit.status === 'pending' && (
                        <Can permission="approve-sales-transactions">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setApproveDialog(true)}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Setujui Kunjungan
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        setRejectDialog({ open: true, reason: '' })
                                    }
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Tolak Kunjungan
                                </Button>
                            </div>
                        </Can>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Visit Info */}
                    <Card className="lg:col-span-2">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold">
                                Informasi Kunjungan
                            </h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <User className="mt-1 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Customer
                                        </p>
                                        <p className="font-medium">
                                            {visit.customer_name}
                                        </p>
                                        {visit.customer_phone && (
                                            <p className="text-sm text-muted-foreground">
                                                {visit.customer_phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="mt-1 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Sales
                                        </p>
                                        <p className="font-medium">
                                            {visit.sales?.name ?? 'N/A'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {visit.sales?.email ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-1 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Cabang
                                        </p>
                                        <p className="font-medium">
                                            {visit.branch?.name ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Target className="mt-1 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Area
                                        </p>
                                        <p className="font-medium">
                                            {visit.area?.name ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Tanggal Kunjungan
                                        </p>
                                        <p className="font-medium">
                                            {format(
                                                parseISO(visit.created_at),
                                                'dd MMMM yyyy, HH:mm',
                                                { locale: idLocale },
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tipe Kunjungan
                                    </p>
                                    <Badge variant="outline" className="mt-1">
                                        {visitTypeLabels[visit.visit_type] || visit.visit_type}
                                    </Badge>
                                </div>
                            </div>

                            {visit.customer_address && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Alamat Customer
                                    </p>
                                    <p className="mt-1">
                                        {visit.customer_address}
                                    </p>
                                </div>
                            )}

                            {visit.latitude && visit.longitude && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Lokasi Kunjungan
                                    </p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {visit.latitude}, {visit.longitude}
                                        </span>
                                        <a
                                            href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
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
                                            center={[parseFloat(visit.latitude), parseFloat(visit.longitude)]}
                                            zoom={15}
                                            scrollWheelZoom={false}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker
                                                position={[parseFloat(visit.latitude), parseFloat(visit.longitude)]}
                                                icon={markerIcon}
                                            >
                                                <Popup>
                                                    <div className="text-sm">
                                                        <p className="font-semibold">{visit.customer_name}</p>
                                                        <p className="text-muted-foreground">{visit.customer_address}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                </div>
                            )}

                            {visit.photo && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Foto Kunjungan
                                    </p>
                                    <a
                                        href={visit.photo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block"
                                    >
                                        <img
                                            src={visit.photo}
                                            alt="Bukti Kunjungan"
                                            className="h-auto w-64 rounded-lg border object-cover shadow-sm hover:shadow-md transition-shadow"
                                        />
                                    </a>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Klik gambar untuk melihat ukuran penuh
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Purpose & Result */}
                    <div className="space-y-6">
                        <Card>
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold">
                                    Tujuan Kunjungan
                                </h3>
                                <p className="text-muted-foreground">
                                    {visit.purpose || 'Tidak ada tujuan yang dicatat'}
                                </p>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold">
                                    Hasil Kunjungan
                                </h3>
                                <p className="text-muted-foreground">
                                    {visit.result || 'Tidak ada hasil yang dicatat'}
                                </p>
                            </div>
                        </Card>

                        {visit.notes && (
                            <Card>
                                <div className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold">
                                        Catatan
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {visit.notes}
                                    </p>
                                </div>
                            </Card>
                        )}

                        {visit.status === 'approved' && visit.approver && (
                            <Card>
                                <div className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold">
                                        Informasi Approval
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Disetujui oleh:</span>
                                            <span className="font-medium">{visit.approver.name}</span>
                                        </div>
                                        {visit.approved_at && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tanggal:</span>
                                                <span className="font-medium">
                                                    {format(
                                                        parseISO(visit.approved_at),
                                                        'dd MMM yyyy, HH:mm',
                                                        { locale: idLocale },
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
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
                            onClick={() => setApproveDialog(false)}
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
                            <Label htmlFor="reason">Alasan Penolakan *</Label>
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
                            Tolak Kunjungan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
