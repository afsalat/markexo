import { Search, Plus, X, Save, Upload, Edit, Trash2, Grid, CheckCircle, Folder, Layers, CornerDownRight, ChevronRight } from 'lucide-react';
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

    const [searchTerm, setSearchTerm] = useState('');


    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent: '' as string | number,
        image: null as File | null
    });

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: (category as any).description || '',
            parent: category.parent || '',
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
            parent: '',
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

        if (formData.parent) {
            data.append('parent', formData.parent.toString());
        } else if (editingCategory) {
            data.append('parent', '');
        }

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
                const errData = await response.json();
                console.error('Failed to save category:', errData);
                alert('Failed to save category. ' + (errData?.error || 'Please try again.'));
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

    const filteredCategories = categories.filter(cat => {
        return cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const parentCount = categories.filter(c => !c.parent).length;
    const subCount = categories.filter(c => !!c.parent).length;

    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const handleAddSub = (parentId: number) => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            parent: parentId,
            image: null
        });
        setIsModalOpen(true);
    };

    const parentCategories = categories.filter(c => !c.parent).filter(parent => {
        const matchesSearch = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parent.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMatchingChild = categories.some(child =>
            child.parent === parent.id &&
            (child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                child.slug.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        return matchesSearch || hasMatchingChild;
    });

    const subCategories = categories.filter(c => !!c.parent);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center text-accent-500">
                        <Grid size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-silver-500">Total Categories</p>
                        <p className="text-xl font-bold text-white">{categories.length}</p>
                    </div>
                </div>
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <Folder size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-silver-500">Main Categories</p>
                        <p className="text-xl font-bold text-white">{parentCount}</p>
                    </div>
                </div>
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-silver-500">Sub-categories</p>
                        <p className="text-xl font-bold text-white">{subCount}</p>
                    </div>
                </div>
            </div>

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                        Categories
                        <span className="text-xs bg-dark-700 text-silver-400 px-2.5 py-1 rounded-full border border-dark-600">
                            {filteredCategories.length} items
                        </span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-silver-600 focus:border-accent-500 outline-none transition-all"
                        />
                    </div>

                    {canAdd && (
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setFormData({ name: '', description: '', parent: '', image: null });
                                setIsModalOpen(true);
                            }}
                            className="bg-accent-600 text-dark-900 px-5 py-2 rounded-xl hover:bg-accent-500 flex items-center gap-2 font-bold transition-all shadow-lg shadow-accent-500/20"
                        >
                            <Plus size={20} />
                            Add New
                        </button>
                    )}
                </div>
            </div>

            {/* Categories Hierarchical List */}
            <div className="space-y-3">
                {parentCategories.length === 0 ? (
                    <div className="py-20 text-center bg-dark-800/30 rounded-3xl border-2 border-dashed border-dark-700">
                        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4 text-silver-600">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">No categories found</h3>
                        <p className="text-silver-500">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    parentCategories.map((parent) => {
                        const parentMatches = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            parent.slug.toLowerCase().includes(searchTerm.toLowerCase());

                        const children = subCategories.filter(c => {
                            if (c.parent !== parent.id) return false;
                            if (!searchTerm) return true;
                            if (parentMatches) return true;
                            return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.slug.toLowerCase().includes(searchTerm.toLowerCase());
                        });

                        const isExpanded = expandedCategories.has(parent.id) || searchTerm.length > 0;

                        return (
                            <div key={parent.id} className="space-y-2">
                                {/* Parent Row */}
                                <div className="bg-dark-800 border border-dark-700 p-4 rounded-2xl flex items-center justify-between group hover:border-accent-500/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleExpand(parent.id)}
                                            className={`p-1.5 hover:bg-dark-700 rounded-lg transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'} ${children.length === 0 ? 'opacity-0 cursor-default' : 'text-silver-400'}`}
                                            disabled={children.length === 0}
                                        >
                                            <ChevronRight size={16} />
                                        </button>

                                        <div className="w-12 h-12 rounded-xl bg-dark-700 overflow-hidden flex-shrink-0 border border-dark-600">
                                            {parent.image ? (
                                                <img src={parent.image} alt={parent.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-dark-600">
                                                    <Grid size={20} />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white text-lg">{parent.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-silver-500 font-mono italic">/{parent.slug}</span>
                                                <span className="text-[10px] bg-dark-900 text-silver-400 px-2 py-0.5 rounded-full border border-dark-700">
                                                    {children.length} Sub-categories
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {canAdd && (
                                            <button
                                                onClick={() => handleAddSub(parent.id)}
                                                className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                                                title="Add Subcategory"
                                            >
                                                <Plus size={16} /> <span>Sub-category</span>
                                            </button>
                                        )}
                                        <div className="h-6 w-[1px] bg-dark-700 mx-1" />
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEdit(parent)}
                                                className="p-2.5 text-silver-400 hover:bg-accent-500/10 hover:text-accent-500 rounded-xl transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(parent.id)}
                                                className="p-2.5 text-silver-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Children Rows */}
                                {isExpanded && children.length > 0 && (
                                    <div className="ml-10 pl-6 border-l-2 border-dark-700/50 space-y-2 py-1">
                                        {children.map(child => (
                                            <div key={child.id} className="bg-dark-800/40 border border-dark-700/50 p-3 rounded-xl flex items-center justify-between group hover:border-accent-500/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <CornerDownRight size={16} className="text-dark-600" />
                                                    <div className="w-10 h-10 rounded-lg bg-dark-700/50 overflow-hidden flex-shrink-0 border border-dark-700/50">
                                                        {child.image ? (
                                                            <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-dark-600">
                                                                <Grid size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-silver-100 text-sm">{child.name}</h4>
                                                        <p className="text-[10px] text-silver-600 font-mono italic">/{child.slug}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-silver-500 bg-dark-900/50 px-2 py-1 rounded-lg border border-dark-700/50 mr-2">
                                                        {child.product_count || 0} Products
                                                    </span>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(child)}
                                                            className="p-2 text-silver-400 hover:text-accent-500 transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(child.id)}
                                                            className="p-2 text-silver-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-dark-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in border border-dark-700">
                        <div className="flex justify-between items-center p-6 border-b border-dark-700">
                            <h2 className="text-xl font-bold text-white">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button onClick={handleClose} className="text-silver-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Parent (Optional)</label>
                                <select
                                    name="parent"
                                    value={formData.parent}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                                >
                                    <option value="">None</option>
                                    {categories.filter(c => !c.parent && c.id !== editingCategory?.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Image</label>
                                <div
                                    className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center cursor-pointer hover:bg-dark-700"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    {formData.image ? (
                                        <div className="text-green-500 flex items-center justify-center gap-2">
                                            <CheckCircle size={20} /> <span>{formData.image.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-silver-500 flex flex-col items-center gap-2">
                                            <Upload size={24} />
                                            <span className="text-sm">Upload image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                                <button type="button" onClick={handleClose} className="px-4 py-2 text-silver-400">Cancel</button>
                                <button type="submit" disabled={loading} className="bg-accent-600 text-dark-900 px-6 py-2 rounded-lg font-bold">
                                    {loading ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
