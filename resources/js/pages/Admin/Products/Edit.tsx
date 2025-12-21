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

interface Product {
    id: number;
    name: string;
    code: string;
    barcode: string | null;
    product_category_id: number;
    description: string | null;
    price: string;
    cost: string | null;
    unit: string;
    items_per_carton: number;
    image: string | null;
    is_active: boolean;
}

interface Props {
    product: Product;
    categories: ProductCategory[];
}

// Form schema
const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(3, 'Code must be at least 3 characters'),
    barcode: z.string().optional(),
    product_category_id: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    price: z.string().min(1, 'Selling price is required'),
    cost: z.string().optional(),
    unit: z.string().default('pack'),
    items_per_carton: z.string().min(1, 'Items per carton is required'),
    is_active: z.boolean().default(true),
});

type EditProductForm = z.infer<typeof productSchema>;

export default function Edit({ product, categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(
        product.image ? `/storage/${product.image}` : null
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EditProductForm>({
        resolver: zodResolver(productSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            name: product.name,
            code: product.code,
            barcode: product.barcode || '',
            product_category_id: product.product_category_id.toString(),
            description: product.description || '',
            price: product.price,
            cost: product.cost || '',
            unit: product.unit,
            items_per_carton: product.items_per_carton.toString(),
            is_active: product.is_active,
        },
    });

    const isActive = useWatch({ control, name: 'is_active' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('File must be an image');
                return;
            }

            setImageFile(file);
            setRemoveImage(false);

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
        setRemoveImage(true);
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

            // Append image if exists or mark for removal
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (removeImage) {
                formData.append('remove_image', '1');
            }

            // Laravel uses POST with _method=PUT for file uploads
            formData.append('_method', 'PUT');

            router.post(`/admin/products/${product.id}`, formData, {
                preserveScroll: true,
            });
        })(e);
    };

    return (
        <AppLayout>
            <Head title="Edit Product" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Produk</h1>
                        <p className="text-muted-foreground">
                            Perbarui informasi produk
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
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="e.g. Mineral Water 600ml"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Product Code *</Label>
                                    <Input
                                        id="code"
                                        {...register('code')}
                                        placeholder="e.g. MW-600"
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
                                        placeholder="e.g. 8991001234567"
                                    />
                                    {errors.barcode && (
                                        <p className="text-sm text-destructive">{errors.barcode.message}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="product_category_id">Category *</Label>
                                    <Select
                                        onValueChange={(value) => setValue('product_category_id', value)}
                                        defaultValue={product.product_category_id.toString()}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
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
                                    <Label htmlFor="price">Selling Price (Rp) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('price')}
                                        placeholder="e.g. 5000"
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price.message}</p>
                                    )}
                                </div>

                                {/* Cost Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Cost Price (Rp)</Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('cost')}
                                        placeholder="e.g. 4000"
                                    />
                                    {errors.cost && (
                                        <p className="text-sm text-destructive">{errors.cost.message}</p>
                                    )}
                                </div>

                                {/* Unit */}
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Unit *</Label>
                                    <Select
                                        onValueChange={(value) => setValue('unit', value)}
                                        defaultValue={product.unit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pack">Pack</SelectItem>
                                            <SelectItem value="box">Box</SelectItem>
                                            <SelectItem value="carton">Carton</SelectItem>
                                            <SelectItem value="pcs">Pieces</SelectItem>
                                            <SelectItem value="bottle">Bottle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <p className="text-sm text-destructive">{errors.unit.message}</p>
                                    )}
                                </div>

                                {/* Items per Carton */}
                                <div className="space-y-2">
                                    <Label htmlFor="items_per_carton">Items per Carton *</Label>
                                    <Input
                                        id="items_per_carton"
                                        type="number"
                                        min="1"
                                        {...register('items_per_carton')}
                                        placeholder="e.g. 10"
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
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        {...register('description')}
                                        placeholder="Product description..."
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
                                    <Label htmlFor="image">Product Image</Label>
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
                                                    Click to upload product image
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG up to 2MB
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
                                        Active (product is available for sale)
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
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Product'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
