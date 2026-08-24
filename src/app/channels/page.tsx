'use client';

import { useEffect, useMemo, useState } from 'react';
import { getChannelsWithCategories, deleteChannel, bulkDeleteChannels, duplicateChannel, getCategories, ChannelWithCategories } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Tv, Hash, CheckSquare, Square, XSquare, Copy, Search, X, ChevronDown, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Category = Database['public']['Tables']['channel_categories']['Row'];

type SortOption = 'id-asc' | 'name-asc' | 'name-desc' | 'newest';

const PAGE_SIZE = 24;
const UNCATEGORIZED = -1;

export default function ChannelsPage() {
    const router = useRouter();
    const [channels, setChannels] = useState<ChannelWithCategories[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('id-asc');
    const [page, setPage] = useState(1);

    const uncategorizedCount = useMemo(() => channels.filter(c => !c.categories || c.categories.length === 0).length, [channels]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [chData, catData] = await Promise.all([getChannelsWithCategories(), getCategories()]);
            setChannels(chData || []);
            setCategories(catData || []);
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
        let list = [...channels];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || String(c.id).includes(q));
        }
        if (categoryFilter === UNCATEGORIZED) {
            list = list.filter(c => !c.categories || c.categories.length === 0);
        } else if (categoryFilter !== null) {
            list = list.filter(c => c.categories?.some(cat => cat.id === categoryFilter));
        }
        switch (sortBy) {
            case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'newest': list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
            default: list.sort((a, b) => a.id - b.id);
        }
        return list;
    }, [channels, search, categoryFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const paged = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );

    // Reset to first page whenever filters change
    useEffect(() => { setPage(1); }, [search, categoryFilter, sortBy]);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this channel?')) return;
        await deleteChannel(id);
        loadData();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateChannel(id);
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
        if (!confirm(`Delete ${selectedIds.size} selected channels?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteChannels(Array.from(selectedIds));
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
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Channels</h1>
                    <p className="text-xs md:text-sm text-inkmute mt-1">
                        {loading ? '...' : `${filtered.length} of ${channels.length} channels`}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none border ${selectMode ? 'bg-accentsoft border-accentline text-accentstrong' : 'bg-surface border-line hover:bg-surface2 text-ink'}`}
                    >
                        {selectMode ? <XSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link href="/channels/new" className="flex items-center gap-2 btn-gradient-red text-white px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Add Channel</span>
                    </Link>
                </div>
            </div>

            {/* Toolbar: Search + Sort */}
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
                        <option value="id-asc">Default order</option>
                        <option value="name-asc">Name A → Z</option>
                        <option value="name-desc">Name Z → A</option>
                        <option value="newest">Newest first</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                </div>
            </div>

            {/* Category filter chips */}
            {categories.length > 0 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    <Tag className="w-3.5 h-3.5 text-inkmute shrink-0" />
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${categoryFilter === null
                            ? 'bg-accent border-accent text-white'
                            : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                            }`}
                    >
                        All ({channels.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${categoryFilter === cat.id
                                ? 'bg-accent border-accent text-white'
                                : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    {uncategorizedCount > 0 && (
                        <button
                            onClick={() => setCategoryFilter(categoryFilter === UNCATEGORIZED ? null : UNCATEGORIZED)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${categoryFilter === UNCATEGORIZED
                                ? 'bg-danger border-danger text-white'
                                : 'bg-dangersoft border-danger/20 text-danger hover:border-danger/50'
                                }`}
                        >
                            <XSquare className="w-3 h-3" />
                            No Category ({uncategorizedCount})
                        </button>
                    )}
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectMode && (
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
                    {[1, 2, 3].map(i => <div key={i} className="h-32 md:h-40 bg-surface2 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    {channels.length === 0 ? (
                        <div className="p-8 md:p-10 text-center bg-surface rounded-2xl border border-line">
                            <Tv className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                            <p className="text-sm md:text-base text-inksoft">No channels found.</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 md:p-10 text-center bg-surface rounded-2xl border border-line">
                            <Tv className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                            <p className="text-inksoft text-sm md:text-base mb-2">No matching channels</p>
                            <button onClick={() => { setSearch(''); setCategoryFilter(null); }} className="text-accentstrong hover:underline text-xs font-medium focus-visible:outline-none">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {paged.map((channel) => (
                                <div key={channel.id} className="relative">
                                    {selectMode && (
                                        <button
                                            onClick={() => toggleSelect(channel.id)}
                                            aria-label="Toggle selection"
                                            className="absolute top-3 left-3 z-30 p-1 rounded-md bg-surface border border-line shadow-card transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                        >
                                            {selectedIds.has(channel.id) ? (
                                                <CheckSquare className="w-5 h-5 text-accent" />
                                            ) : (
                                                <Square className="w-5 h-5 text-inkmute" />
                                            )}
                                        </button>
                                    )}
                                    <Link
                                        href={selectMode ? '#' : `/channels/${channel.id}`}
                                        onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(channel.id); } : undefined}
                                        className={`group bg-surface border rounded-2xl p-4 md:p-5 transition-all duration-200 relative block h-full ${selectedIds.has(channel.id)
                                            ? 'border-accent/70 bg-accentsoft/40'
                                            : 'border-line hover:border-inkmute/40 hover:shadow-cardhover hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3 md:mb-4">
                                            <div className="bg-surface2 p-2 md:p-2.5 rounded-xl border border-line transition-colors group-hover:border-inkmute/30">
                                                <Tv className="w-4.5 h-4.5 md:w-5 md:h-5 text-inkmute" />
                                            </div>
                                            {!selectMode && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleDuplicate(e, channel.id)}
                                                        className="text-inkmute hover:text-ink hover:bg-surface2 p-1.5 md:p-2 rounded-lg transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, channel.id)}
                                                        className="text-inkmute hover:text-danger hover:bg-dangersoft p-1.5 md:p-2 rounded-lg transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-semibold text-sm md:text-base text-ink mb-0.5 md:mb-1 truncate">{channel.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-inkmute tabular-nums mb-2 md:mb-3">
                                            <Hash className="w-2.5 h-2.5 md:w-3 md:h-3" /> ID: {channel.id}
                                        </div>

                                        {channel.categories && channel.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {channel.categories.map((cat) => (
                                                    <span key={cat.id} className="text-[10px] md:text-[11px] bg-surface2 text-inksoft border border-line px-2 py-0.5 rounded-full truncate max-w-full">
                                                        {cat.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                aria-label="Previous page"
                                className="p-2 rounded-[10px] bg-surface border border-line text-inksoft hover:bg-surface2 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                                .map((pg, idx, arr) => (
                                    <span key={pg} className="flex items-center gap-2">
                                        {idx > 0 && arr[idx - 1] !== pg - 1 && <span className="text-inkmute text-xs">…</span>}
                                        <button
                                            onClick={() => setPage(pg)}
                                            className={`min-w-[36px] h-9 px-2 rounded-[10px] text-sm font-medium transition-all duration-200 border focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${pg === page
                                                ? 'bg-accent border-accent text-white shadow-sm'
                                                : 'bg-surface border-line text-inksoft hover:bg-surface2 hover:text-ink'
                                                }`}
                                        >
                                            {pg}
                                        </button>
                                    </span>
                                ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                aria-label="Next page"
                                className="p-2 rounded-[10px] bg-surface border border-line text-inksoft hover:bg-surface2 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
