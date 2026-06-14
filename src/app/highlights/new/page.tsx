'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createHighlight, scrapeBeinGoal } from '@/app/actions';
import { Save, ArrowLeft, Link as LinkIcon, Star, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

export default function NewHighlight() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [links, setLinks] = useState<{ name: string, url: string }[]>([{ name: 'Server 1', url: '' }]);
    const [image, setImage] = useState<CloudinaryAsset | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const [autoPageUrl, setAutoPageUrl] = useState('');
    const [autoVideoUrl, setAutoVideoUrl] = useState('');
    const [autoLoading, setAutoLoading] = useState(false);
    const [autoMessage, setAutoMessage] = useState('');

    const handleAutoFetch = async () => {
        if (!autoPageUrl || !autoVideoUrl) {
            setAutoMessage('الرجاء إدخال كلا الرابطين للجلب التلقائي.');
            return;
        }
        setAutoLoading(true);
        setAutoMessage('');
        try {
            const res = await scrapeBeinGoal(autoPageUrl, autoVideoUrl);
            if (res.success && res.data) {
                setTitle(res.data.title);
                setLinks([{ name: 'Server 1', url: res.data.videoUrl }]);
                if (res.data.thumbnail) {
                    setImage({
                        url: res.data.thumbnail,
                        secure_url: res.data.thumbnail,
                        public_id: '',
                        format: 'jpg',
                        width: 1280,
                        height: 720
                    } as any);
                }
                setAutoMessage('تم جلب البيانات وتعبئتها بنجاح!');
            } else {
                setAutoMessage(`خطأ في جلب البيانات: ${res.error}`);
            }
        } catch (err: any) {
            setAutoMessage(`خطأ: ${err.message}`);
        } finally {
            setAutoLoading(false);
        }
    };

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
            const result = await createHighlight({
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
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/highlights" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Add New Highlight</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    {/* Auto-fill Section */}
                    <div className="bg-slate-955 p-4 rounded-lg border border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> جلب بيانات المباراة تلقائياً
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">رابط صفحة beIN Sports</label>
                                <input
                                    type="text"
                                    placeholder="https://www.beinsports.com/..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs outline-none focus:border-purple-500 text-slate-300"
                                    value={autoPageUrl}
                                    onChange={e => setAutoPageUrl(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">رابط الفيديو المباشر (Embed/M3U8)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs outline-none focus:border-purple-500 text-slate-300"
                                    value={autoVideoUrl}
                                    onChange={e => setAutoVideoUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAutoFetch}
                            disabled={autoLoading}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition"
                        >
                            {autoLoading ? 'جاري جلب وتعبئة البيانات...' : 'جلب وتعبئة البيانات'}
                        </button>
                        {autoMessage && (
                            <p className={`text-center text-xs ${autoMessage.includes('نجاح') ? 'text-green-400' : 'text-red-400'}`}>
                                {autoMessage}
                            </p>
                        )}
                    </div>
                    
                    <div className="border-t border-slate-800 my-4"></div>
                    <div className="space-y-4">
                        {/* Image Uploader */}
                        <Uploader
                            label="Cover Image (Required)"
                            value={image}
                            onChange={(val) => { if (typeof val !== 'string') setImage(val); }}
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Highlight Title</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Real Madrid vs Barcelona Highlights"
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
                                            placeholder="Server Name (e.g. Server 1)"
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
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Highlight</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
