'use client';

import { useEffect, useMemo, useState } from 'react';
import { getNews, deleteNews, bulkDeleteNews, duplicateNews } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Film, Calendar, Star, CheckSquare, Square, XSquare, Copy, Search, ChevronDown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

type NewsItem = Database['public']['Tables']['news']['Row'];

type SortOption = 'newest' | 'oldest' | 'title';

type ImageLike = { secure_url?: string; url?: string };

const getImgUrl = (img: NewsItem['image']): string | null => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (Array.isArray(img)) {
        const first = img[0] as ImageLike | undefined;
        return (first && (first.secure_url || first.url)) || null;
    }
    const single = img as unknown as ImageLike;
    return single.secure_url || single.url || null;
};

const FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

export default function NewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const filtered = useMemo(() => {
        let list = [...news];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(n => (n.title || '').toLowerCase().includes(q) || String(n.id).includes(q));
        }
        switch (sortBy) {
            case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
            case 'title': list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
            default: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return list;
    }, [news, search, sortBy]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getNews();
            setNews(data || []);
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
        if (!confirm('Delete this article?')) return;
        await deleteNews(id);
        loadData();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateNews(id);
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

    const selectAll = () => setSelectedIds(new Set(filtered.map(n => n.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected articles?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteNews(Array.from(selectedIds));
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 font-sans">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">مباريات كاملة</h1>
                    <p className="text-xs md:text-sm text-inkmute mt-1 tabular-nums">
                        {loading ? '...' : `${filtered.length} of ${news.length} items`}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING} ${selectMode
                            ? 'bg-accent border border-accent text-white hover:bg-accentstrong'
                            : 'bg-surface border border-line hover:bg-surface2 text-ink'
                            }`}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link
                        href="/news/auto-import"
                        className={`flex items-center gap-2 btn-gradient-violet text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                    >
                        <Zap className="w-4 h-4" />
                        <span>جلب تلقائي</span>
                    </Link>

                    <Link
                        href="/news/new"
                        className={`flex items-center gap-2 btn-gradient-red text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة يدوي</span>
                    </Link>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title or ID..."
                        className={`w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-8 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${FOCUS_RING}`}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-inkmute hover:text-ink transition-colors ${FOCUS_RING}`}
                        >
                            <XSquare className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative sm:w-48">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        aria-label="Sort items"
                        className={`appearance-none w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-3 pr-9 py-2 text-sm text-ink outline-none transition-colors cursor-pointer ${FOCUS_RING}`}
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="title">Title A → Z</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-surface border border-line rounded-2xl shadow-card">
                    <span className="text-sm text-inksoft font-medium tabular-nums">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className={`text-xs font-medium text-accent hover:text-accentstrong transition-colors rounded ${FOCUS_RING}`}>Select All</button>
                    <button onClick={deselectAll} className={`text-xs font-medium text-inksoft hover:text-ink transition-colors rounded ${FOCUS_RING}`}>Deselect All</button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className={`flex items-center gap-2 bg-danger hover:bg-red-600 text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${FOCUS_RING}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-surface border border-line rounded-2xl overflow-hidden animate-pulse">
                            <div className="aspect-video bg-surface2" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-surface2 rounded-md w-3/4" />
                                <div className="h-3 bg-surface2 rounded-md w-1/3" />
                                <div className="h-3 bg-surface2 rounded-md w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : news.length === 0 ? (
                <div className="bg-surface border border-line rounded-2xl px-6 py-16 text-center">
                    <Film className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                    <p className="text-sm text-inksoft mb-5">لا توجد مباريات كاملة. أضف واحدة للبدء.</p>
                    <Link
                        href="/news/new"
                        className={`inline-flex items-center gap-2 btn-gradient-red text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة يدوي</span>
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-line rounded-2xl px-6 py-16 text-center">
                    <Search className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                    <p className="text-sm text-inksoft mb-4">No matching items</p>
                    <button onClick={() => setSearch('')} className={`text-sm font-medium text-accent hover:text-accentstrong underline underline-offset-4 transition-colors rounded ${FOCUS_RING}`}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filtered.map((item) => {
                        const imgUrl = getImgUrl(item.image);

                        return (
                            <div key={item.id} className="relative">
                                {selectMode && (
                                    <button
                                        onClick={() => toggleSelect(item.id)}
                                        aria-label={selectedIds.has(item.id) ? 'Deselect item' : 'Select item'}
                                        className={`absolute top-2 left-2 z-30 p-1.5 rounded-lg bg-surface/95 border border-line shadow-sm transition-colors ${FOCUS_RING}`}
                                    >
                                        {selectedIds.has(item.id) ? (
                                            <CheckSquare className="w-5 h-5 text-accent" />
                                        ) : (
                                            <Square className="w-5 h-5 text-inkmute" />
                                        )}
                                    </button>
                                )}
                                <Link
                                    href={selectMode ? '#' : `/news/${item.id}`}
                                    onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(item.id); } : undefined}
                                    className={`block group bg-surface border rounded-2xl overflow-hidden shadow-card transition-all duration-200 ${!item.is_published ? 'opacity-60 grayscale-[0.5]' : ''} ${selectedIds.has(item.id)
                                        ? 'border-accent bg-accentsoft/50'
                                        : 'border-line hover:border-accent/40 hover:shadow-cardhover'
                                        }`}
                                >
                                    <div className="relative aspect-video bg-surface2 overflow-hidden">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={item.title || 'News Image'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Film className="w-8 h-8 text-inkmute/50" />
                                            </div>
                                        )}

                                        {!selectMode && (
                                            <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleDuplicate(e, item.id)}
                                                    title="Duplicate as Draft"
                                                    className={`p-2 rounded-lg bg-surface/95 border border-line text-inkmute hover:text-ink hover:bg-surface2 transition-colors ${FOCUS_RING}`}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    title="Delete Article"
                                                    className={`p-2 rounded-lg bg-surface/95 border border-line text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${FOCUS_RING}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-ink truncate mb-2">{item.title || 'Untitled'}</h3>
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs text-inkmute mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.date ? new Date(item.date).toLocaleDateString() : 'No Date'}
                                            </span>
                                            {item.is_premium && (
                                                <span className="inline-flex items-center gap-1 bg-warnsoft text-warn px-2 py-0.5 rounded-full text-[11px] font-medium">
                                                    <Star className="w-3 h-3 fill-current" />VIP
                                                </span>
                                            )}
                                            {!item.is_published && (
                                                <span className="inline-flex items-center bg-infosoft text-info px-2 py-0.5 rounded-full text-[11px] font-medium">
                                                    DRAFT
                                                </span>
                                            )}
                                        </div>
                                        <div className="pt-3 border-t border-line">
                                            <span className="text-xs text-inkmute font-mono tabular-nums">ID: {item.id}</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
