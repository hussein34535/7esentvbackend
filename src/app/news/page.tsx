'use client';

import { useEffect, useState } from 'react';
import { getNews, deleteNews } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Newspaper, Calendar, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type NewsItem = Database['public']['Tables']['news']['Row'];

export default function NewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

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
        e.preventDefault(); // Prevent navigation
        if (!confirm('Delete this article?')) return;
        await deleteNews(id);
        loadData();
        router.refresh();
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

                <Link href="/news/new" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition">
                    <Plus className="w-4 h-4" />
                    <span>Add Article</span>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => {
                        // Helper to get image URL safely
                        const imgUrl = Array.isArray(item.image) && item.image[0]?.url ? item.image[0].url : null;

                        return (
                            <Link href={`/news/${item.id}`} key={item.id} className={`block group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition relative ${!item.is_published ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                {/* Premium Badge */}
                                {item.is_premium && (
                                    <div className="absolute top-2 right-2 z-10 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> VIP
                                    </div>
                                )}
                                {/* Draft Badge */}
                                {!item.is_published && (
                                    <div className="absolute top-2 left-2 z-10 bg-slate-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow-lg border border-slate-500">
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
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="text-red-500 hover:bg-red-500/10 p-2 rounded transition z-20 relative"
                                            title="Delete Article"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
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
