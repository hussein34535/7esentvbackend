'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNews } from '@/app/actions';
import { Save, ArrowLeft, Link as LinkIcon, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

const FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none';
const INPUT_SKIN = `w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] px-4 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${FOCUS_RING}`;
const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 btn-gradient-red text-white rounded-[10px] px-5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${FOCUS_RING}`;
const BTN_SECONDARY = `inline-flex items-center justify-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`;

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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Link
                    href="/news"
                    aria-label="Back to full matches"
                    className={`p-2 rounded-lg bg-surface border border-line text-inksoft hover:text-ink hover:bg-surface2 transition-colors shrink-0 ${FOCUS_RING}`}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Add New Article</h1>
                    <p className="text-sm text-inksoft mt-1">Full-match replay details.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Content */}
                <section className="bg-surface border border-line rounded-2xl p-4 md:p-6 shadow-card space-y-5">
                    <h2 className="text-sm font-semibold text-ink">Content</h2>

                    <Uploader label="Article Image" value={image} onChange={(val) => { if (typeof val !== 'string') setImage(val); }} />

                    <div>
                        <label htmlFor="headline" className="block text-sm font-medium text-ink mb-1.5">Headline</label>
                        <input
                            id="headline"
                            required
                            type="text"
                            placeholder="e.g. Transfer Rumors..."
                            className={INPUT_SKIN}
                            value={title} onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="source-url" className="block text-sm font-medium text-ink mb-1.5">Source / Link URL</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                            <input
                                id="source-url"
                                required
                                type="url"
                                placeholder="https://test.com/article"
                                className={`${INPUT_SKIN} !pl-9`}
                                value={url} onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Visibility */}
                <section className="bg-surface border border-line rounded-2xl p-4 md:p-6 shadow-card space-y-3">
                    <h2 className="text-sm font-semibold text-ink mb-1">Visibility</h2>

                    <button
                        type="button"
                        onClick={() => setIsPremium(!isPremium)}
                        aria-pressed={isPremium}
                        className={`w-full flex items-center gap-3 p-4 border rounded-xl text-left transition-all duration-200 active:scale-[0.99] ${FOCUS_RING} ${isPremium
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'bg-surface2 border-line hover:border-inkmute/40'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isPremium ? 'bg-violet-500 border-violet-500' : 'border-inkmute/60 bg-surface'}`}>
                            {isPremium && <Star className="w-3 h-3 text-white fill-current" />}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-ink">Premium</div>
                            <div className="text-xs text-inksoft">Subscribers only</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPublished(!isPublished)}
                        aria-pressed={isPublished}
                        className={`w-full flex items-center gap-3 p-4 border rounded-xl text-left transition-all duration-200 active:scale-[0.99] ${FOCUS_RING} ${isPublished
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'bg-surface2 border-line hover:border-inkmute/40'
                            }`}
                    >
                        <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${isPublished ? 'bg-gradient-red' : 'bg-inkmute/40'}`}>
                            <div className={`w-5 h-5 bg-surface rounded-full shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-ink">{isPublished ? 'Published' : 'Draft'}</div>
                            <div className="text-xs text-inksoft">{isPublished ? 'Visible to all' : 'Hidden'}</div>
                        </div>
                    </button>
                </section>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 pt-1">
                    <Link href="/news" className={BTN_SECONDARY}>Cancel</Link>
                    <button type="submit" disabled={loading} className={`${BTN_PRIMARY} min-w-[150px]`}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Article
                            </>
                        )}
                    </button>
                </div>
            </form>
        </main>
    );
}
