import { Search, Plus, X, Save, Upload, Edit, Trash2, Grid, CheckCircle } from 'lucide-react';
import { Category } from '@/types/admin';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface CategoriesTabProps {
    categories: Category[];
    onRefresh?: () => void;
}

export default function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_category');
    const canEdit = hasPermission('change_category');
    const canDelete = hasPermission('delete_category');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Extended form data to include description which might not be in the basic Listing interface but usually part of API
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: null as File | null
    });

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: (category as any).description || '', // Cast to any if description is missing in listing type
            image: null
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            image: null
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const url = editingCategory
                ? `${API_BASE_URL}/admin/categories/${editingCategory.id}/`
                : `${API_BASE_URL}/admin/categories/`;

            const method = editingCategory ? 'PATCH' : 'POST';

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
                console.error('Failed to save category');
                alert('Failed to save category. Please try again.');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/categories/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (onRefresh) onRefresh();
            } else {
                alert('Failed to delete category.');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-gray-900">Categories</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setFormData({ name: '', description: '', image: null });
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Category
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm">
                        <Grid size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No categories found. Create one to get started.</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="h-40 bg-gray-100 relative">
                                {(category as any).image ? (
                                    <img src={(category as any).image} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Grid size={40} />
                                    </div>
                                )}
                                {(canEdit || canDelete) && (
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-lg backdrop-blur-sm">
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-gray-600 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="text-gray-600 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>{category.product_count || 0} Products</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                                        /{category.slug}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-scale-in">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g. Electronics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    placeholder="Category description..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
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
                                            {(editingCategory as any)?.image && !formData.image ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={(editingCategory as any).image} alt="Current" className="h-16 w-16 object-cover rounded-lg mb-2" />
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
                                            <Save size={18} /> {editingCategory ? 'Update Category' : 'Create Category'}
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
