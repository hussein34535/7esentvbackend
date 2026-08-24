'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit, Video, Star, CheckSquare, Square, XSquare, Copy, Sparkles, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { getHighlights, deleteHighlight, bulkDeleteHighlights, duplicateHighlight } from '@/app/actions';
import { Database } from '@/types/database.types';
import { useRouter } from 'next/navigation';

type SortOption = 'newest' | 'oldest' | 'title';

type HighlightItem = Database['public']['Tables']['highlights']['Row'];

const btnBase = 'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const primaryBtn = `flex items-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${btnBase}`;
const secondaryBtn = `flex items-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`;

export default function HighlightsPage() {
    const router = useRouter();
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getHighlights();
            setHighlights((data || []) as HighlightItem[]);
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
        let list = [...highlights];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(h => (h.title || '').toLowerCase().includes(q));
        }
        switch (sortBy) {
            case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
            case 'title': list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
            default: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return list;
    }, [highlights, search, sortBy]);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this highlight?')) return;
        await deleteHighlight(id);
        loadData();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateHighlight(id);
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

    const selectAll = () => setSelectedIds(new Set(filtered.map(h => h.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected highlights?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteHighlights(Array.from(selectedIds));
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Highlights</h1>
                    <p className="text-xs md:text-sm text-inkmute mt-1">
                        {loading ? '…' : `${filtered.length} of ${highlights.length} items`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={selectMode
                            ? `flex items-center gap-2 bg-accentsoft border border-accentline text-accentstrong rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`
                            : secondaryBtn}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'إلغاء' : 'تحديد'}</span>
                    </button>

                    <Link href="/highlights/auto-import" className={secondaryBtn}>
                        <Sparkles className="w-4 h-4" />
                        <span>جلب تلقائي</span>
                    </Link>

                    <Link href="/highlights/new" className={primaryBtn}>
                        <Plus className="w-4 h-4" />
                        <span>إضافة ملخص</span>
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
                        placeholder="ابحث بالعنوان…"
                        className={`w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-9 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${btnBase}`}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkmute hover:text-ink transition-colors"
                        >
                            <XSquare className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={`appearance-none bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-8 py-2 text-sm text-ink outline-none transition-colors cursor-pointer w-full sm:w-auto ${btnBase}`}
                    >
                        <option value="newest">الأحدث أولاً</option>
                        <option value="oldest">الأقدم أولاً</option>
                        <option value="title">العنوان A → Z</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                </div>
            </div>

            {/* Bulk bar */}
            {selectMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-surface border border-line rounded-xl">
                    <span className="text-sm text-inksoft">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className={`text-xs font-medium text-accent hover:text-accentstrong transition-colors ${btnBase}`}>Select All</button>
                    <button onClick={deselectAll} className={`text-xs font-medium text-inkmute hover:text-ink transition-colors ${btnBase}`}>Deselect All</button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className={`flex items-center gap-2 bg-danger hover:bg-red-600 text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${btnBase}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-surface2 rounded-2xl overflow-hidden animate-pulse">
                            <div className="h-48" />
                            <div className="p-5 space-y-3">
                                <div className="h-4 bg-line rounded w-3/4" />
                                <div className="h-3 bg-line rounded w-1/2" />
                                <div className="h-9 bg-line rounded-lg mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : highlights.length === 0 ? (
                <div className="text-center py-20 bg-surface border border-line rounded-2xl">
                    <Video className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft mb-1">No highlights found</p>
                    <p className="text-xs text-inkmute mb-4">Click &quot;Add Highlight&quot; to create one</p>
                    <Link href="/highlights/new" className={`inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accentstrong transition-colors ${btnBase}`}>
                        <Plus className="w-4 h-4" /> Add your first highlight
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-surface border border-line rounded-2xl">
                    <Video className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft mb-3">No matching highlights</p>
                    <button onClick={() => setSearch('')} className={`text-sm font-medium text-accent hover:text-accentstrong transition-colors ${btnBase}`}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filtered.map((item) => {
                        type ImgLike = { url?: string; secure_url?: string };
                        const img = item.image;
                        const firstImg: ImgLike | undefined =
                            Array.isArray(img) ? (img as unknown as ImgLike[])[0] : undefined;
                        const singleImg: ImgLike | null =
                            !Array.isArray(img) && img && typeof img === 'object' ? (img as unknown as ImgLike) : null;
                        const imgUrl: string | null =
                            typeof img === 'string'
                                ? img
                                : (firstImg?.secure_url || firstImg?.url || singleImg?.secure_url || singleImg?.url || null);

                        return (
                            <div key={item.id} className="relative group">
                                {selectMode && (
                                    <button
                                        onClick={() => toggleSelect(item.id)}
                                        aria-label="Toggle selection"
                                        className={`absolute top-3 left-3 z-30 p-1 rounded-lg bg-surface border border-line shadow-sm ${btnBase}`}
                                    >
                                        {selectedIds.has(item.id) ? (
                                            <CheckSquare className="w-5 h-5 text-accent" />
                                        ) : (
                                            <Square className="w-5 h-5 text-inkmute" />
                                        )}
                                    </button>
                                )}
                                <div className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-200 ${selectedIds.has(item.id)
                                    ? 'border-accent bg-accentsoft/50'
                                    : 'border-line hover:border-accent/40 hover:shadow-cardhover'}`}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-48 bg-surface2 overflow-hidden">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={item.title || 'Highlight'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video className="w-10 h-10 text-inkmute/40" />
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3 flex gap-1.5">
                                            {item.is_premium && (
                                                <span className="inline-flex items-center gap-1 bg-warnsoft text-warn text-xs font-medium px-2 py-1 rounded-md">
                                                    <Star className="w-3 h-3 fill-current" /> Premium
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${item.is_published !== false ? 'bg-accentsoft text-accentstrong' : 'bg-infosoft text-info'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.is_published !== false ? 'bg-accent' : 'bg-info'}`} />
                                                {item.is_published !== false ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 md:p-5">
                                        <h3 className="font-semibold text-ink text-base mb-1.5 line-clamp-2">{item.title}</h3>

                                        <div className="flex items-center gap-2 text-xs text-inkmute mb-4">
                                            <Video className="w-3.5 h-3.5" />
                                            <span>Video Highlight</span>
                                            <span>•</span>
                                            <span className="tabular-nums">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-line">
                                            <Link
                                                href={`/highlights/${item.id}`}
                                                className={`flex-1 inline-flex items-center justify-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`}
                                            >
                                                <Edit className="w-4 h-4" /> Edit
                                            </Link>

                                            <button
                                                onClick={(e) => handleDuplicate(e, item.id)}
                                                className={`p-2 rounded-lg text-inkmute hover:text-accent hover:bg-accentsoft transition-colors ${btnBase}`}
                                                title="Duplicate"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className={`p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${btnBase}`}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
