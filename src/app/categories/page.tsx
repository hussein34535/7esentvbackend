'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCategoriesWithCounts, updateCategoriesSortOrder, deleteCategory, bulkDeleteCategories, duplicateCategory, CategoryWithCount } from '@/app/actions';
import { CloudinaryAsset } from '@/types/cloudinary.types';
import Link from 'next/link';
import { Plus, Trash2, Hash, Star, CheckSquare, Square, XSquare, Copy, Search, ArrowUpDown, GripVertical, Save, ArrowLeftRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SortOption = 'sort-order' | 'name-asc' | 'name-desc' | 'most-channels';

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('sort-order');

    // Reorder (drag & drop) mode
    const [reorderMode, setReorderMode] = useState(false);
    const [orderList, setOrderList] = useState<CategoryWithCount[]>([]);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const [savingOrder, setSavingOrder] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCategoriesWithCounts();
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

    const filtered = useMemo(() => {
        let list = [...categories];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || String(c.id).includes(q));
        }
        switch (sortBy) {
            case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'most-channels': list.sort((a, b) => b.channels_count - a.channels_count); break;
            default: break; // already sorted by sort_order from server
        }
        return list;
    }, [categories, search, sortBy]);

    const enterReorderMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
        setSearch('');
        setSortBy('sort-order');
        setOrderList([...categories]);
        setReorderMode(true);
    };

    const exitReorderMode = () => {
        setReorderMode(false);
        setDragIndex(null);
        setOverIndex(null);
    };

    const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= orderList.length || from === to) return;
        setOrderList(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setOverIndex(null);
    };

    const saveOrder = async () => {
        if (!hasOrderChanged) return;
        setSavingOrder(true);
        try {
            const result = await updateCategoriesSortOrder(orderList.map(c => c.id));
            if (result.success) {
                exitReorderMode();
                await loadData();
                router.refresh();
            }
        } finally {
            setSavingOrder(false);
        }
    };

    const hasOrderChanged = useMemo(
        () => reorderMode && orderList.some((c, i) => categories[i]?.id !== c.id),
        [reorderMode, orderList, categories]
    );

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

    const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)));
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
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Categories
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">
                        {loading ? '...' : `${filtered.length} of ${categories.length} categories`}
                    </p>
                </div>

                {!reorderMode && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { exitReorderMode(); setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                            disabled={loading}
                            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition text-xs md:text-sm disabled:opacity-50 ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                            <span>{selectMode ? 'Cancel' : 'Select'}</span>
                        </button>

                        <button
                            onClick={enterReorderMode}
                            disabled={loading || categories.length < 2}
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition text-xs md:text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>Reorder</span>
                        </button>

                        <Link href="/categories/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition cursor-pointer text-xs md:text-sm">
                            <Plus className="w-4 h-4" />
                            <span>Add Category</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Reorder mode bar */}
            {reorderMode && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 p-3 md:p-4 bg-purple-950/40 rounded-xl border border-purple-500/30">
                    <GripVertical className="hidden sm:block w-5 h-5 text-purple-400" />
                    <p className="text-sm text-purple-200 flex-1">Drag the cards to rearrange them. The new order is what the app will use.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={exitReorderMode}
                            disabled={savingOrder}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveOrder}
                            disabled={!hasOrderChanged || savingOrder}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 transition"
                        >
                            <Save className="w-4 h-4" />
                            {savingOrder ? 'Saving...' : hasOrderChanged ? 'Save Order' : 'No Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar: Search + Sort */}
            {!reorderMode && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or ID..."
                            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg pl-9 pr-8 py-2 text-sm outline-none transition placeholder:text-slate-600"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <XSquare className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg pl-9 pr-8 py-2 text-sm outline-none transition cursor-pointer w-full sm:w-auto"
                        >
                            <option value="sort-order">Sort order</option>
                            <option value="name-asc">Name A → Z</option>
                            <option value="name-desc">Name Z → A</option>
                            <option value="most-channels">Most channels</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectMode && !reorderMode && (
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
                    {(reorderMode ? orderList : categories).length === 0 ? (
                        <div className="p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                            No categories found.
                        </div>
                    ) : !reorderMode && filtered.length === 0 ? (
                        <div className="p-10 text-center bg-slate-900 rounded-xl border border-slate-800">
                            <Hash className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 mb-1">No matching categories</p>
                            <button onClick={() => setSearch('')} className="text-purple-400 hover:text-purple-300 text-xs underline">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 ${reorderMode ? 'transition-opacity' : ''}`}>
                            {(reorderMode ? orderList : filtered).map((cat, index) => {
                                const isDragging = reorderMode && dragIndex === index;
                                const isOver = reorderMode && overIndex === index && dragIndex !== null && dragIndex !== index;
                                return (
                                    <div
                                        key={cat.id}
                                        draggable={reorderMode}
                                        onDragStart={() => setDragIndex(index)}
                                        onDragEnter={() => reorderMode && setOverIndex(index)}
                                        onDragOver={(e) => { if (reorderMode) e.preventDefault(); }}
                                        onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) moveItem(dragIndex, index); }}
                                        onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                                        className={`relative ${isDragging ? 'opacity-40 scale-95' : ''} ${isOver ? 'ring-2 ring-purple-400 scale-[1.02]' : ''} ${reorderMode ? 'cursor-grab active:cursor-grabbing transition-all' : ''}`}
                                    >
                                        {reorderMode && (
                                            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-purple-950/80 backdrop-blur px-2 py-1 rounded-lg border border-purple-500/40 pointer-events-none">
                                                <GripVertical className="w-4 h-4 text-purple-300" />
                                                <span className="text-xs font-bold text-purple-200">{index + 1}</span>
                                            </div>
                                        )}
                                        {!reorderMode && selectMode && (
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
                                            href={reorderMode || (selectMode && !reorderMode) ? '#' : `/categories/${cat.id}`}
                                            onClick={(e) => {
                                                if (reorderMode) { e.preventDefault(); return; }
                                                if (selectMode) { e.preventDefault(); toggleSelect(cat.id); }
                                            }}
                                            className={`group bg-slate-900 border rounded-xl p-4 md:p-6 transition relative block h-full ${reorderMode
                                                ? 'border-purple-500/40 hover:border-purple-400'
                                                : selectedIds.has(cat.id)
                                                    ? 'border-purple-500 bg-purple-500/10'
                                                    : 'border-slate-800 hover:border-purple-500/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-slate-950 rounded-lg border border-slate-800 group-hover:border-purple-500/30 transition w-12 h-12 flex items-center justify-center overflow-hidden shrink-0 ml-12">
                                                    {(() => {
                                                        const img = cat.image as CloudinaryAsset | null;
                                                        const imgUrl = img?.url;
                                                        return imgUrl ? (
                                                            <img
                                                                src={imgUrl}
                                                                alt={cat.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Hash className="w-6 h-6 text-purple-500" />
                                                        );
                                                    })()}
                                                </div>
                                                {!reorderMode && (
                                                    <div className="flex gap-2 absolute top-4 right-4">
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
                                                )}
                                            </div>

                                            <h3 className="font-bold text-base md:text-xl mb-1 group-hover:text-purple-400 transition truncate">{cat.name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                                                    {cat.channels_count} channel{cat.channels_count !== 1 ? 's' : ''}
                                                </span>
                                                <span>Order: {index + 1}</span>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
