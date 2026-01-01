import { Search, Plus, X, Save, Upload, Edit, Trash2, CheckCircle, Info } from 'lucide-react';
import { Product, Shop, Category } from '@/types/admin';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import ProductDetail from './ProductDetail';

interface ProductsTabProps {
    products: Product[];
    shops: Shop[];
    categories: Category[];
    onRefresh?: () => void;
}

export default function ProductsTab({ products, shops, categories, onRefresh }: ProductsTabProps) {
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_product');
    const canEdit = hasPermission('change_product');
    const canDelete = hasPermission('delete_product');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        commission_rate: '10.00',
        stock: '',
        shop_id: '',
        category_id: '',
        image: null as File | null
    });

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            commission_rate: product.commission_rate.toString(),
            stock: product.stock.toString(),
            shop_id: product.shop?.id ? product.shop.id.toString() : (product.shop_id ? product.shop_id.toString() : ''),
            category_id: product.category?.id ? product.category.id.toString() : (product.category_id ? product.category_id.toString() : ''),
            image: null
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            commission_rate: '10.00',
            stock: '',
            shop_id: '',
            category_id: '',
            image: null
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({
                ...formData,
                image: e.target.files[0]
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('commission_rate', formData.commission_rate);
        data.append('stock', formData.stock);
        data.append('shop_id', formData.shop_id);

        if (formData.category_id) {
            data.append('category_id', formData.category_id);
        }

        // Only append image if one was selected
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const url = editingProduct
                ? `${API_BASE_URL}/admin/products/${editingProduct.id}/`
                : `${API_BASE_URL}/admin/products/`;

            const method = editingProduct ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (response.ok) {
                handleClose();
                if (onRefresh) onRefresh();
            } else {
                console.error('Failed to save product');
                alert('Failed to save product. Please try again.');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (onRefresh) onRefresh();
            } else {
                alert('Failed to delete product.');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    if (viewingProduct) {
        return (
            <ProductDetail
                product={viewingProduct}
                onBack={() => setViewingProduct(null)}
                onEdit={handleEdit}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({
                                name: '',
                                description: '',
                                price: '',
                                commission_rate: '10.00',
                                stock: '',
                                shop_id: '',
                                category_id: '',
                                image: null
                            });
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Shop</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                {(canEdit || canDelete) && <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No products found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-100 transition-all"
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
                                                        className="font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-1"
                                                        onClick={() => setViewingProduct(product)}
                                                    >
                                                        {product.name}
                                                        <Info size={14} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                                                    </div>
                                                    <div className="text-xs text-gray-500">{product.category_name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.shop_name}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">₹{formatNumber(product.current_price)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {product.commission_rate}%
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{product.stock}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {product.stock === 0 ? 'Out of Stock' : 'Active'}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Shop & Category Selection */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop</label>
                                    <select
                                        name="shop_id"
                                        required
                                        value={formData.shop_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                                    >
                                        <option value="">Choose a Shop...</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g. Organic Bananas"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                                    <input
                                        type="number"
                                        name="commission_rate"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.commission_rate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    placeholder="Product description..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
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
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <CheckCircle size={20} />
                                            <span className="font-medium">{formData.image.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            {editingProduct?.image && !formData.image ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={editingProduct.image} alt="Current" className="h-20 w-20 object-cover rounded-lg mb-2" />
                                                    <span className="text-sm">Click to change image</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={24} />
                                                    <span className="text-sm">Click to upload image</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : (
                                        <>
                                            <Save size={18} /> {editingProduct ? 'Update Product' : 'Create Product'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
