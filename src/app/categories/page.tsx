'use client';

import { useEffect, useState } from 'react';
import { getCategories, deleteCategory } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Edit, Hash, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Category = Database['public']['Tables']['channel_categories']['Row'];

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
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

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this category?')) return;
        await deleteCategory(id);
        loadData();
        router.refresh();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Categories
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Organize content and set premium access.</p>
                </div>

                <Link href="/categories/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <>
                    {categories.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                            No categories found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((cat) => (
                                <Link href={`/categories/${cat.id}`} key={cat.id} className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition relative block">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 group-hover:border-purple-500/30 transition">
                                            <Hash className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div className="flex gap-2">
                                            {cat.is_premium && (
                                                <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-current" /> VIP
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(e, cat.id)}
                                                className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition z-20 relative"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-xl mb-1 group-hover:text-purple-400 transition">{cat.name}</h3>
                                    <p className="text-slate-500 text-sm">Sort Order: {cat.sort_order}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
