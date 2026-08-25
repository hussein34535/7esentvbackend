'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGoal } from '@/app/actions';
import { Save, ArrowLeft, Link as LinkIcon, Star, X } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

export default function NewGoal() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [links, setLinks] = useState<{ name: string, url: string }[]>([{ name: 'Server 1', url: '' }]);
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);

    const addLink = () => setLinks([...links, { name: `Server ${links.length + 1}`, url: '' }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
    const updateLink = (index: number, field: 'name' | 'url', value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createGoal({
                title,
                url: links,
                image: image ? [image] : null,
                is_premium: isPremium,
                is_published: isPublished
            });

            if (result.success) {
                router.push('/goals');
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
            <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Link
                        href="/goals"
                        aria-label="Back to goals"
                        className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Add New Goal</h1>
                        <p className="text-sm text-inksoft mt-0.5">Create a new goal highlight clip.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-2">
                        <Uploader label="Thumbnail / Image" value={image} onChange={(val) => { if (typeof val !== 'string') setImage(val); }} />
                    </section>

                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-4">
                        <h2 className="text-sm font-semibold text-ink">Details</h2>
                        <div>
                            <label htmlFor="goal-title" className="block text-sm font-medium text-ink mb-1.5">Goal Title</label>
                            <input
                                id="goal-title"
                                required
                                type="text"
                                placeholder="e.g. Salah Goal vs United"
                                className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div
                                role="switch"
                                aria-checked={isPremium}
                                tabIndex={0}
                                onClick={() => setIsPremium(!isPremium)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPremium(!isPremium); } }}
                                className={`flex items-center gap-3 p-3.5 md:p-4 bg-surface2 border rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isPremium ? 'border-accent/60' : 'border-line hover:border-inkmute/40'}`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isPremium ? 'bg-accent border-accent' : 'border-inkmute/50 bg-surface'}`}>
                                    {isPremium && <Star className="w-3 h-3 text-surface fill-current" />}
                                </div>
                                <div>
                                    <div className="font-medium text-ink text-sm flex items-center gap-2">Premium</div>
                                    <div className="text-xs text-inksoft">Subscribers only</div>
                                </div>
                            </div>

                            <div
                                role="switch"
                                aria-checked={isPublished}
                                tabIndex={0}
                                onClick={() => setIsPublished(!isPublished)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPublished(!isPublished); } }}
                                className={`flex items-center gap-3 p-3.5 md:p-4 bg-surface2 border rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isPublished ? 'border-accent/60' : 'border-line hover:border-inkmute/40'}`}
                            >
                                <div className={`w-10 h-6 rounded-full p-1 shrink-0 transition-colors ${isPublished ? 'bg-gradient-red' : 'bg-inkmute/40'}`}>
                                    <div className={`w-4 h-4 bg-surface rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="font-medium text-ink text-sm flex items-center gap-2">
                                        {isPublished ? 'Published' : 'Draft'}
                                    </div>
                                    <div className="text-xs text-inksoft">{isPublished ? 'Visible to all' : 'Hidden'}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-ink">Video Links (Servers)</h2>
                            <button
                                type="button"
                                onClick={addLink}
                                className="inline-flex items-center gap-1 text-xs font-medium text-accentstrong bg-accentsoft hover:bg-accentline/70 px-3 py-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                                + Add Server
                            </button>
                        </div>

                        {links.map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-surface2 border border-line p-3 rounded-xl">
                                <div className="flex-1 space-y-2">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Server Name"
                                        aria-label={`Server ${idx + 1} name`}
                                        className="w-full bg-surface border border-line focus:border-accent/60 rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                        value={link.name} onChange={e => updateLink(idx, 'name', e.target.value)}
                                    />
                                    <div className="relative">
                                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                                        <input
                                            required
                                            type="url"
                                            placeholder="https://..."
                                            aria-label={`Server ${idx + 1} url`}
                                            className="w-full bg-surface border border-line focus:border-accent/60 rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors font-mono focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)}
                                        />
                                    </div>
                                </div>
                                {links.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLink(idx)}
                                        aria-label="Remove server"
                                        className="p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </section>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <Link
                            href="/goals"
                            className="bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 btn-gradient-red disabled:opacity-40 disabled:pointer-events-none text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Goal</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
