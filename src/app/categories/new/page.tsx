'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory } from '@/app/actions';
import { Save, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

export default function NewCategory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createCategory({
                name,
                is_premium: isPremium,
                sort_order: sortOrder,
                image
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
        <div>
            <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Link href="/categories" aria-label="Back to categories" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">New Category</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-5">
                    <Uploader
                        label="Category Icon / Image"
                        value={image}
                        onChange={(val) => { if (typeof val !== 'string') setImage(val); }}
                    />

                    <div>
                        <label htmlFor="category-name" className="block text-sm font-medium text-ink mb-1.5">Category Name</label>
                        <input
                            id="category-name"
                            required
                            type="text"
                            placeholder="e.g. Sports, News..."
                            className="w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="sort-order" className="block text-sm font-medium text-ink mb-1.5">Sort Order</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none flex items-center justify-center">#</span>
                            <input
                                id="sort-order"
                                type="number"
                                placeholder="0"
                                className="w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] pl-8 pr-3 py-2 text-sm text-ink tabular-nums outline-none transition-colors"
                                value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <p className="text-xs text-inkmute mt-1.5">Lower numbers appear first.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsPremium(!isPremium)}
                        aria-pressed={isPremium}
                        className="w-full flex items-center justify-between gap-4 p-4 bg-surface2/50 rounded-xl border border-line hover:border-inkmute/30 transition-colors text-left focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none"
                    >
                        <div>
                            <div className="font-medium text-sm text-ink">Premium Content</div>
                            <div className="text-xs text-inkmute mt-0.5">Access restricted to subscribers only.</div>
                        </div>
                        <Star className={`w-5 h-5 shrink-0 transition-colors ${isPremium ? 'text-warn fill-current' : 'text-inkmute/40'}`} />
                    </button>

                    <div className="pt-3 border-t border-line flex justify-end gap-2">
                        <Link href="/categories" className="px-4 py-2 rounded-[10px] text-sm font-medium bg-surface border border-line hover:bg-surface2 text-ink transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 btn-gradient-red text-white px-6 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Category</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
