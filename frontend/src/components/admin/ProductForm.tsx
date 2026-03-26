'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Category, Product, Shop } from '@/types/admin';
import { ArrowLeft, CheckCircle, ChevronDown, Plus, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ProductFormProps {
    productId?: number;
    onBack: () => void;
    onSuccess: () => void;
    apiBasePath?: string;
    shopsEndpoint?: string;
    categoriesEndpoint?: string;
    shopsCreateEndpoint?: string;
    categoriesCreateEndpoint?: string;
}

type QuickAddPanel = 'shop' | 'category' | null;
type SearchDropdown = 'shop' | 'category' | null;

const emptyShopForm = {
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    description: '',
};

const emptyCategoryForm = {
    name: '',
    description: '',
    parent: '',
};

export default function ProductForm({
    productId,
    onBack,
    onSuccess,
    apiBasePath = `${API_BASE_URL}/admin/products`,
    shopsEndpoint = `${API_BASE_URL}/admin/shops/`,
    categoriesEndpoint = `${API_BASE_URL}/admin/categories/`,
    shopsCreateEndpoint = `${API_BASE_URL}/admin/shops/`,
    categoriesCreateEndpoint = `${API_BASE_URL}/admin/categories/`,
}: ProductFormProps) {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const shopSearchRef = useRef<HTMLDivElement>(null);
    const categorySearchRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState<Shop[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [existingImages, setExistingImages] = useState<{ id: number; image: string }[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
    const [quickAddPanel, setQuickAddPanel] = useState<QuickAddPanel>(null);
    const [shopForm, setShopForm] = useState(emptyShopForm);
    const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
    const [shopLoading, setShopLoading] = useState(false);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [shopError, setShopError] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [shopSearch, setShopSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [openDropdown, setOpenDropdown] = useState<SearchDropdown>(null);

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
        specifications: [] as { key: string; value: string }[],
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

    const extractList = <T,>(payload: unknown): T[] => {
        if (Array.isArray(payload)) {
            return payload as T[];
        }

        if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: T[] }).results)) {
            return (payload as { results: T[] }).results;
        }

        return [];
    };

    const loadOptions = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [shopsRes, categoriesRes] = await Promise.all([
                fetch(shopsEndpoint, { headers }),
                fetch(categoriesEndpoint, { headers }),
            ]);

            if (shopsRes.ok) {
                const shopsData = await shopsRes.json();
                setShops(extractList<Shop>(shopsData));
            } else {
                setShops([]);
            }

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(flattenCategories(extractList<Category>(categoriesData)));
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error loading form options:', error);
            setShops([]);
            setCategories([]);
        }
    }, [categoriesEndpoint, shopsEndpoint, token]);

    useEffect(() => {
        const loadData = async () => {
            await loadOptions();

            if (!productId || !token) {
                return;
            }

            try {
                const productRes = await fetch(`${apiBasePath}/${productId}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!productRes.ok) {
                    console.error('Failed to fetch product:', productRes.status);
                    return;
                }

                const product: Product = await productRes.json();
                const hasMrp = product.mrp && parseFloat(product.mrp.toString()) > 0;
                const hasSupplierPrice = product.supplier_price && parseFloat(product.supplier_price.toString()) > 0;
                const hasOurPrice = product.our_price && parseFloat(product.our_price.toString()) > 0;

                if (product.image) {
                    setCurrentImageUrl(product.image);
                }

                if (product.images && product.images.length > 0) {
                    setExistingImages(product.images);
                }

                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    mrp: hasMrp ? product.mrp!.toString() : product.price?.toString() || '',
                    supplier_price: hasSupplierPrice ? product.supplier_price!.toString() : '',
                    our_price: hasOurPrice ? product.our_price!.toString() : product.current_price?.toString() || product.price?.toString() || '',
                    stock: product.stock?.toString() || '0',
                    sku: product.sku || '',
                    is_featured: product.is_featured || false,
                    shop_id: product.shop?.id ? product.shop.id.toString() : product.shop_id ? product.shop_id.toString() : '',
                    category_id: product.category?.id ? product.category.id.toString() : product.category_id ? product.category_id.toString() : '',
                    meesho_url: product.meesho_url || '',
                    image: null,
                    gallery_images: [],
                    specifications: (product as Product & { specifications?: Record<string, unknown> }).specifications
                        ? Object.entries((product as Product & { specifications?: Record<string, unknown> }).specifications || {}).map(([key, value]) => ({
                            key,
                            value: String(value),
                        }))
                        : [],
                });
            } catch (error) {
                console.error('Error loading product:', error);
            }
        };

        loadData();
    }, [apiBasePath, loadOptions, productId, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormData((prev) => ({
                ...prev,
                gallery_images: [...prev.gallery_images, ...filesArray],
            }));
        }
    };

    const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
        const newSpecs = [...formData.specifications];
        newSpecs[index][field] = value;
        setFormData((prev) => ({ ...prev, specifications: newSpecs }));
    };

    const addSpec = () => {
        setFormData((prev) => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
    };

    const removeSpec = (index: number) => {
        const newSpecs = formData.specifications.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, specifications: newSpecs }));
    };

    const resetQuickAdd = (panel?: QuickAddPanel) => {
        if (!panel || panel === 'shop') {
            setShopForm(emptyShopForm);
            setShopError('');
        }

        if (!panel || panel === 'category') {
            setCategoryForm(emptyCategoryForm);
            setCategoryError('');
        }
    };

    const toggleQuickAddPanel = (panel: Exclude<QuickAddPanel, null>) => {
        setQuickAddPanel((current) => {
            const next = current === panel ? null : panel;
            if (current !== next) {
                resetQuickAdd(panel);
            }
            return next;
        });
    };

    const handleCreateShop = async () => {
        setShopLoading(true);
        setShopError('');

        try {
            const response = await fetch(shopsCreateEndpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(shopForm),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setShopError(typeof payload === 'string' ? payload : JSON.stringify(payload));
                return;
            }

            await loadOptions();
            setFormData((prev) => ({ ...prev, shop_id: payload.id ? String(payload.id) : prev.shop_id }));
            resetQuickAdd('shop');
            setQuickAddPanel(null);
        } catch (error) {
            console.error('Error creating shop:', error);
            setShopError(error instanceof Error ? error.message : 'Failed to create shop.');
        } finally {
            setShopLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        setCategoryLoading(true);
        setCategoryError('');

        try {
            const response = await fetch(categoriesCreateEndpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: categoryForm.name,
                    description: categoryForm.description,
                    parent: categoryForm.parent ? Number(categoryForm.parent) : null,
                }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setCategoryError(typeof payload === 'string' ? payload : JSON.stringify(payload));
                return;
            }

            await loadOptions();
            setFormData((prev) => ({ ...prev, category_id: payload.id ? String(payload.id) : prev.category_id }));
            resetQuickAdd('category');
            setQuickAddPanel(null);
        } catch (error) {
            console.error('Error creating category:', error);
            setCategoryError(error instanceof Error ? error.message : 'Failed to create category.');
        } finally {
            setCategoryLoading(false);
        }
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

        if (deletedImageIds.length > 0) {
            data.append('deleted_images', JSON.stringify(deletedImageIds));
        }

        if (formData.shop_id) {
            data.append('shop_id', formData.shop_id);
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

        formData.gallery_images.forEach((file) => {
            data.append('uploaded_images', file);
        });

        try {
            const url = productId ? `${apiBasePath}/${productId}/` : `${apiBasePath}/`;
            const method = productId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
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

    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const getCategoryDepth = (category: Category) => {
        let depth = 0;
        let parentId = category.parent ?? null;

        while (parentId) {
            depth += 1;
            parentId = categoryMap.get(parentId)?.parent ?? null;
        }

        return depth;
    };

    const renderCategoryLabel = (category: Category) => `${'-- '.repeat(getCategoryDepth(category))}${category.name}`;
    const shopOptions = shops.map((shop) => ({
        id: String(shop.id),
        label: shop.city ? `${shop.name} - ${shop.city}` : shop.name,
    }));
    const categoryOptions = categories.map((category) => ({
        id: String(category.id),
        label: renderCategoryLabel(category),
    }));

    useEffect(() => {
        const selectedShop = shopOptions.find((shop) => shop.id === formData.shop_id);
        setShopSearch(selectedShop?.label || '');
    }, [formData.shop_id, shops.length]);

    useEffect(() => {
        const selectedCategory = categoryOptions.find((category) => category.id === formData.category_id);
        setCategorySearch(selectedCategory?.label || '');
    }, [categories.length, formData.category_id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                shopSearchRef.current &&
                !shopSearchRef.current.contains(target) &&
                categorySearchRef.current &&
                !categorySearchRef.current.contains(target)
            ) {
                setOpenDropdown(null);
                return;
            }

            if (shopSearchRef.current && !shopSearchRef.current.contains(target) && openDropdown === 'shop') {
                setOpenDropdown(null);
            }

            if (categorySearchRef.current && !categorySearchRef.current.contains(target) && openDropdown === 'category') {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const handleSearchInputChange = (
        field: 'shop_id' | 'category_id',
        value: string,
        options: { id: string; label: string }[],
        setSearch: (value: string) => void,
        dropdown: Exclude<SearchDropdown, null>,
    ) => {
        setSearch(value);
        setOpenDropdown(dropdown);
        const normalizedValue = value.trim().toLowerCase();
        const selectedOption = options.find((option) => option.label.trim().toLowerCase() === normalizedValue);

        setFormData((prev) => ({
            ...prev,
            [field]: selectedOption?.id || '',
        }));
    };

    const selectSearchOption = (
        field: 'shop_id' | 'category_id',
        option: { id: string; label: string },
        setSearch: (value: string) => void,
    ) => {
        setSearch(option.label);
        setFormData((prev) => ({
            ...prev,
            [field]: option.id,
        }));
        setOpenDropdown(null);
    };

    const filteredShopOptions = shopOptions.filter((shop) =>
        shop.label.toLowerCase().includes(shopSearch.trim().toLowerCase())
    );
    const filteredCategoryOptions = categoryOptions.filter((category) =>
        category.label.toLowerCase().includes(categorySearch.trim().toLowerCase())
    );

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
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label className="block text-sm font-medium text-silver-300">Select Shop</label>
                                <button
                                    type="button"
                                    onClick={() => toggleQuickAddPanel('shop')}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-400 hover:text-accent-300"
                                >
                                    <Plus size={14} />
                                    Quick add shop
                                </button>
                            </div>
                            <div ref={shopSearchRef} className="relative">
                                <input
                                    type="text"
                                    value={shopSearch}
                                    onFocus={() => setOpenDropdown('shop')}
                                    onChange={(e) => handleSearchInputChange('shop_id', e.target.value, shopOptions, setShopSearch, 'shop')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setOpenDropdown(null);
                                        }
                                    }}
                                    className="w-full px-4 py-2 pr-12 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                    placeholder="Search or choose a shop..."
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdown((prev) => (prev === 'shop' ? null : 'shop'))}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-silver-400 hover:text-white"
                                    aria-label="Toggle shop suggestions"
                                >
                                    <ChevronDown size={18} className={`transition-transform ${openDropdown === 'shop' ? 'rotate-180' : ''}`} />
                                </button>

                                {openDropdown === 'shop' && (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-dark-600 bg-dark-800 shadow-2xl">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar py-2">
                                            {filteredShopOptions.length > 0 ? (
                                                filteredShopOptions.map((shop) => (
                                                    <button
                                                        key={shop.id}
                                                        type="button"
                                                        onClick={() => selectSearchOption('shop_id', shop, setShopSearch)}
                                                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-dark-700 ${
                                                            formData.shop_id === shop.id ? 'bg-dark-700 text-white' : 'text-silver-300'
                                                        }`}
                                                    >
                                                        <span className="truncate">{shop.label}</span>
                                                        {formData.shop_id === shop.id && <CheckCircle size={16} className="ml-3 flex-shrink-0 text-accent-500" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-silver-500">No matching shops found.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {quickAddPanel === 'shop' && (
                                <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-white">Quick Add Shop</h3>
                                        <p className="text-xs text-silver-500 mt-1">Create a shop here and auto-select it for this product.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={shopForm.name}
                                                onChange={(e) => setShopForm((prev) => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="Shop name"
                                            />
                                            <input
                                                type="email"
                                                value={shopForm.email}
                                                onChange={(e) => setShopForm((prev) => ({ ...prev, email: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="Email"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={shopForm.phone}
                                                onChange={(e) => setShopForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="Phone"
                                            />
                                            <input
                                                type="text"
                                                value={shopForm.city}
                                                onChange={(e) => setShopForm((prev) => ({ ...prev, city: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="City"
                                            />
                                        </div>

                                        <textarea
                                            rows={2}
                                            value={shopForm.address}
                                            onChange={(e) => setShopForm((prev) => ({ ...prev, address: e.target.value }))}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                            placeholder="Address"
                                        />

                                        <textarea
                                            rows={2}
                                            value={shopForm.description}
                                            onChange={(e) => setShopForm((prev) => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                            placeholder="Description (optional)"
                                        />

                                        {shopError && <p className="text-sm text-red-400">{shopError}</p>}

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetQuickAdd('shop');
                                                    setQuickAddPanel(null);
                                                }}
                                                className="px-4 py-2 text-silver-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCreateShop}
                                                disabled={
                                                    shopLoading ||
                                                    !shopForm.name.trim() ||
                                                    !shopForm.email.trim() ||
                                                    !shopForm.phone.trim() ||
                                                    !shopForm.city.trim() ||
                                                    !shopForm.address.trim()
                                                }
                                                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 disabled:opacity-50"
                                            >
                                                {shopLoading ? 'Saving...' : 'Save Shop'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label className="block text-sm font-medium text-silver-300">Category</label>
                                <button
                                    type="button"
                                    onClick={() => toggleQuickAddPanel('category')}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-400 hover:text-accent-300"
                                >
                                    <Plus size={14} />
                                    Quick add category
                                </button>
                            </div>
                            <div ref={categorySearchRef} className="relative">
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onFocus={() => setOpenDropdown('category')}
                                    onChange={(e) => handleSearchInputChange('category_id', e.target.value, categoryOptions, setCategorySearch, 'category')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setOpenDropdown(null);
                                        }
                                    }}
                                    className="w-full px-4 py-2 pr-12 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
                                    placeholder="Search or select category..."
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdown((prev) => (prev === 'category' ? null : 'category'))}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-silver-400 hover:text-white"
                                    aria-label="Toggle category suggestions"
                                >
                                    <ChevronDown size={18} className={`transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                                </button>

                                {openDropdown === 'category' && (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-dark-600 bg-dark-800 shadow-2xl">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar py-2">
                                            {filteredCategoryOptions.length > 0 ? (
                                                filteredCategoryOptions.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => selectSearchOption('category_id', category, setCategorySearch)}
                                                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-dark-700 ${
                                                            formData.category_id === category.id ? 'bg-dark-700 text-white' : 'text-silver-300'
                                                        }`}
                                                    >
                                                        <span className="truncate">{category.label}</span>
                                                        {formData.category_id === category.id && <CheckCircle size={16} className="ml-3 flex-shrink-0 text-accent-500" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-silver-500">No matching categories found.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {quickAddPanel === 'category' && (
                                <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-white">Quick Add Category</h3>
                                        <p className="text-xs text-silver-500 mt-1">Create a category without leaving the product form.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                            placeholder="Category name"
                                        />

                                        <select
                                            value={categoryForm.parent}
                                            onChange={(e) => setCategoryForm((prev) => ({ ...prev, parent: e.target.value }))}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700"
                                        >
                                            <option value="">No parent</option>
                                            {categories.filter((category) => !category.parent).map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>

                                        <textarea
                                            rows={3}
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                            placeholder="Description"
                                        />

                                        {categoryError && <p className="text-sm text-red-400">{categoryError}</p>}

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetQuickAdd('category');
                                                    setQuickAddPanel(null);
                                                }}
                                                className="px-4 py-2 text-silver-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCreateCategory}
                                                disabled={categoryLoading || !categoryForm.name.trim()}
                                                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 disabled:opacity-50"
                                            >
                                                {categoryLoading ? 'Saving...' : 'Save Category'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">MRP (Rs.)</label>
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
                            <label className="block text-sm font-medium text-silver-300 mb-1">Supplier Price (Rs.)</label>
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
                            <label className="block text-sm font-medium text-silver-300 mb-1">Our Price (Rs.)</label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
                        <label className="block text-sm font-medium text-silver-300 mb-1">Gallery Images (Multiple)</label>

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
                                                    setDeletedImageIds((prev) => [...prev, img.id]);
                                                    setExistingImages((prev) => prev.filter((item) => item.id !== img.id));
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
                                        <div className="w-full mt-2 text-xs text-silver-500">Click to add more images</div>
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
                            {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
