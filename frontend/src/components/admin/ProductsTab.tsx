import { Search, Plus, Edit, Trash2, Info, CheckCircle } from 'lucide-react';
import { Product, Category } from '@/types/admin';
import { useState } from 'react';
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

    const filteredProducts = products.filter(p => {
        if (filterStatus === 'all') return true;
        return p.approval_status === filterStatus;
    });

    // Show form if editing or adding
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

    // Show product detail if viewing
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

    // Show products list
    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <div className="flex bg-dark-800 p-1 rounded-lg border border-dark-700 w-full sm:w-auto overflow-x-auto custom-scrollbar whitespace-nowrap hidden-scrollbar">
                        {(['all', 'pending', 'approved'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                                    : 'text-silver-500 hover:text-white'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    {canAdd && (
                        <button
                            onClick={handleAddNew}
                            className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-500 flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-accent-500/20 shrink-0"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Add Product</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Product</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Category</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Our Price</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Profit</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Stock</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Approval</th>
                                {(canEdit || canDelete) && <th className="text-right px-6 py-3 text-xs font-medium text-silver-500 uppercase">Actions</th>}
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
                                    <tr key={product.id} className="hover:bg-dark-700 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent-500/50 transition-all border border-dark-600"
                                                    onClick={() => setViewingProduct(product)}
                                                >
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl">📦</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div
                                                        className="font-medium text-white cursor-pointer hover:text-accent-500 transition-colors flex items-center gap-1"
                                                        onClick={() => setViewingProduct(product)}
                                                    >
                                                        {product.name}
                                                        <Info size={14} className="opacity-0 group-hover:opacity-100 text-silver-400" />
                                                    </div>
                                                    <div className="text-xs text-silver-500">{product.category_name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-silver-400">{product.category_name || 'Uncategorized'}</td>
                                        <td className="px-6 py-4 font-semibold text-white">₹{formatNumber(product.current_price)}</td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {product.profit_margin ? (
                                                <span className="text-green-500">₹{formatNumber(Number(product.profit_margin))}</span>
                                            ) : (
                                                <span className="text-silver-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-silver-300">{product.stock}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                                {product.stock === 0 ? 'Out of Stock' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${product.approval_status === 'approved'
                                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                : product.approval_status === 'rejected'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {product.approval_status ? (product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)) : 'Approved'}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && user?.is_superuser && product.approval_status === 'pending' && (
                                                        <button
                                                            onClick={(e) => handleApprove(e, product)}
                                                            className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                            title="Approve Product"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-silver-400 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-silver-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
