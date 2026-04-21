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

interface FAQ {
    question: string;
    answer: string;
}

interface BlogPost {
    title: string;
    content: string;
    products: string[];
    category?: string;
    tags?: string[];
    meta_title?: string;
    meta_description?: string;
}

type QuickAddPanel = 'shop' | 'category' | null;
type SearchDropdown = 'shop' | 'category' | null;
type SearchOption = {
    id: string;
    label: string;
    matchText?: string;
};
type CategoryOption = SearchOption & {
    name: string;
    depth: number;
    parentLabel: string | null;
};

type QuickFillMessage = {
    type: 'success' | 'error';
    text: string;
};

const MAX_UPLOAD_FILENAME_LENGTH = 100;

function normalizeSearchText(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function slugifyFilePart(value: string) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

function getFileExtension(fileName: string) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
}

function buildSpecificationPreview(value: string) {
    return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' ');
}

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

const quickFillFieldAliases: Record<string, string[]> = {
    name: ['name', 'product name', 'title'],
    description: ['description', 'desc', 'product description'],
    mrp: ['mrp', 'maximum retail price', 'list price', 'retail price'],
    supplier_price: ['supplier price', 'supplier cost', 'cost price', 'purchase price'],
    our_price: ['our price', 'price', 'sale price', 'selling price', 'customer price', 'current price'],
    stock: ['stock', 'quantity', 'inventory'],
    sku: ['sku', 'product code'],
    meesho_url: ['meesho url', 'source url', 'product url', 'meesho link'],
    shop: ['shop', 'shop name', 'seller', 'store'],
    category: ['category', 'subcategory', 'category path'],
    is_featured: ['featured', 'is featured', 'featured product'],
    specificationsText: ['specifications', 'specification', 'specs'],
};

function getQuickFillFieldName(rawKey: string) {
    const normalizedKey = normalizeSearchText(rawKey);

    return Object.entries(quickFillFieldAliases).find(([, aliases]) => (
        aliases.some((alias) => normalizeSearchText(alias) === normalizedKey)
    ))?.[0] ?? null;
}

function appendMultilineValue(currentValue: string, nextLine: string) {
    return currentValue ? `${currentValue}\n${nextLine}` : nextLine;
}

function parseQuickFillInput(input: string) {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return null;
    }

    if (trimmedInput.startsWith('{')) {
        try {
            const payload = JSON.parse(trimmedInput);

            if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
                const objectPayload = payload as Record<string, unknown>;

                return {
                    name: String(objectPayload.name ?? objectPayload.product_name ?? objectPayload.title ?? ''),
                    description: String(objectPayload.description ?? objectPayload.desc ?? ''),
                    mrp: String(objectPayload.mrp ?? objectPayload.maximum_retail_price ?? objectPayload.list_price ?? ''),
                    supplier_price: String(objectPayload.supplier_price ?? objectPayload.cost_price ?? ''),
                    our_price: String(objectPayload.our_price ?? objectPayload.price ?? objectPayload.sale_price ?? ''),
                    stock: String(objectPayload.stock ?? objectPayload.quantity ?? ''),
                    sku: String(objectPayload.sku ?? ''),
                    meesho_url: String(objectPayload.meesho_url ?? objectPayload.source_url ?? objectPayload.product_url ?? ''),
                    shop: String(objectPayload.shop ?? objectPayload.shop_name ?? objectPayload.seller ?? ''),
                    category: String(objectPayload.category ?? objectPayload.subcategory ?? ''),
                    is_featured: String(objectPayload.is_featured ?? objectPayload.featured ?? ''),
                    specificationsText: typeof objectPayload.specifications === 'object' && objectPayload.specifications
                        ? Object.entries(objectPayload.specifications as Record<string, unknown>)
                            .map(([key, value]) => `${key}: ${String(value)}`)
                            .join('\n')
                        : String(objectPayload.specifications ?? objectPayload.specs ?? ''),
                };
            }
        } catch {
            // Fall back to line parsing below.
        }
    }

    const result: Record<string, string> = {};
    let currentMultilineField: 'description' | 'specificationsText' | null = null;

    for (const rawLine of trimmedInput.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line) {
            continue;
        }

        const separatorIndex = line.indexOf(':');

        if (separatorIndex !== -1) {
            const possibleKey = line.slice(0, separatorIndex).trim();
            const fieldName = getQuickFillFieldName(possibleKey);

            if (fieldName) {
                const fieldValue = line.slice(separatorIndex + 1).trim();

                if (fieldName === 'description' || fieldName === 'specificationsText') {
                    result[fieldName] = fieldValue;
                    currentMultilineField = fieldName;
                } else {
                    result[fieldName] = fieldValue;
                    currentMultilineField = null;
                }

                continue;
            }
        }

        if (currentMultilineField) {
            result[currentMultilineField] = appendMultilineValue(result[currentMultilineField] ?? '', line);
        }
    }

    return result;
}

function parseBooleanInput(value: string) {
    const normalizedValue = normalizeSearchText(value);
    return ['true', 'yes', 'y', '1', 'featured', 'on'].includes(normalizedValue);
}

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
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const shopSearchRef = useRef<HTMLDivElement>(null);
    const categorySearchRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
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
    const [quickFillInput, setQuickFillInput] = useState('');
    const [quickFillMessage, setQuickFillMessage] = useState<QuickFillMessage | null>(null);

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
        specificationsText: '',
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

    const stringifySpecifications = (specifications?: Record<string, unknown>) => {
        if (!specifications) {
            return '';
        }

        return Object.entries(specifications)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join('\n');
    };

    const parseSpecificationsText = (value: string) => {
        return value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .reduce((acc, line) => {
                const separatorIndex = line.indexOf(':');
                if (separatorIndex === -1) {
                    return acc;
                }

                const key = line.slice(0, separatorIndex).trim();
                const fieldValue = line.slice(separatorIndex + 1).trim();

                if (key && fieldValue) {
                    acc[key] = fieldValue;
                }

                return acc;
            }, {} as Record<string, string>);
    };

    const getSelectedCategoryLabel = () => {
        const selectedCategory = categories.find((category) => String(category.id) === formData.category_id);
        return selectedCategory?.name ?? '';
    };

    const buildSeoImageBaseName = () => {
        const categoryPart = getSelectedCategoryLabel();
        const baseParts = [
            formData.name,
            categoryPart,
            formData.sku,
            formData.description.split(/\s+/).slice(0, 8).join(' '),
            buildSpecificationPreview(formData.specificationsText),
        ]
            .map((value) => slugifyFilePart(value))
            .filter(Boolean);

        const fallback = baseParts.join('-') || 'product-image';
        return fallback.slice(0, 110);
    };

    const renameFileForUpload = (file: File, variant: 'main' | 'gallery', index?: number) => {
        const extension = getFileExtension(file.name);
        const baseName = buildSeoImageBaseName();
        const suffix = variant === 'main' ? 'main' : `gallery-${(index ?? 0) + 1}`;
        const reservedLength = suffix.length + extension.length + 2;
        const maxBaseLength = Math.max(1, MAX_UPLOAD_FILENAME_LENGTH - reservedLength);
        const safeBaseName = baseName.slice(0, maxBaseLength).replace(/-+$/g, '') || 'product-image';
        const fileName = `${safeBaseName}-${suffix}.${extension}`;

        return new File([file], fileName, {
            type: file.type,
            lastModified: file.lastModified,
        });
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
                    specificationsText: stringifySpecifications((product as Product & { specifications?: Record<string, unknown> }).specifications),
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
            const renamedFile = renameFileForUpload(e.target.files[0], 'main');
            setFormData((prev) => ({ ...prev, image: renamedFile }));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormData((prev) => ({
                ...prev,
                gallery_images: [
                    ...prev.gallery_images,
                    ...filesArray.map((file, index) => renameFileForUpload(file, 'gallery', prev.gallery_images.length + index)),
                ],
            }));
            e.target.value = '';
        }
    };

    const removeGalleryFile = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            gallery_images: prev.gallery_images.filter((_, fileIndex) => fileIndex !== index),
        }));
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
            data.append('image', renameFileForUpload(formData.image, 'main'));
        }

        const specsObj = parseSpecificationsText(formData.specificationsText);
        data.append('specifications', JSON.stringify(specsObj));

        formData.gallery_images.forEach((file, index) => {
            data.append('uploaded_images', renameFileForUpload(file, 'gallery', index));
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

    const getCategoryPath = (category: Category) => {
        const path = [category.name];
        let parentId = category.parent ?? null;

        while (parentId) {
            const parent = categoryMap.get(parentId);
            if (!parent) {
                break;
            }

            path.unshift(parent.name);
            parentId = parent.parent ?? null;
        }

        return path;
    };

    const shopOptions = shops.map((shop) => ({
        id: String(shop.id),
        label: shop.city ? `${shop.name} - ${shop.city}` : shop.name,
    }));
    const categoryOptions: CategoryOption[] = categories.map((category) => {
        const path = getCategoryPath(category);
        const depth = getCategoryDepth(category);
        const parentLabel = path.length > 1 ? path.slice(0, -1).join(' / ') : null;
        const searchableText = [
            category.name,
            path.join(' / '),
            path.join(' '),
            parentLabel ?? '',
            category.parent_name ?? '',
            category.slug,
        ].join(' ');

        return {
            id: String(category.id),
            name: category.name,
            depth,
            parentLabel,
            label: path.join(' / '),
            matchText: normalizeSearchText(searchableText),
        };
    });

    useEffect(() => {
        if (openDropdown === 'shop') {
            return;
        }

        const selectedShop = shopOptions.find((shop) => shop.id === formData.shop_id);
        setShopSearch(selectedShop?.label || '');
    }, [formData.shop_id, openDropdown, shopOptions]);

    useEffect(() => {
        if (openDropdown === 'category') {
            return;
        }

        const selectedCategory = categoryOptions.find((category) => category.id === formData.category_id);
        setCategorySearch(selectedCategory?.label || '');
    }, [categoryOptions, formData.category_id, openDropdown]);

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
        options: SearchOption[],
        setSearch: (value: string) => void,
        dropdown: Exclude<SearchDropdown, null>,
    ) => {
        setSearch(value);
        setOpenDropdown(dropdown);
        const normalizedValue = value.trim().toLowerCase();
        const selectedOption = options.find((option) => {
            const matchText = option.matchText ?? option.label.toLowerCase();
            return option.label.trim().toLowerCase() === normalizedValue || matchText === normalizedValue;
        });

        setFormData((prev) => ({
            ...prev,
            [field]: selectedOption?.id || '',
        }));
    };

    const selectSearchOption = (
        field: 'shop_id' | 'category_id',
        option: SearchOption,
        setSearch: (value: string) => void,
    ) => {
        setSearch(option.label);
        setFormData((prev) => ({
            ...prev,
            [field]: option.id,
        }));
        setOpenDropdown(null);
    };

    const findMatchingOption = <T extends SearchOption>(options: T[], rawValue: string) => {
        const normalizedValue = normalizeSearchText(rawValue);

        if (!normalizedValue) {
            return null;
        }

        return options.find((option) => normalizeSearchText(option.label) === normalizedValue)
            ?? options.find((option) => normalizeSearchText(option.matchText ?? option.label).includes(normalizedValue))
            ?? options.find((option) => normalizedValue.includes(normalizeSearchText(option.label)));
    };

    const handleQuickFill = () => {
        const parsedData = parseQuickFillInput(quickFillInput);

        if (!parsedData) {
            setQuickFillMessage({
                type: 'error',
                text: 'Paste product details first.',
            });
            return;
        }

        const matchedShop = parsedData.shop ? findMatchingOption(shopOptions, parsedData.shop) : null;
        const matchedCategory = parsedData.category ? findMatchingOption(categoryOptions, parsedData.category) : null;
        const warnings: string[] = [];

        if (parsedData.shop && !matchedShop) {
            warnings.push(`Shop not matched: ${parsedData.shop}`);
        }

        if (parsedData.category && !matchedCategory) {
            warnings.push(`Category not matched: ${parsedData.category}`);
        }

        setFormData((prev) => ({
            ...prev,
            name: parsedData.name || prev.name,
            description: parsedData.description || prev.description,
            mrp: parsedData.mrp || prev.mrp,
            supplier_price: parsedData.supplier_price || prev.supplier_price,
            our_price: parsedData.our_price || prev.our_price,
            stock: parsedData.stock || prev.stock,
            sku: parsedData.sku || prev.sku,
            meesho_url: parsedData.meesho_url || prev.meesho_url,
            is_featured: parsedData.is_featured ? parseBooleanInput(parsedData.is_featured) : prev.is_featured,
            shop_id: matchedShop?.id || prev.shop_id,
            category_id: matchedCategory?.id || prev.category_id,
            specificationsText: parsedData.specificationsText || prev.specificationsText,
        }));

        if (matchedShop) {
            setShopSearch(matchedShop.label);
        }

        if (matchedCategory) {
            setCategorySearch(matchedCategory.label);
        }

        setQuickFillMessage({
            type: warnings.length > 0 ? 'error' : 'success',
            text: warnings.length > 0
                ? `Fields filled. ${warnings.join(' | ')}`
                : 'Fields filled successfully.',
        });
    };

    const normalizedShopSearch = normalizeSearchText(shopSearch);
    const normalizedCategorySearch = normalizeSearchText(categorySearch);
    const selectedCategoryOption = categoryOptions.find((category) => category.id === formData.category_id);

    const filteredShopOptions = shopOptions.filter((shop) =>
        normalizeSearchText(shop.label).includes(normalizedShopSearch)
    );
    const filteredCategoryOptions = categoryOptions
        .map((category) => {
            if (
                selectedCategoryOption &&
                normalizedCategorySearch.length > 0 &&
                normalizedCategorySearch === normalizeSearchText(selectedCategoryOption.label)
            ) {
                return { category, rank: 0, visible: true };
            }

            const searchTokens = normalizedCategorySearch.split(' ').filter(Boolean);

            if (searchTokens.length === 0) {
                return {
                    category,
                    rank: normalizeSearchText(category.label),
                    visible: true,
                };
            }

            const normalizedName = normalizeSearchText(category.name);
            const normalizedLabel = normalizeSearchText(category.label);
            const normalizedParent = normalizeSearchText(category.parentLabel ?? '');
            const haystack = category.matchText ?? normalizedLabel;
            const matchesAllTokens = searchTokens.every((token) => haystack.includes(token));

            if (!matchesAllTokens) {
                return { category, rank: Number.POSITIVE_INFINITY, visible: false };
            }

            let score = 50;

            if (normalizedName === normalizedCategorySearch || normalizedLabel === normalizedCategorySearch) {
                score = 0;
            } else if (normalizedName.startsWith(normalizedCategorySearch)) {
                score = 5;
            } else if (normalizedLabel.startsWith(normalizedCategorySearch)) {
                score = 10;
            } else if (normalizedName.includes(normalizedCategorySearch)) {
                score = 15;
            } else if (normalizedParent.includes(normalizedCategorySearch)) {
                score = 20;
            } else if (normalizedLabel.includes(normalizedCategorySearch)) {
                score = 25;
            }

            return {
                category,
                rank: `${String(score).padStart(2, '0')}-${String(category.depth).padStart(2, '0')}-${normalizedLabel}`,
                visible: true,
            };
        })
        .filter((item) => item.visible)
        .sort((a, b) => String(a.rank).localeCompare(String(b.rank)))
        .map((item) => item.category);

    return (
        <div className="animate-fade-in">
            <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
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
                    <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-white">Quick Fill</h2>
                                <p className="mt-1 text-xs text-silver-400">
                                    Paste one formatted block and fill product fields automatically.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleQuickFill}
                                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-500"
                            >
                                Fill Fields
                            </button>
                        </div>
                        <textarea
                            rows={8}
                            value={quickFillInput}
                            onChange={(e) => {
                                setQuickFillInput(e.target.value);
                                if (quickFillMessage) {
                                    setQuickFillMessage(null);
                                }
                            }}
                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-sm leading-6 text-white outline-none resize-y placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                            placeholder={`Name: Wooden Money Piggy Bank
Description: Wooden money bank for kids
MRP: 399
Supplier Price: 180
Our Price: 250
Stock: 50
SKU: SPAAC-02-11000
Shop: meesho
Category: Money Banks
Meesho URL: https://meesho.com/product/...
Featured: yes
Specifications:
Material: Wooden
Savings Goal: 11000 Rupees`}
                        />
                        <p className="mt-2 text-xs text-silver-500">
                            Supported labels: Name, Description, MRP, Supplier Price, Our Price, Stock, SKU, Shop, Category, Meesho URL, Featured, Specifications.
                        </p>
                        {quickFillMessage && (
                            <p className={`mt-3 text-sm ${quickFillMessage.type === 'success' ? 'text-green-400' : 'text-amber-400'}`}>
                                {quickFillMessage.text}
                            </p>
                        )}
                    </div>

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
                                                        onClick={() => selectSearchOption('shop_id', shop, setShopSearch, 'shop')}
                                                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-dark-900 ${
                                                            formData.shop_id === shop.id ? 'bg-dark-900 text-white' : 'text-silver-300'
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
                                                        <div
                                                            className="min-w-0"
                                                            style={{ paddingLeft: `${category.depth * 18}px` }}
                                                        >
                                                            <span className="block truncate font-medium">{category.name}</span>
                                                            <span className="mt-0.5 block truncate text-xs text-silver-500">
                                                                {category.parentLabel ? `Inside ${category.parentLabel}` : 'Top-level category'}
                                                            </span>
                                                        </div>
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
                                <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-5 mt-6">
                                    <div className="mb-4">
                                        <div>
                                            <h2 className="text-sm font-semibold text-white">Quick Add Category</h2>
                                            <p className="text-xs text-silver-500 mt-1">Create a category without leaving the product form.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-silver-300 mb-1">Category Name</label>
                                            <input
                                                type="text"
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="Category name"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-silver-300 mb-1">Parent Category</label>
                                            <select
                                                value={categoryForm.parent}
                                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, parent: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700"
                                            >
                                                <option value="">No parent</option>
                                                {categoryOptions.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {`${'— '.repeat(category.depth)}${category.label}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-silver-300 mb-1">Description</label>
                                            <textarea
                                                rows={3}
                                                value={categoryForm.description}
                                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                                placeholder="Description"
                                            />
                                        </div>
                                        
                                        {categoryError && <p className="text-sm text-red-400">{categoryError}</p>}
                                        
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetQuickAdd('category');
                                                    setQuickAddPanel(null);
                                                }}
                                                className="px-4 py-2 text-silver-400 hover:text-white hover:bg-dark-700 transition-colors"
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
                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none text-white bg-dark-700 placeholder-silver-600"
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

                        <div
                            className="cursor-pointer rounded-lg border-2 border-dashed border-dark-600 p-6 text-center transition-colors hover:bg-dark-700"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={galleryInputRef}
                                accept="image/*"
                                onChange={handleGalleryChange}
                            />
                            <div className="flex flex-col items-center gap-2 text-silver-500">
                                {formData.gallery_images.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {formData.gallery_images.map((file, index) => (
                                            <div
                                                key={`${file.name}-${file.size}-${index}`}
                                                className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-500"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <CheckCircle size={16} />
                                                <span>{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeGalleryFile(index);
                                                    }}
                                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                                    title={`Remove ${file.name}`}
                                                    aria-label={`Remove ${file.name}`}
                                                >
                                                    <X size={12} />
                                                </button>
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
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-sm font-medium text-silver-300">Specifications</label>
                            <span className="text-xs text-silver-500">One per line in `Key: Value` format</span>
                        </div>
                        <textarea
                            rows={10}
                            value={formData.specificationsText}
                            onChange={(e) => setFormData((prev) => ({ ...prev, specificationsText: e.target.value }))}
                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 font-mono text-sm leading-7 text-white outline-none resize-y placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                            placeholder={`Brand: DALUCI
Type: Socket Safety Cover / Plug Protector
Quantity: Pack of 10
Usage: Wall Socket Protection
Feature: Child Proof & Shock Prevention
Installation: Plug-in Type
Compatibility: Standard Indian Sockets
Safety: Non-toxic Material
BIS/ISI Certification: Not Specified
Country of Origin: India`}
                        />
                        <p className="mt-2 text-xs text-silver-500">
                            Empty lines are ignored. Only lines with `:` are saved.
                        </p>
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

                    {/* Blog Creation Section */}
                    <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-5 mt-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-white">Blog Post (Optional)</h2>
                                <p className="mt-1 text-xs text-silver-500">
                                    Create a blog post to promote this product and boost SEO
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Blog Title</label>
                                <input
                                    type="text"
                                    value={blogPost.title}
                                    onChange={(e) => setBlogPost(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                    placeholder="e.g., Best Shaker Bottles for Gym in India (2026)"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Blog Content</label>
                                <textarea
                                    rows={8}
                                    value={blogPost.content}
                                    onChange={(e) => setBlogPost(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                    placeholder="Write about this product, its benefits, and why customers should buy it..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Blog Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={blogPost.tags?.join(', ') || ''}
                                    onChange={(e) => setBlogPost(prev => ({ 
                                        ...prev, 
                                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                                    }))}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                    placeholder="gym, fitness, protein, workout"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-5 mt-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-white">FAQ Section (Optional)</h2>
                                <p className="mt-1 text-xs text-silver-500">
                                    Add frequently asked questions to improve customer experience
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="space-y-3 p-4 border border-dark-600 rounded-lg">
                                    <div className="flex items-center justify-between gap-3">
                                        <input
                                            type="text"
                                            value={faq.question}
                                            onChange={(e) => {
                                                const newFaqs = [...faqs];
                                                newFaqs[index].question = e.target.value;
                                                setFaqs(newFaqs);
                                            }}
                                            className="flex-1 px-4 py-2 border border-dark-600 rounded-lg outline-none text-white bg-dark-700 placeholder-silver-600"
                                            placeholder="Enter question..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFaqs = faqs.filter((_, i) => i !== index);
                                                setFaqs(newFaqs.length > 0 ? newFaqs : [{ question: '', answer: '' }]);
                                            }}
                                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={faq.answer}
                                        onChange={(e) => {
                                            const newFaqs = [...faqs];
                                            newFaqs[index].answer = e.target.value;
                                            setFaqs(newFaqs);
                                        }}
                                        className="w-full px-4 py-2 border border-dark-600 rounded-lg outline-none resize-none text-white bg-dark-700 placeholder-silver-600"
                                        placeholder="Enter answer..."
                                    />
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}
                                className="w-full px-4 py-2 border border-dashed border-dark-600 rounded-lg text-silver-400 hover:text-white hover:border-solid transition-colors"
                            >
                                + Add FAQ
                            </button>
                        </div>
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
