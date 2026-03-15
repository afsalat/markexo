'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, Shop, Category } from '@/types/admin';
import { ArrowLeft, Upload, CheckCircle, X, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ProductFormProps {
    productId?: number;
    onBack: () => void;
    onSuccess: () => void;
    apiBasePath?: string;
    shopsEndpoint?: string;
    categoriesEndpoint?: string;
}

export default function ProductForm({
    productId,
    onBack,
    onSuccess,
    apiBasePath = `${API_BASE_URL}/admin/products`,
    shopsEndpoint = `${API_BASE_URL}/admin/shops/`,
    categoriesEndpoint = `${API_BASE_URL}/admin/categories/`,
}: ProductFormProps) {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState<Shop[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [existingImages, setExistingImages] = useState<{ id: number; image: string }[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mrp: '',
        supplier_price: '',
        our_price: '',
        stock: '',
        sku: '',
        is_featured: false,
        shop_id: '',
        category_id: '',
        meesho_url: '',
        image: null as File | null,
        gallery_images: [] as File[],
        specifications: [] as { key: string, value: string }[]
    });

    const flattenCategories = (items: Category[]): Category[] => {
        const flattened: Category[] = [];

        const visit = (category: Category) => {
            flattened.push(category);
            const children = Array.isArray((category as Category & { children?: Category[] }).children)
                ? (category as Category & { children?: Category[] }).children!
                : [];
            children.forEach(visit);
        };

        items.forEach(visit);
        return flattened;
    };

    // Load product data if editing
    useEffect(() => {
        const loadData = async () => {
            console.log('Loading ProductForm data...', { productId, token: token ? 'exists' : 'missing' });

            try {
                // Load shops and categories
                const headers = { 'Authorization': `Bearer ${token}` };
                const [shopsRes, categoriesRes] = await Promise.all([
                    fetch(shopsEndpoint, { headers }),
                    fetch(categoriesEndpoint, { headers })
                ]);

                if (shopsRes.ok) {
                    const shopsData = await shopsRes.json();
                    console.log('Shops loaded:', shopsData);
                    // Handle both array and paginated response
                    if (Array.isArray(shopsData)) {
                        setShops(shopsData);
                    } else if (shopsData.results) {
                        setShops(shopsData.results);
                    } else {
                        console.error('Unexpected shops response format:', shopsData);
                        setShops([]);
                    }
                } else {
                    console.error('Failed to load shops:', shopsRes.status);
                }

                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    console.log('Categories loaded:', categoriesData);
                    // Handle both array and paginated response
                    if (Array.isArray(categoriesData)) {
                        setCategories(flattenCategories(categoriesData));
                    } else if (categoriesData.results) {
                        setCategories(flattenCategories(categoriesData.results));
                    } else {
                        console.error('Unexpected categories response format:', categoriesData);
                        setCategories([]);
                    }
                } else {
                    console.error('Failed to load categories:', categoriesRes.status);
                }

                // Load product if editing
                if (productId) {
                    console.log('Fetching product:', productId);
                    const productRes = await fetch(`${apiBasePath}/${productId}/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    console.log('Product fetch response:', productRes.status);

                    if (productRes.ok) {
                        const product: Product = await productRes.json();
                        console.log('Product data received:', product);

                        const hasMrp = product.mrp && parseFloat(product.mrp.toString()) > 0;
                        const hasSupplierPrice = product.supplier_price && parseFloat(product.supplier_price.toString()) > 0;
                        const hasOurPrice = product.our_price && parseFloat(product.our_price.toString()) > 0;

                        // Save current image URLs
                        if (product.image) {
                            setCurrentImageUrl(product.image);
                        }
                        if (product.images && product.images.length > 0) {
                            setExistingImages(product.images);
                        }

                        const newFormData = {
                            name: product.name || '',
                            description: product.description || '',
                            mrp: hasMrp ? product.mrp!.toString() : (product.price?.toString() || ''),
                            supplier_price: hasSupplierPrice ? product.supplier_price!.toString() : '',
                            our_price: hasOurPrice ? product.our_price!.toString() : (product.current_price?.toString() || product.price?.toString() || ''),
                            stock: product.stock?.toString() || '0',
                            sku: product.sku || '',
                            is_featured: product.is_featured || false,
                            shop_id: product.shop?.id ? product.shop.id.toString() : (product.shop_id ? product.shop_id.toString() : ''),
                            category_id: product.category?.id ? product.category.id.toString() : (product.category_id ? product.category_id.toString() : ''),
                            meesho_url: (product as any).meesho_url || '',
                            image: null as File | null,
                            gallery_images: [] as File[],
                            specifications: (product as any).specifications
                                ? Object.entries((product as any).specifications).map(([key, value]) => ({ key, value: String(value) }))
                                : []
                        };

                        console.log('Setting form data:', newFormData);
                        setFormData(newFormData);
                    } else {
                        console.error('Failed to fetch product:', productRes.status);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, [apiBasePath, categoriesEndpoint, productId, shopsEndpoint, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormData(prev => ({
                ...prev,
                gallery_images: [...prev.gallery_images, ...filesArray]
            }));
        }
    };

    const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
        const newSpecs = [...formData.specifications];
        newSpecs[index][field] = value;
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const addSpec = () => {
        setFormData(prev => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
    };

    const removeSpec = (index: number) => {
        const newSpecs = formData.specifications.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();

        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('mrp', formData.mrp);
        data.append('supplier_price', formData.supplier_price);
        data.append('our_price', formData.our_price);
        data.append('stock', formData.stock);
        data.append('sku', formData.sku);
        data.append('is_featured', formData.is_featured.toString());
        data.append('shop_id', formData.shop_id);

        if (deletedImageIds.length > 0) {
            data.append('deleted_images', JSON.stringify(deletedImageIds));
        }

        if (formData.category_id) {
            data.append('category_id', formData.category_id);
        }

        if (formData.meesho_url) {
            data.append('meesho_url', formData.meesho_url);
        }

        if (formData.image) {
            data.append('image', formData.image);
        }

        if (formData.specifications.length > 0) {
            const specsObj = formData.specifications.reduce((acc, curr) => {
                if (curr.key.trim() && curr.value.trim()) {
                    acc[curr.key.trim()] = curr.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);
            data.append('specifications', JSON.stringify(specsObj));
        } else {
            data.append('specifications', JSON.stringify({}));
        }

        formData.gallery_images.forEach((file, index) => {
            data.append('uploaded_images', file);
        });

        try {
            const url = productId
                ? `${apiBasePath}/${productId}/`
                : `${apiBasePath}/`;

            const method = productId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (response.ok) {
                alert(productId ? 'Product updated successfully!' : 'Product created successfully!');
                onSuccess();
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to save product:', errorData);
                alert(`Failed to save product: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-display text-2xl font-bold text-white">
                        {productId ? 'Edit Product' : 'Add New Product'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-dark-800 rounded-2xl p-8 shadow-sm border border-dark-700">
                <div className="space-y-6">
                    {/* Shop and Category */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Select Shop</label>
                            <select
                                name="shop_id"
                                required
                                value={formData.shop_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700"
                            >
                                <option value="">Choose a shop...</option>
                                {shops.map(shop => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Category</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700"
                            >
                                <option value="">Select category...</option>
                                {categories.filter(c => !c.parent).map(parent => (
                                    <optgroup key={parent.id} label={parent.name}>
                                        <option value={parent.id}>{parent.name} (Direct)</option>
                                        {categories.filter(c => c.parent === parent.id).map(child => (
                                            <option key={child.id} value={child.id}>&nbsp;&nbsp;&nbsp;{child.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Product Name */}
                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                            placeholder="Enter product name"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Description</label>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                            placeholder="Product description..."
                        />
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">MRP (₹)</label>
                            <input
                                type="number"
                                name="mrp"
                                required
                                min="0"
                                step="0.01"
                                value={formData.mrp}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                placeholder="Maximum Retail Price"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Supplier Price (₹)</label>
                            <input
                                type="number"
                                name="supplier_price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.supplier_price}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                placeholder="From Meesho/Supplier"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Our Price (₹)</label>
                            <input
                                type="number"
                                name="our_price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.our_price}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                placeholder="Customer Pays"
                            />
                        </div>
                    </div>

                    {/* Stock and SKU */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Stock</label>
                            <input
                                type="number"
                                name="stock"
                                required
                                min="0"
                                value={formData.stock}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">SKU (Optional)</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                placeholder="Stock Keeping Unit"
                            />
                        </div>
                    </div>

                    {/* Meesho URL */}
                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Meesho URL (Optional)</label>
                        <input
                            type="url"
                            name="meesho_url"
                            value={formData.meesho_url}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                            placeholder="https://meesho.com/product/..."
                        />
                    </div>

                    {/* Main Image */}
                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Product Image</label>
                        <div
                            className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center cursor-pointer hover:bg-dark-700 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {formData.image ? (
                                <div className="flex items-center justify-center gap-2 text-green-500">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">{formData.image.name}</span>
                                </div>
                            ) : currentImageUrl ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img
                                        src={currentImageUrl}
                                        alt="Current product image"
                                        className="w-24 h-24 object-cover rounded-lg border border-dark-600"
                                    />
                                    <span className="text-sm text-silver-500">Click to change image</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-silver-500">
                                    <Upload size={24} />
                                    <span className="text-sm">Click to upload image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Gallery Images (Multiple)</label>

                        {/* Show existing images */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-silver-500 mb-2">Current gallery images:</p>
                                <div className="flex flex-wrap gap-2">
                                    {existingImages.map((img) => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={img.image}
                                                alt="Gallery"
                                                className="w-16 h-16 object-cover rounded-lg border border-dark-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeletedImageIds(prev => [...prev, img.id]);
                                                    setExistingImages(prev => prev.filter(i => i.id !== img.id));
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:bg-dark-700 transition-colors cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                id="gallery-upload"
                                accept="image/*"
                                onChange={handleGalleryChange}
                            />
                            <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center gap-2 text-silver-500">
                                {formData.gallery_images.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {formData.gallery_images.map((file, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm border border-green-500/20">
                                                <CheckCircle size={16} />
                                                <span>{file.name}</span>
                                            </div>
                                        ))}
                                        <div className="w-full mt-2 text-xs text-silver-500">
                                            Click to add more images
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span className="text-sm">Click to upload gallery images</span>
                                        <span className="text-xs text-silver-400">You can select multiple images</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-silver-300">Specifications (Key-Value Pairs)</label>
                            <button
                                type="button"
                                onClick={addSpec}
                                className="text-xs flex items-center gap-1 bg-dark-700 hover:bg-dark-600 text-silver-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                <Plus size={14} /> Add Spec
                            </button>
                        </div>
                        {formData.specifications.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-dark-600 rounded-lg text-silver-500 text-sm">
                                No specifications added yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.specifications.map((spec, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <input
                                            type="text"
                                            value={spec.key}
                                            onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                            placeholder="e.g. Brand"
                                            className="flex-1 px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                        />
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                            placeholder="e.g. Vorion"
                                            className="flex-1 px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSpec(index)}
                                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 flex-shrink-0"
                                            title="Remove Specification"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Featured Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_featured"
                            id="is_featured"
                            checked={formData.is_featured}
                            onChange={handleChange}
                            className="w-4 h-4 text-accent-600 border-dark-600 rounded focus:ring-accent-500 bg-dark-700"
                        />
                        <label htmlFor="is_featured" className="text-sm font-medium text-silver-300">
                            Mark as Featured Product
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-2 border border-dark-600 text-silver-400 rounded-lg hover:bg-dark-700 hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 font-medium transition-colors disabled:opacity-50 shadow-lg shadow-accent-500/20"
                        >
                            {loading ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
