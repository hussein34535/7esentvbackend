'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNews } from '@/app/actions';
import { Save, ArrowLeft, Newspaper, Link as LinkIcon, Star } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

export default function NewNews() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const linkJson = { url: url };

            const result = await createNews({
                title,
                link: linkJson,
                image: image ? [image] : null,
                is_premium: isPremium,
                is_published: isPublished
            });

            if (result.success) {
                router.push('/news');
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
                    <Link href="/news" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Add New Article</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Image Upload */}
                        <Uploader label="Article Image" value={image} onChange={setImage} />

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Headline</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Transfer Rumors..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition"
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Source / Link URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="url"
                                    placeholder="https://test.com/article"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:border-orange-500 outline-none transition font-mono text-sm"
                                    value={url} onChange={e => setUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Premium Toggle */}
                        <div className="pt-2 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer" onClick={() => setIsPremium(!isPremium)}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                    {isPremium && <Star className="w-3 h-3 text-black fill-current" />}
                                </div>
                                <div>
                                    <div className="font-medium text-white flex items-center gap-2">Premium</div>
                                    <div className="text-xs text-slate-500">Subscribers only</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer" onClick={() => setIsPublished(!isPublished)}>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="font-medium text-white flex items-center gap-2">
                                        {isPublished ? 'Published' : 'Draft'}
                                    </div>
                                    <div className="text-xs text-slate-500">{isPublished ? 'Visible to all' : 'Hidden'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Article</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
