'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory } from '@/app/actions';
import { Save, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';

export default function NewCategory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createCategory({
                name,
                is_premium: isPremium,
                sort_order: sortOrder
            });

            if (result.success) {
                router.push('/categories');
                router.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/categories" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">New Category</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Category Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Sports, News..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-purple-500 outline-none transition"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Sort Order</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-purple-500 outline-none transition"
                                value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-slate-500 mt-1">Lower numbers appear first.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-700 cursor-pointer" onClick={() => setIsPremium(!isPremium)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                {isPremium && <Star className="w-3 h-3 text-black fill-current" />}
                            </div>
                            <div>
                                <div className="font-medium text-white">Premium Content</div>
                                <div className="text-xs text-slate-500">Access restricted to subscribers only.</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Category</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
