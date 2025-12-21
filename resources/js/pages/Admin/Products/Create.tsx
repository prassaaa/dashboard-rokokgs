import { FormEventHandler, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface ProductCategory {
    id: number;
    name: string;
}

interface Props {
    categories: ProductCategory[];
}

// Form schema
const productSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    code: z.string().min(3, 'Kode minimal 3 karakter'),
    barcode: z.string().optional(),
    product_category_id: z.string().min(1, 'Kategori wajib dipilih'),
    description: z.string().optional(),
    price: z.string().min(1, 'Harga jual wajib diisi'),
    cost: z.string().optional(),
    unit: z.string().default('pack'),
    items_per_carton: z.string().min(1, 'Item per karton wajib diisi'),
    is_active: z.boolean().default(true),
});

type CreateProductForm = z.infer<typeof productSchema>;

export default function Create({ categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<CreateProductForm>({
        resolver: zodResolver(productSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            name: '',
            code: '',
            barcode: '',
            product_category_id: '',
            description: '',
            price: '',
            cost: '',
            unit: 'pack',
            items_per_carton: '10',
            is_active: true,
        },
    });

    const isActive = useWatch({ control, name: 'is_active' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran gambar maksimal 2MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('File harus berupa gambar');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        handleSubmit((data) => {
            const formData = new FormData();

            // Append form fields
            formData.append('name', data.name);
            formData.append('code', data.code);
            if (data.barcode) formData.append('barcode', data.barcode);
            formData.append('product_category_id', data.product_category_id);
            if (data.description) formData.append('description', data.description);
            formData.append('price', data.price);
            if (data.cost) formData.append('cost', data.cost);
            formData.append('unit', data.unit);
            formData.append('items_per_carton', data.items_per_carton);
            formData.append('is_active', data.is_active ? '1' : '0');

            // Append image if exists
            if (imageFile) {
                formData.append('image', imageFile);
            }

            router.post('/admin/products', formData, {
                preserveScroll: true,
            });
        })(e);
    };

    return (
        <AppLayout>
            <Head title="Create Product" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Tambah Produk Baru</h1>
                        <p className="text-muted-foreground">
                            Tambahkan produk baru ke sistem
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/products">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Product Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Produk
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Product Name */}
                                    <div className="space-y-2">
                                    <Label htmlFor="name">Nama Produk *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Contoh: Air Mineral 600ml"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Produk *</Label>
                                    <Input
                                        id="code"
                                        {...register('code')}
                                        placeholder="Contoh: MW-600"
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code.message}</p>
                                    )}
                                </div>

                                {/* Barcode */}
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        {...register('barcode')}
                                        placeholder="Contoh: 8991001234567"
                                    />
                                    {errors.barcode && (
                                        <p className="text-sm text-destructive">{errors.barcode.message}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="product_category_id">Kategori *</Label>
                                    <Select
                                        onValueChange={(value) => setValue('product_category_id', value)}
                                        defaultValue=""
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.product_category_id && (
                                        <p className="text-sm text-destructive">
                                            {errors.product_category_id.message}
                                        </p>
                                    )}
                                </div>

                                {/* Selling Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="price">Harga Jual (Rp) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('price')}
                                        placeholder="Contoh: 5000"
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price.message}</p>
                                    )}
                                </div>

                                {/* Cost Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Harga Beli (Rp)</Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('cost')}
                                        placeholder="Contoh: 4000"
                                    />
                                    {errors.cost && (
                                        <p className="text-sm text-destructive">{errors.cost.message}</p>
                                    )}
                                </div>

                                {/* Unit */}
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Satuan *</Label>
                                    <Select
                                        onValueChange={(value) => setValue('unit', value)}
                                        defaultValue="pack"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih satuan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pack">Pak</SelectItem>
                                            <SelectItem value="box">Kotak</SelectItem>
                                            <SelectItem value="carton">Karton</SelectItem>
                                            <SelectItem value="pcs">Pcs</SelectItem>
                                            <SelectItem value="bottle">Botol</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <p className="text-sm text-destructive">{errors.unit.message}</p>
                                    )}
                                </div>

                                {/* Items per Carton */}
                                <div className="space-y-2">
                                    <Label htmlFor="items_per_carton">Item per Karton *</Label>
                                    <Input
                                        id="items_per_carton"
                                        type="number"
                                        min="1"
                                        {...register('items_per_carton')}
                                        placeholder="Contoh: 10"
                                    />
                                    {errors.items_per_carton && (
                                        <p className="text-sm text-destructive">
                                            {errors.items_per_carton.message}
                                        </p>
                                    )}
                                </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Tambahan
                                </h2>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea
                                        id="description"
                                        {...register('description')}
                                        placeholder="Deskripsi produk..."
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Product Media */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Media Produk
                                </h2>

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="image">Gambar Produk</Label>
                                    <div className="space-y-4">
                                        {imagePreview ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-48 h-48 object-cover rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2"
                                                    onClick={handleRemoveImage}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Klik untuk upload gambar produk
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG maksimal 2MB
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Status
                                </h2>

                                {/* Is Active */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={isActive}
                                        onCheckedChange={(checked) => setValue('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        Aktif (produk tersedia untuk dijual)
                                    </Label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/admin/products')}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
