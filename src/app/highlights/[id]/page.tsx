'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getHighlight, updateHighlight } from '@/app/actions';
import { Save, ArrowLeft, Link as LinkIcon, Star, X } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

const btnBase = 'focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none';
const inputSkin = `w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${btnBase}`;
const fieldLabel = 'block text-sm font-medium text-ink mb-1.5';
const cardSkin = 'bg-surface border border-line rounded-2xl p-4 md:p-5 space-y-4';

export default function EditHighlight() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [links, setLinks] = useState<{ name: string, url: string }[]>([{ name: 'Server 1', url: '' }]);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getHighlight(id);
            if (data) {
                setTitle(data.title || '');
                setIsPremium(data.is_premium || false);
                setIsPublished(data.is_published ?? true);

                // Handle Image
                if (data.image) {
                    if (Array.isArray(data.image)) setImage(data.image[0]);
                    else setImage(data.image);
                }

                // Handle Links (could be string or array)
                if (data.url) {
                    if (Array.isArray(data.url)) {
                        setLinks(data.url);
                    } else if (typeof data.url === 'object' && data.url.url) {
                        setLinks([{ name: 'Server 1', url: data.url.url }]);
                    } else if (typeof data.url === 'string') {
                        try {
                            const parsed = JSON.parse(data.url);
                            if (Array.isArray(parsed)) setLinks(parsed);
                            else if (parsed.url) setLinks([{ name: 'Server 1', url: parsed.url }]);
                            else setLinks([{ name: 'Server 1', url: data.url }]);
                        } catch {
                            setLinks([{ name: 'Server 1', url: data.url }]);
                        }
                    }
                }
            }
            setLoading(false);
        }
        load();
    }, [id]);

    const addLink = () => setLinks([...links, { name: `Server ${links.length + 1}`, url: '' }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
    const updateLink = (index: number, field: 'name' | 'url', value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const result = await updateHighlight(id, {
                title,
                url: links,
                image: image ? [image] : null,
                is_premium: isPremium,
                is_published: isPublished
            });

            if (result.success) {
                router.push('/highlights');
                router.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-4">
                <div className="h-8 w-56 bg-surface2 rounded-lg animate-pulse" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-surface2 rounded-2xl h-40 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Link href="/highlights" className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors shrink-0 ${btnBase}`} aria-label="Back to highlights">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Edit Highlight</h1>
                    <p className="text-sm text-inksoft mt-1">Update the highlight details below</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Details */}
                <section className={cardSkin}>
                    <Uploader
                        label="Cover Image"
                        value={image}
                        onChange={(val) => { if (typeof val !== 'string') setImage(val); }}
                    />

                    <div>
                        <label className={fieldLabel}>Highlight Title</label>
                        <input
                            required
                            type="text"
                            className={inputSkin}
                            value={title} onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                </section>

                {/* Servers */}
                <section className={cardSkin}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-ink">Video Links (Servers)</h2>
                        <button
                            type="button"
                            onClick={addLink}
                            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg bg-surface2 border border-line hover:border-inkmute/40 hover:text-ink text-inksoft transition-all duration-200 active:scale-[0.98] ${btnBase}`}
                        >
                            + Add Server
                        </button>
                    </div>

                    {links.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-surface2/50 p-3 rounded-xl border border-line">
                            <div className="flex-1 space-y-2">
                                <input
                                    required
                                    type="text"
                                    placeholder="Server Name"
                                    className={inputSkin}
                                    value={link.name} onChange={e => updateLink(idx, 'name', e.target.value)}
                                />
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                                    <input
                                        required
                                        type="url"
                                        placeholder="https://..."
                                        className={`w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors font-mono ${btnBase}`}
                                        value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)}
                                    />
                                </div>
                            </div>
                            {links.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeLink(idx)}
                                    aria-label="Remove server"
                                    className={`p-1.5 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${btnBase}`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </section>

                {/* Visibility */}
                <section className={cardSkin}>
                    <h2 className="text-sm font-semibold text-ink">Visibility</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <button
                            type="button"
                            onClick={() => setIsPremium(!isPremium)}
                            className={`flex items-center gap-3 p-4 bg-surface2/50 border rounded-xl cursor-pointer text-left transition-colors duration-200 active:scale-[0.98] ${isPremium ? 'border-warn/50' : 'border-line'} ${btnBase}`}
                        >
                            <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isPremium ? 'bg-warn border-warn' : 'bg-surface border-line'}`}>
                                {isPremium && <Star className="w-3 h-3 text-surface fill-current" />}
                            </span>
                            <span>
                                <span className="block text-sm font-medium text-ink">Premium</span>
                                <span className="block text-xs text-inksoft mt-0.5">Subscribers only</span>
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPublished(!isPublished)}
                            className={`flex items-center gap-3 p-4 bg-surface2/50 border rounded-xl cursor-pointer text-left transition-colors duration-200 active:scale-[0.98] ${isPublished ? 'border-violet-500/50' : 'border-line'} ${btnBase}`}
                        >
                            <span className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 flex items-center ${isPublished ? 'bg-gradient-red' : 'bg-line'}`}>
                                <span className={`w-4 h-4 bg-surface rounded-full shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                            </span>
                            <span>
                                <span className="block text-sm font-medium text-ink">{isPublished ? 'Published' : 'Draft'}</span>
                                <span className="block text-xs text-inksoft mt-0.5">{isPublished ? 'Visible to all' : 'Hidden'}</span>
                            </span>
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/highlights" className={`inline-flex items-center bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`}>
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`inline-flex items-center gap-2 btn-gradient-red text-white rounded-[10px] px-6 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${btnBase}`}
                    >
                        {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
