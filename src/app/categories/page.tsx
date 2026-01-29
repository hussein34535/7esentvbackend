'use client';

import { useEffect, useState } from 'react';
import { getCategories, deleteCategory, bulkDeleteCategories, duplicateCategory } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Hash, Star, CheckSquare, Square, XSquare, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Category = Database['public']['Tables']['channel_categories']['Row'];

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this category?')) return;
        await deleteCategory(id);
        loadData();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateCategory(id);
        if (result.success) {
            loadData();
            router.refresh();
        }
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = () => setSelectedIds(new Set(categories.map(c => c.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected categories?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteCategories(Array.from(selectedIds));
            setSelectedIds(new Set());
            setSelectMode(false);
            loadData();
            router.refresh();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Categories
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Organize content and set premium access.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link href="/categories/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition cursor-pointer">
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className="text-xs text-purple-400 hover:text-purple-300">Select All</button>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-300">Deselect All</button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <>
                    {categories.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                            No categories found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="relative">
                                    {selectMode && (
                                        <button
                                            onClick={() => toggleSelect(cat.id)}
                                            className="absolute top-4 left-4 z-30 p-1 rounded bg-slate-800/80"
                                        >
                                            {selectedIds.has(cat.id) ? (
                                                <CheckSquare className="w-5 h-5 text-purple-400" />
                                            ) : (
                                                <Square className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                    <Link
                                        href={selectMode ? '#' : `/categories/${cat.id}`}
                                        onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(cat.id); } : undefined}
                                        className={`group bg-slate-900 border rounded-xl p-6 transition relative block ${selectedIds.has(cat.id)
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-slate-800 hover:border-purple-500/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 group-hover:border-purple-500/30 transition">
                                                <Hash className="w-6 h-6 text-purple-500" />
                                            </div>
                                            <div className="flex gap-2">
                                                {cat.is_premium && (
                                                    <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-current" /> VIP
                                                    </span>
                                                )}
                                                {!selectMode && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => handleDuplicate(e, cat.id)}
                                                            className="text-slate-600 hover:text-purple-500 hover:bg-purple-500/10 p-2 rounded transition z-20 relative"
                                                            title="Duplicate"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(e, cat.id)}
                                                            className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition z-20 relative"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-xl mb-1 group-hover:text-purple-400 transition">{cat.name}</h3>
                                        <p className="text-slate-500 text-sm">Sort Order: {cat.sort_order}</p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
