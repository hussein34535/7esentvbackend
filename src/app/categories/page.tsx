'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCategoriesWithCounts, updateCategoriesSortOrder, deleteCategory, bulkDeleteCategories, duplicateCategory, CategoryWithCount } from '@/app/actions';
import { CloudinaryAsset } from '@/types/cloudinary.types';
import Link from 'next/link';
import { Plus, Trash2, Hash, Star, CheckSquare, Square, XSquare, Copy, Search, X, ChevronDown, GripVertical, Save, ArrowLeftRight } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Categories</h1>
                    <p className="text-xs md:text-sm text-inkmute mt-1">
                        {loading ? '...' : `${filtered.length} of ${categories.length} categories`}
                    </p>
                </div>

                {!reorderMode && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { exitReorderMode(); setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                            disabled={loading}
                            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none border disabled:opacity-40 disabled:pointer-events-none ${selectMode ? 'bg-accentsoft border-accentline text-accentstrong' : 'bg-surface border-line hover:bg-surface2 text-ink'}`}
                        >
                            {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                            <span>{selectMode ? 'Cancel' : 'Select'}</span>
                        </button>

                        <button
                            onClick={enterReorderMode}
                            disabled={loading || categories.length < 2}
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm bg-surface border border-line hover:bg-surface2 text-ink disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>Reorder</span>
                        </button>

                        <Link href="/categories/new" className="flex items-center gap-2 btn-gradient-red text-white px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                            <Plus className="w-4 h-4" />
                            <span>Add Category</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Reorder mode bar */}
            {reorderMode && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-3 md:p-4 bg-accentsoft border border-accentline rounded-2xl">
                    <GripVertical className="hidden sm:block w-5 h-5 text-accentstrong shrink-0" />
                    <p className="text-sm text-inksoft flex-1">Drag the cards to rearrange them. The new order is what the app will use.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={exitReorderMode}
                            disabled={savingOrder}
                            className="px-4 py-2 rounded-[10px] text-sm font-medium bg-surface border border-line hover:bg-surface2 text-ink transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveOrder}
                            disabled={!hasOrderChanged || savingOrder}
                            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium btn-gradient-red text-white transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            <Save className="w-4 h-4" />
                            {savingOrder ? 'Saving...' : hasOrderChanged ? 'Save Order' : 'No Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar: Search + Sort */}
            {!reorderMode && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or ID..."
                            className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-8 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkmute hover:text-ink transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-3 pr-9 py-2 text-sm text-ink outline-none transition-colors cursor-pointer w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                            <option value="sort-order">Sort order</option>
                            <option value="name-asc">Name A → Z</option>
                            <option value="name-desc">Name Z → A</option>
                            <option value="most-channels">Most channels</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectMode && !reorderMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-surface rounded-2xl border border-line shadow-card">
                    <span className="text-sm text-inksoft tabular-nums">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className="text-xs font-medium text-accentstrong hover:underline focus-visible:outline-none">Select All</button>
                    <button onClick={deselectAll} className="text-xs font-medium text-inkmute hover:text-ink transition-colors focus-visible:outline-none">Deselect All</button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className="flex items-center gap-2 bg-danger hover:bg-red-600 text-white px-4 py-2 rounded-[10px] font-medium transition-all duration-200 active:scale-[0.98] shadow-sm text-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-surface2 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    {(reorderMode ? orderList : categories).length === 0 ? (
                        <div className="p-10 text-center bg-surface rounded-2xl border border-line">
                            <Hash className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                            <p className="text-sm text-inksoft">No categories found.</p>
                        </div>
                    ) : !reorderMode && filtered.length === 0 ? (
                        <div className="p-10 text-center bg-surface rounded-2xl border border-line">
                            <Hash className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                            <p className="text-inksoft mb-2">No matching categories</p>
                            <button onClick={() => setSearch('')} className="text-accentstrong hover:underline text-xs font-medium focus-visible:outline-none">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ${reorderMode ? 'transition-opacity' : ''}`}>
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
                                        className={`relative transition-all duration-200 ${isDragging ? 'opacity-40 scale-95' : ''} ${isOver ? 'ring-2 ring-accent/60 scale-[1.02]' : ''} ${reorderMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                        {reorderMode && (
                                            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-surface px-2 py-1 rounded-lg border border-line shadow-card pointer-events-none">
                                                <GripVertical className="w-4 h-4 text-inkmute" />
                                                <span className="text-xs font-bold text-ink tabular-nums">{index + 1}</span>
                                            </div>
                                        )}
                                        {!reorderMode && selectMode && (
                                            <button
                                                onClick={() => toggleSelect(cat.id)}
                                                aria-label="Toggle selection"
                                                className="absolute top-3 left-3 z-30 p-1 rounded-md bg-surface border border-line shadow-card transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                            >
                                                {selectedIds.has(cat.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-accent" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-inkmute" />
                                                )}
                                            </button>
                                        )}
                                        <Link
                                            href={reorderMode || (selectMode && !reorderMode) ? '#' : `/categories/${cat.id}`}
                                            onClick={(e) => {
                                                if (reorderMode) { e.preventDefault(); return; }
                                                if (selectMode) { e.preventDefault(); toggleSelect(cat.id); }
                                            }}
                                            className={`group bg-surface border rounded-2xl p-4 md:p-5 transition-all duration-200 relative block h-full ${reorderMode
                                                ? 'border-accentline hover:border-accent/60'
                                                : selectedIds.has(cat.id)
                                                    ? 'border-accent bg-accentsoft/50'
                                                    : 'hover:border-accent/40 hover:shadow-cardhover'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-surface2 rounded-xl border border-line transition-colors w-12 h-12 flex items-center justify-center overflow-hidden shrink-0 ml-12">
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
                                                            <Hash className="w-5 h-5 text-inkmute" />
                                                        );
                                                    })()}
                                                </div>
                                                {!reorderMode && (
                                                    <div className="flex gap-2 absolute top-4 right-4">
                                                        {cat.is_premium && (
                                                            <span className="bg-warnsoft text-warn text-xs font-semibold px-2 py-1 rounded-full border border-warn/20 flex items-center gap-1">
                                                                <Star className="w-3 h-3 fill-current" /> VIP
                                                            </span>
                                                        )}
                                                        {!selectMode && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={(e) => handleDuplicate(e, cat.id)}
                                                                    className="text-inkmute hover:text-ink hover:bg-surface2 p-2 rounded-lg transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                                    title="Duplicate"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(e, cat.id)}
                                                                    className="text-inkmute hover:text-danger hover:bg-dangersoft p-2 rounded-lg transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-base text-ink mb-1 truncate">{cat.name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-inkmute">
                                                <span className="bg-surface2 border border-line px-2 py-0.5 rounded-full text-inksoft tabular-nums">
                                                    {cat.channels_count} channel{cat.channels_count !== 1 ? 's' : ''}
                                                </span>
                                                <span className="tabular-nums">Order: {index + 1}</span>
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
