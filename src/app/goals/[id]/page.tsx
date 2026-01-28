'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getGoal, updateGoal } from '@/app/actions';
import { Save, ArrowLeft, Video, Link as LinkIcon, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

export default function EditGoal() {
    const router = useRouter();
    const params = useParams();
    const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
    const goalId = parseInt(idStr as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getGoal(goalId);
                if (data) {
                    setTitle(data.title || '');
                    // Handle complex URL block content if necessary, simplifying for now
                    if (data.url && Array.isArray(data.url) && (data.url as any).url) {
                        setUrl((data.url as any).url);
                    } else if (typeof data.url === 'string') {
                        setUrl(data.url);
                    } else if (data.url && (data.url as any).url) {
                        setUrl((data.url as any).url);
                    }

                    setIsPremium(data.is_premium || false);
                    setIsPublished(data.is_published ?? true);

                    // Handle Image array to single asset
                    if (data.image && Array.isArray(data.image) && data.image.length > 0) {
                        setImage(data.image[0]);
                    } else {
                        setImage(null);
                    }
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [goalId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const streamLinkJson = { url: url, type: 'video' };

            const result = await updateGoal(goalId, {
                title,
                url: streamLinkJson,
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
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="font-sans">
            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/goals" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Goal #{goalId}</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                        <Uploader label="Goal Thumbnail" value={image} onChange={setImage} />

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Goal Title</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition"
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Video URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="url"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:border-blue-500 outline-none transition font-mono text-sm"
                                    value={url} onChange={e => setUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-700 cursor-pointer" onClick={() => setIsPremium(!isPremium)}>
                            <div>
                                <h3 className="font-medium text-white flex items-center gap-2">
                                    Premium Goal
                                    {isPremium && <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">VIP</span>}
                                </h3>
                                <p className="text-xs text-slate-500">Only visible to subscribed users.</p>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                {isPremium && <Star className="w-3 h-3 text-black fill-current" />}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-700 cursor-pointer" onClick={() => setIsPublished(!isPublished)}>
                            <div>
                                <h3 className="font-medium text-white flex items-center gap-2">
                                    Status
                                    {isPublished ?
                                        <span className="text-xs bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">LIVE</span> :
                                        <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">DRAFT</span>
                                    }
                                </h3>
                                <p className="text-xs text-slate-500">{isPublished ? 'Visible to everyone' : 'Hidden from app'}</p>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
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
