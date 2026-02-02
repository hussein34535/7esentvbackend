'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getHighlight, updateHighlight } from '@/app/actions';
import { Save, ArrowLeft, Link as LinkIcon, Star, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

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
                        } catch (e) {
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Loading highlight...</p>
            </div>
        );
    }

    return (
        <div className="font-sans">
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/highlights" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Highlight</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                        <Uploader
                            label="Cover Image"
                            value={image}
                            onChange={(val) => { if (typeof val !== 'string') setImage(val); }}
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Highlight Title</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition"
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-400">Video Links (Servers)</label>
                                <button type="button" onClick={addLink} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition">
                                    + Add Server
                                </button>
                            </div>

                            {links.map((link, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            required
                                            type="text"
                                            placeholder="Server Name"
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                            value={link.name} onChange={e => updateLink(idx, 'name', e.target.value)}
                                        />
                                        <div className="relative">
                                            <LinkIcon className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
                                            <input
                                                required
                                                type="url"
                                                placeholder="https://..."
                                                className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {links.length > 1 && (
                                        <button type="button" onClick={() => removeLink(idx)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

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
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
