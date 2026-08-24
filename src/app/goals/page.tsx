'use client';

import { useEffect, useState } from 'react';
import { getGoals, deleteGoal, bulkDeleteGoals, duplicateGoal } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Video, Calendar, Star, CheckSquare, Square, XSquare, Copy, Search, X, ChevronDown, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Goal = Database['public']['Tables']['goals']['Row'];

interface ImageAsset {
    secure_url?: string;
    url?: string;
}

export default function GoalsPage() {
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [query, setQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getGoals();
            setGoals(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getTime = (g: Goal) => (g.time ? new Date(g.time).getTime() : g.id);

    const displayed = goals
        .filter((g) => !query || (g.title || '').toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (sortOrder === 'newest' ? getTime(b) - getTime(a) : getTime(a) - getTime(b)));

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        if (!confirm('Delete this goal?')) return;
        await deleteGoal(id);
        loadData();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateGoal(id);
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

    const selectAll = () => setSelectedIds(new Set(displayed.map(g => g.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected goals?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteGoals(Array.from(selectedIds));
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
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Goals</h1>
                    <p className="text-sm text-inksoft mt-1">Manage latest goal highlights.</p>
                    <p className="text-xs md:text-sm text-inkmute mt-1 tabular-nums">
                        {displayed.length} of {goals.length} items
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                            selectMode
                                ? 'bg-accentsoft border border-accentline text-accentstrong'
                                : 'bg-surface border border-line hover:bg-surface2 text-ink'
                        }`}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link
                        href="/goals/new"
                        className="flex items-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Goal</span>
                    </Link>
                </div>
            </div>

            {!loading && goals.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search goals..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-9 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-inkmute hover:text-ink hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative sm:w-44">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                            aria-label="Sort goals"
                            className="w-full appearance-none bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-3 pr-9 py-2 text-sm text-ink outline-none transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    </div>
                </div>
            )}

            {selectMode && (
                <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-surface border border-line rounded-xl">
                    <span className="text-sm text-inksoft tabular-nums">{selectedIds.size} selected</span>
                    <button
                        onClick={selectAll}
                        className="text-xs font-medium text-accent hover:text-accentstrong px-2 py-1 rounded-lg hover:bg-accentsoft transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="text-xs font-medium text-inksoft hover:text-ink px-2 py-1 rounded-lg hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                        Deselect All
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className="flex items-center gap-2 bg-danger hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-surface2 rounded-2xl animate-pulse p-4 md:p-5">
                            <div className="h-40 rounded-xl bg-canvas/70 mb-4"></div>
                            <div className="h-4 w-3/4 rounded bg-canvas/70 mb-2"></div>
                            <div className="h-3 w-1/2 rounded bg-canvas/70"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {displayed.map((goal) => {
                        let imgUrl: string | null = null;
                        if (goal.image) {
                            if (typeof goal.image === 'string') imgUrl = goal.image;
                            else if (Array.isArray(goal.image) && goal.image[0]) imgUrl = (goal.image[0] as ImageAsset).secure_url || (goal.image[0] as ImageAsset).url || null;
                            else if ((goal.image as ImageAsset).secure_url) imgUrl = (goal.image as ImageAsset).secure_url || null;
                            else if ((goal.image as ImageAsset).url) imgUrl = (goal.image as ImageAsset).url || null;
                        }

                        return (
                            <div key={goal.id} className="relative">
                                {selectMode && (
                                    <button
                                        onClick={() => toggleSelect(goal.id)}
                                        aria-label={selectedIds.has(goal.id) ? 'Deselect goal' : 'Select goal'}
                                        className="absolute top-4 left-4 z-30 p-1 rounded-lg bg-surface/90 shadow-card transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                    >
                                        {selectedIds.has(goal.id) ? (
                                            <CheckSquare className="w-5 h-5 text-accent" />
                                        ) : (
                                            <Square className="w-5 h-5 text-inkmute" />
                                        )}
                                    </button>
                                )}
                                <Link
                                    href={selectMode ? '#' : `/goals/${goal.id}`}
                                    onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(goal.id); } : undefined}
                                    className={`block group bg-surface border rounded-2xl p-4 md:p-5 transition-all duration-200 ${!goal.is_published ? 'opacity-75 grayscale-[0.3]' : ''} ${selectedIds.has(goal.id)
                                        ? 'border-accent bg-accentsoft/50'
                                        : 'border-line hover:border-accent/40 hover:shadow-cardhover'
                                        }`}
                                >
                                    <div className="h-40 bg-surface2 rounded-xl relative overflow-hidden flex items-center justify-center">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={goal.title || 'Goal Image'} className="w-full h-full object-cover transition duration-200 group-hover:scale-105" />
                                        ) : (
                                            <Video className="w-10 h-10 text-inkmute/40" />
                                        )}
                                        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                                            {goal.is_premium && (
                                                <span className="inline-flex items-center gap-1 bg-warnsoft text-warn border border-warn/30 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                                    <Star className="w-3 h-3 fill-current" /> VIP
                                                </span>
                                            )}
                                            {goal.is_published ? (
                                                <span className="inline-flex items-center gap-1.5 bg-successsoft text-success border border-success/30 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center bg-infosoft text-info border border-info/30 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                                    DRAFT
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <h3 className="font-semibold text-ink text-base truncate">{goal.title || 'Untitled Goal'}</h3>
                                        <div className="flex items-center gap-1.5 text-inkmute text-xs mt-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {goal.time ? new Date(goal.time).toLocaleDateString() : 'No Date'}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-line">
                                            <span className="text-xs text-inkmute tabular-nums">ID: {goal.id}</span>
                                            {!selectMode && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleDuplicate(e, goal.id)}
                                                        className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                        title="Duplicate as Draft"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, goal.id)}
                                                        className="p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors z-20 relative focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                                        title="Delete Goal"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )
                    })}
                </div>
            )}
            {!loading && goals.length === 0 && (
                <div className="text-center py-16 bg-surface border border-line rounded-2xl">
                    <Trophy className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft">No goals found. Add one to get started.</p>
                    <Link href="/goals/new" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-accent hover:text-accentstrong transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none rounded-lg px-2 py-1">
                        <Plus className="w-4 h-4" /> Add your first goal
                    </Link>
                </div>
            )}
            {!loading && goals.length > 0 && displayed.length === 0 && (
                <div className="text-center py-16 bg-surface border border-line rounded-2xl">
                    <Search className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft">No goals found. Add one to get started.</p>
                    <button
                        onClick={() => setQuery('')}
                        className="mt-4 text-sm font-medium text-accent hover:text-accentstrong transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none rounded-lg px-2 py-1"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </div>
    );
}
