import { Plus, Edit, Trash2, Info, CheckCircle, Search, ChevronDown, X, Sparkles } from 'lucide-react';
import { Product, Category } from '@/types/admin';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import ProductDetail from './ProductDetail';
import ProductForm from './ProductForm';

interface ProductsTabProps {
    products: Product[];
    categories: Category[];
    onRefresh?: () => void;
    apiBasePath?: string;
    shopsEndpoint?: string;
    categoriesEndpoint?: string;
    shopsCreateEndpoint?: string;
    categoriesCreateEndpoint?: string;
    canAddOverride?: boolean;
    canEditOverride?: boolean;
    canDeleteOverride?: boolean;
    title?: string;
}

export default function ProductsTab({
    products,
    categories,
    onRefresh,
    apiBasePath = `${API_BASE_URL}/admin/products`,
    shopsEndpoint = `${API_BASE_URL}/admin/shops/`,
    categoriesEndpoint = `${API_BASE_URL}/admin/categories/`,
    shopsCreateEndpoint = `${API_BASE_URL}/admin/shops/`,
    categoriesCreateEndpoint = `${API_BASE_URL}/admin/categories/`,
    canAddOverride,
    canEditOverride,
    canDeleteOverride,
    title = 'Products',
}: ProductsTabProps) {
    const { token, hasPermission, user } = useAuth();
    const canAdd = canAddOverride ?? hasPermission('add_product');
    const canEdit = canEditOverride ?? hasPermission('change_product');
    const canDelete = canDeleteOverride ?? hasPermission('delete_product');

    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

    const handleEdit = (product: Product) => {
        setViewingProduct(null);
        setEditingProductId(product.id);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingProductId(null);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingProductId(null);
        if (onRefresh) onRefresh();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await fetch(`${apiBasePath}/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (onRefresh) onRefresh();
                alert('Product deleted successfully!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Failed to delete product: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categorySearch, setCategorySearch] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    const handleApprove = async (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        if (!confirm(`Approve product "${product.name}"?`)) return;

        try {
            const response = await fetch(`${apiBasePath}/${product.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ approval_status: 'approved' })
            });

            if (response.ok) {
                if (onRefresh) onRefresh();
            } else {
                alert('Failed to approve product');
            }
        } catch (error) {
            console.error('Error approving product:', error);
        }
    };

    const handleGenerateBlog = async (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        if (!confirm(`Generate AI blog for "${product.name}"? This will use Gemini AI to create SEO-optimized content.`)) return;

        const button = e.currentTarget as HTMLButtonElement;
        const originalContent = button.innerHTML;
        button.innerHTML = '<svg class="animate-spin h-4 w-4 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        button.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/blog/generate_from_product/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_id: product.id })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Success! AI Blog generated: "${data.title}"`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`AI Generation failed: ${errorData.error || 'Server error'}`);
            }
        } catch (error) {
            console.error('Error calling AI blog service:', error);
            alert('An unexpected error occurred during AI blog generation.');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    };

    const categoryOptions = (categories.length > 0
        ? categories.map((category) => ({
            id: String(category.id),
            name: category.name,
        }))
        : products
            .filter((product) => product.category_name)
            .map((product) => ({
                id: String(product.category_id ?? product.category?.id ?? product.category_name),
                name: product.category_name as string,
            }))
    ).filter((category, index, allCategories) => (
        allCategories.findIndex((item) => item.id === category.id) === index
    ));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setCategorySearch('');
            return;
        }

        const selectedOption = categoryOptions.find((category) => category.id === selectedCategory);
        setCategorySearch(selectedOption?.name ?? '');
    }, [selectedCategory, categoryOptions]);

    const filteredCategoryOptions = categoryOptions.filter((category) => (
        category.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
    ));

    const handleCategoryInputChange = (value: string) => {
        setCategorySearch(value);
        setIsCategoryDropdownOpen(true);

        if (!value.trim()) {
            setSelectedCategory('all');
        }
    };

    const handleCategorySelect = (categoryId: string, categoryName: string) => {
        setSelectedCategory(categoryId);
        setCategorySearch(categoryName);
        setIsCategoryDropdownOpen(false);
    };

    const clearCategoryFilter = () => {
        setSelectedCategory('all');
        setCategorySearch('');
        setIsCategoryDropdownOpen(false);
    };

    const filteredProducts = products.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.approval_status === filterStatus;
        const productCategoryId = String(p.category_id ?? p.category?.id ?? p.category_name ?? '');
        const matchesCategory = selectedCategory === 'all' || productCategoryId === selectedCategory;
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch = normalizedQuery.length === 0 || [
            p.name,
            p.category_name,
            p.category?.name,
            p.sku,
            p.slug,
        ].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));

        return matchesStatus && matchesCategory && matchesSearch;
    });

    if (showForm) {
        return (
            <ProductForm
                productId={editingProductId || undefined}
                onBack={handleFormClose}
                onSuccess={handleFormClose}
                apiBasePath={apiBasePath}
                shopsEndpoint={shopsEndpoint}
                categoriesEndpoint={categoriesEndpoint}
                shopsCreateEndpoint={shopsCreateEndpoint}
                categoriesCreateEndpoint={categoriesCreateEndpoint}
            />
        );
    }

    if (viewingProduct) {
        return (
            <ProductDetail
                product={viewingProduct}
                onBack={() => setViewingProduct(null)}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
                    <p className="mt-1 text-sm text-silver-500">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto">
                    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                        <div className="relative w-full lg:w-80">
                            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search product, SKU, slug..."
                                className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-silver-500 focus:border-accent-500 focus:outline-none"
                            />
                        </div>
                        <div ref={categoryDropdownRef} className="relative w-full lg:w-56">
                            <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => handleCategoryInputChange(e.target.value)}
                                onFocus={() => setIsCategoryDropdownOpen(true)}
                                placeholder="Search category..."
                                className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-3 pr-16 text-sm text-white placeholder:text-silver-500 focus:border-accent-500 focus:outline-none"
                            />
                            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                                {selectedCategory !== 'all' || categorySearch ? (
                                    <button
                                        type="button"
                                        onClick={clearCategoryFilter}
                                        className="rounded-md p-1 text-silver-500 transition-colors hover:bg-dark-700 hover:text-white"
                                        aria-label="Clear category filter"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                    className="rounded-md p-1 text-silver-500 transition-colors hover:bg-dark-700 hover:text-white"
                                    aria-label="Toggle category options"
                                >
                                    <ChevronDown size={16} className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {isCategoryDropdownOpen && (
                                <div className="custom-scrollbar absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={clearCategoryFilter}
                                        className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                                            selectedCategory === 'all'
                                                ? 'bg-accent-500/15 text-white'
                                                : 'text-silver-300 hover:bg-dark-700 hover:text-white'
                                        }`}
                                    >
                                        All Categories
                                    </button>
                                    {filteredCategoryOptions.length > 0 ? (
                                        filteredCategoryOptions.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => handleCategorySelect(category.id, category.name)}
                                                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                                                    selectedCategory === category.id
                                                        ? 'bg-accent-500/15 text-white'
                                                        : 'text-silver-300 hover:bg-dark-700 hover:text-white'
                                                }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-silver-500">
                                            No categories found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:justify-end">
                        <div className="custom-scrollbar hidden-scrollbar flex w-full overflow-x-auto whitespace-nowrap rounded-lg border border-dark-700 bg-dark-800 p-1 sm:w-auto">
                        {(['all', 'pending', 'approved'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 text-sm font-medium transition-all sm:flex-none ${filterStatus === status
                                    ? 'rounded-md bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                                    : 'text-silver-500 hover:text-white'
                                    } flex-1`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                        </div>
                        {canAdd && (
                            <button
                                onClick={handleAddNew}
                                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2 font-medium text-white shadow-lg shadow-accent-500/20 transition-colors hover:bg-accent-500"
                            >
                                <Plus size={20} />
                                <span className="hidden sm:inline">Add Product</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] table-fixed">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="w-[380px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Product</th>
                                <th className="w-[180px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Category</th>
                                <th className="w-[110px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Our Price</th>
                                <th className="w-[110px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Profit</th>
                                <th className="w-[90px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Stock</th>
                                <th className="w-[120px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Status</th>
                                <th className="w-[130px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Approval</th>
                                {(canEdit || canDelete) && <th className="w-[110px] px-6 py-3 text-right text-xs font-medium uppercase text-silver-500">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-silver-500">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="group transition-colors hover:bg-dark-700">
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div
                                                    className="h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-dark-600 bg-dark-700 transition-all hover:ring-2 hover:ring-accent-500/50"
                                                    onClick={() => setViewingProduct(product)}
                                                >
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-xl">📦</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div
                                                        className="flex cursor-pointer items-start gap-1 break-normal font-medium leading-snug text-white transition-colors hover:text-accent-500"
                                                        onClick={() => setViewingProduct(product)}
                                                    >
                                                        <span className="min-w-0 whitespace-normal">{product.name}</span>
                                                        <Info size={14} className="mt-0.5 shrink-0 text-silver-400 opacity-0 group-hover:opacity-100" />
                                                    </div>
                                                    <div className="mt-1 whitespace-normal break-normal text-xs text-silver-500">{product.category_name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top whitespace-normal break-normal text-sm text-silver-400">{product.category_name || 'Uncategorized'}</td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap font-semibold text-white">&#8377;{formatNumber(product.current_price)}</td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap text-sm font-medium">
                                            {product.profit_margin ? (
                                                <span className="text-green-500">&#8377;{formatNumber(Number(product.profit_margin))}</span>
                                            ) : (
                                                <span className="text-silver-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap text-silver-300">{product.stock}</td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${product.stock === 0 ? 'border border-red-500/20 bg-red-500/10 text-red-500' : 'border border-green-500/20 bg-green-500/10 text-green-500'}`}>
                                                {product.stock === 0 ? 'Out of Stock' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${product.approval_status === 'approved'
                                                ? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
                                                : product.approval_status === 'rejected'
                                                    ? 'border-red-500/20 bg-red-500/10 text-red-500'
                                                    : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {product.approval_status ? (product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)) : 'Approved'}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right align-top">
                                                <div className="flex justify-end gap-1 whitespace-nowrap">
                                                    {canEdit && user?.is_superuser && product.approval_status === 'pending' && (
                                                        <button
                                                            onClick={(e) => handleApprove(e, product)}
                                                            className="rounded-lg p-2 text-yellow-500 transition-colors hover:bg-yellow-500/10"
                                                            title="Approve Product"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button
                                                            onClick={(e) => handleGenerateBlog(e, product)}
                                                            className="rounded-lg p-2 text-accent-500 transition-colors hover:bg-accent-500/10"
                                                            title="Generate AI Blog"
                                                        >
                                                            <Sparkles size={16} />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="rounded-lg p-2 text-silver-400 transition-colors hover:bg-accent-500/10 hover:text-accent-500"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="rounded-lg p-2 text-silver-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
