'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit, Video, Star, CheckSquare, Square, XSquare, Copy } from 'lucide-react';
import { getHighlights, deleteHighlight, bulkDeleteHighlights, duplicateHighlight } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function HighlightsPage() {
    const router = useRouter();
    const [highlights, setHighlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getHighlights();
            setHighlights(data || []);
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

    const selectAll = () => setSelectedIds(new Set(highlights.map(h => h.id)));
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
        <div className="font-sans text-white">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Highlights
                    </h1>
                    <p className="text-slate-400 mt-1">Manage game highlights and recaps</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link
                        href="/highlights/new"
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Highlight</span>
                    </Link>
                </div>
            </header>

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
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-2xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {highlights.map((item: any) => {
                        let imgUrl = null;
                        if (item.image) {
                            if (typeof item.image === 'string') imgUrl = item.image;
                            else if (Array.isArray(item.image) && item.image[0]) imgUrl = item.image[0].secure_url || item.image[0].url;
                            else if (item.image.secure_url) imgUrl = item.image.secure_url;
                            else if (item.image.url) imgUrl = item.image.url;
                        }

                        return (
                            <div key={item.id} className="relative group">
                                {selectMode && (
                                    <button
                                        onClick={() => toggleSelect(item.id)}
                                        className="absolute top-2 left-2 z-30 p-1 rounded bg-slate-800/80"
                                    >
                                        {selectedIds.has(item.id) ? (
                                            <CheckSquare className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                )}
                                <div className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition ${selectedIds.has(item.id) ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 hover:border-slate-700'}`}>
                                    {/* Image Area */}
                                    <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden">
                                        {imgUrl ? (
                                            <img
                                                src={imgUrl}
                                                alt={item.title || 'Highlight'}
                                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <Video className="w-12 h-12 text-slate-700" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />

                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {item.is_premium && (
                                                <div className="bg-amber-500/90 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3 h-3 fill-current" /> Premium
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item.title}</h3>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                            <Video className="w-4 h-4" />
                                            <span>Video Highlight</span>
                                            <span>•</span>
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                                            <Link
                                                href={`/highlights/${item.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                <Edit className="w-4 h-4" /> Edit
                                            </Link>

                                            <button
                                                onClick={(e) => handleDuplicate(e, item.id)}
                                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                                                title="Duplicate"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
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

            {!loading && highlights.length === 0 && (
                <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                    <Video className="w-12 h-12 mb-4 mx-auto opacity-50" />
                    <p className="text-lg">No highlights found</p>
                    <p className="text-sm">Click "Add Highlight" to create one</p>
                </div>
            )}
        </div>
    );
}
