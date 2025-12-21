import { FormEventHandler, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface ProductCategory {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    product_category_id: number;
    description: string | null;
    price: string;
    commission_percentage: string;
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
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    product_category_id: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    price: z.string().min(1, 'Price is required'),
    commission_percentage: z.string().min(0).max(100),
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
            sku: product.sku,
            product_category_id: product.product_category_id.toString(),
            description: product.description || '',
            price: product.price,
            commission_percentage: product.commission_percentage,
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
            formData.append('sku', data.sku);
            formData.append('product_category_id', data.product_category_id);
            if (data.description) formData.append('description', data.description);
            formData.append('price', data.price);
            formData.append('commission_percentage', data.commission_percentage);
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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/admin/products')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                            <p className="text-muted-foreground">Update product information</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                {/* SKU */}
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        {...register('sku')}
                                        placeholder="e.g. MW-600"
                                    />
                                    {errors.sku && (
                                        <p className="text-sm text-destructive">{errors.sku.message}</p>
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

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (Rp) *</Label>
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

                                {/* Commission Percentage */}
                                <div className="space-y-2">
                                    <Label htmlFor="commission_percentage">Commission (%)</Label>
                                    <Input
                                        id="commission_percentage"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        {...register('commission_percentage')}
                                        placeholder="e.g. 10"
                                    />
                                    {errors.commission_percentage && (
                                        <p className="text-sm text-destructive">
                                            {errors.commission_percentage.message}
                                        </p>
                                    )}
                                </div>
                            </div>

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
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
