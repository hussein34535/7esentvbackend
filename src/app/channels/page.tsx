'use client';

import { useEffect, useMemo, useState } from 'react';
import { getChannelsWithCategories, deleteChannel, bulkDeleteChannels, duplicateChannel, getCategories, ChannelWithCategories } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Tv, Hash, CheckSquare, Square, XSquare, Copy, Search, ArrowUpDown, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                        Channels
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">
                        {loading ? '...' : `${filtered.length} of ${channels.length} channels`}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition text-xs md:text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {selectMode ? <XSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link href="/channels/new" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition cursor-pointer text-xs md:text-sm">
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Add Channel</span>
                    </Link>
                </div>
            </div>

            {/* Toolbar: Search + Sort */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or ID..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg pl-9 pr-8 py-2 text-sm outline-none transition placeholder:text-slate-600"
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
                        className="appearance-none bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg pl-9 pr-8 py-2 text-sm outline-none transition cursor-pointer w-full sm:w-auto"
                    >
                        <option value="id-asc">Default order</option>
                        <option value="name-asc">Name A → Z</option>
                        <option value="name-desc">Name Z → A</option>
                        <option value="newest">Newest first</option>
                    </select>
                </div>
            </div>

            {/* Category filter chips */}
            {categories.length > 0 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-700">
                    <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${categoryFilter === null
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                            }`}
                    >
                        All ({channels.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${categoryFilter === cat.id
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    {uncategorizedCount > 0 && (
                        <button
                            onClick={() => setCategoryFilter(categoryFilter === UNCATEGORIZED ? null : UNCATEGORIZED)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${categoryFilter === UNCATEGORIZED
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-slate-900 border-red-900/60 text-red-400/80 hover:border-red-500 hover:text-red-300'
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
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className="text-xs text-emerald-400 hover:text-emerald-300">Select All</button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 md:h-40 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <>
                    {channels.length === 0 ? (
                        <div className="p-8 md:p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-sm md:text-base">
                            No channels found.
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 md:p-10 text-center bg-slate-900 rounded-xl border border-slate-800">
                            <Tv className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm md:text-base mb-1">No matching channels</p>
                            <button onClick={() => { setSearch(''); setCategoryFilter(null); }} className="text-emerald-400 hover:text-emerald-300 text-xs underline">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                            {paged.map((channel) => (
                                <div key={channel.id} className="relative">
                                    {selectMode && (
                                        <button
                                            onClick={() => toggleSelect(channel.id)}
                                            className="absolute top-2 left-2 z-30 p-1 rounded bg-slate-800/80"
                                        >
                                            {selectedIds.has(channel.id) ? (
                                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <Square className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                    <Link
                                        href={selectMode ? '#' : `/channels/${channel.id}`}
                                        onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(channel.id); } : undefined}
                                        className={`group bg-slate-900 border rounded-xl p-3 md:p-5 transition relative block h-full ${selectedIds.has(channel.id)
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-800 hover:border-emerald-500/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2 md:mb-4">
                                            <div className="bg-slate-950 p-2 md:p-3 rounded-lg border border-slate-800 group-hover:border-emerald-500/30 transition">
                                                <Tv className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                                            </div>
                                            {!selectMode && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleDuplicate(e, channel.id)}
                                                        className="text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 p-1.5 md:p-2 rounded transition z-20 relative"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, channel.id)}
                                                        className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 md:p-2 rounded transition z-20 relative"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1 group-hover:text-emerald-400 transition truncate">{channel.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 font-mono mb-2 md:mb-3">
                                            <Hash className="w-2.5 h-2.5 md:w-3 md:h-3" /> ID: {channel.id}
                                        </div>

                                        {channel.categories && channel.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {channel.categories.map((cat) => (
                                                    <span key={cat.id} className="text-[10px] md:text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded-full truncate max-w-full">
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
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                                .map((pg, idx, arr) => (
                                    <span key={pg} className="flex items-center gap-2">
                                        {idx > 0 && arr[idx - 1] !== pg - 1 && <span className="text-slate-600 text-xs">…</span>}
                                        <button
                                            onClick={() => setPage(pg)}
                                            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition border ${pg === page
                                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-white'
                                                }`}
                                        >
                                            {pg}
                                        </button>
                                    </span>
                                ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
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
