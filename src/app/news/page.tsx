'use client';

import { useEffect, useState } from 'react';
import { getNews, deleteNews, bulkDeleteNews, duplicateNews } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Newspaper, Calendar, Star, CheckSquare, Square, XSquare, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type NewsItem = Database['public']['Tables']['news']['Row'];

export default function NewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const selectAll = () => setSelectedIds(new Set(news.map(n => n.id)));
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                        News
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage latest sports news.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link href="/news/new" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition">
                        <Plus className="w-4 h-4" />
                        <span>Add Article</span>
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className="text-xs text-orange-400 hover:text-orange-300">Select All</button>
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
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => {
                        let imgUrl = null;
                        if (item.image) {
                            if (typeof item.image === 'string') imgUrl = item.image;
                            else if (Array.isArray(item.image) && item.image[0]) imgUrl = (item.image[0] as any).secure_url || (item.image[0] as any).url;
                            else if ((item.image as any).secure_url) imgUrl = (item.image as any).secure_url;
                            else if ((item.image as any).url) imgUrl = (item.image as any).url;
                        }

                        return (
                            <div key={item.id} className="relative">
                                {selectMode && (
                                    <button
                                        onClick={() => toggleSelect(item.id)}
                                        className="absolute top-2 left-2 z-30 p-1 rounded bg-slate-800/80"
                                    >
                                        {selectedIds.has(item.id) ? (
                                            <CheckSquare className="w-5 h-5 text-orange-400" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                )}
                                <Link
                                    href={selectMode ? '#' : `/news/${item.id}`}
                                    onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(item.id); } : undefined}
                                    className={`block group bg-slate-900 border rounded-xl overflow-hidden transition relative ${!item.is_published ? 'opacity-60 grayscale-[0.5]' : ''} ${selectedIds.has(item.id)
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-slate-800 hover:border-orange-500/50'
                                        }`}
                                >
                                    {item.is_premium && (
                                        <div className="absolute top-2 right-2 z-10 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" /> VIP
                                        </div>
                                    )}
                                    {!item.is_published && (
                                        <div className="absolute top-2 left-10 z-10 bg-slate-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow-lg border border-slate-500">
                                            DRAFT
                                        </div>
                                    )}

                                    <div className="h-40 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={item.title || 'News Image'} className="w-full h-full object-cover transition group-hover:scale-105" />
                                        ) : (
                                            <Newspaper className="w-10 h-10 text-slate-700" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-2 truncate group-hover:text-orange-400 transition">{item.title || 'Untitled'}</h3>
                                        <div className="flex items-center text-slate-500 text-xs mb-4">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {item.date ? new Date(item.date).toLocaleDateString() : 'No Date'}
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                            <span className="text-xs text-slate-500 font-mono">ID: {item.id}</span>
                                            {!selectMode && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleDuplicate(e, item.id)}
                                                        className="text-orange-500 hover:bg-orange-500/10 p-2 rounded transition z-20 relative"
                                                        title="Duplicate as Draft"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, item.id)}
                                                        className="text-red-500 hover:bg-red-500/10 p-2 rounded transition z-20 relative"
                                                        title="Delete Article"
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
            {!loading && news.length === 0 && (
                <div className="text-center p-10 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    No articles found.
                </div>
            )}
        </div>
    );
}
