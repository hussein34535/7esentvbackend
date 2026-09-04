
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getChannel, updateChannel, getCategories } from '@/app/actions';
import { Save, ArrowLeft, Tv, Plus, Trash2, Wand2, Star, Sparkles, Play } from 'lucide-react';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { extractStreamsFromData, StreamItem } from '@/lib/stream-utils';
import EsenlinksModal from '@/components/EsenlinksModal';

type Category = Database['public']['Tables']['channel_categories']['Row'];

export default function EditChannel() {
    const router = useRouter();
    const params = useParams();
    const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
    const channelId = parseInt(idStr as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [streams, setStreams] = useState<StreamItem[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCats, setSelectedCats] = useState<number[]>([]);
    const [showAllCats, setShowAllCats] = useState(false);
    const [isEsenlinksOpen, setIsEsenlinksOpen] = useState(false);
    const [playingIdx, setPlayingIdx] = useState<number | null>(null);

    const handlePlayWithToken = async (streamUrl: string, idx: number) => {
        if (!streamUrl || !streamUrl.includes('7esenlink.vercel.app')) {
            window.open(streamUrl, '_blank');
            return;
        }
        setPlayingIdx(idx);
        try {
            const url = new URL(streamUrl);
            const parts = url.pathname.split('/').filter(Boolean);
            // parts: ['api','stream','CATEGORY','ID'] -> channelKey is CATEGORY/ID
            const channelKey = parts.length >= 4 ? `${decodeURIComponent(parts[2])}/${decodeURIComponent(parts[3])}` : streamUrl;
            const res = await fetch('/api/admin/stream-test-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelKey }),
            });
            const data = await res.json();
            if (data.success && data.token && data.sessionId) {
                const sep = streamUrl.includes('?') ? '&' : '?';
                const full = `${streamUrl}${sep}tk=${encodeURIComponent(data.token)}&sid=${encodeURIComponent(data.sessionId)}&dv=dashboard-test-device`;
                window.open(full, '_blank');
            } else {
                alert('فشل إنشاء توكن الاختبار: ' + (data.error || 'غير معروف'));
                window.open(streamUrl, '_blank');
            }
        } catch (e) {
            console.error(e);
            window.open(streamUrl, '_blank');
        } finally {
            setPlayingIdx(null);
        }
    };

    const handleAddEsenlinks = (importedStreams: StreamItem[]) => {
        if (streams.length === 1 && streams[0].url.trim() === '') {
            setStreams(importedStreams);
        } else {
            setStreams([...streams, ...importedStreams]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!channelId) return;
            try {
                const [channelData, catsData] = await Promise.all([
                    getChannel(channelId),
                    getCategories()
                ]);

                setCategories(catsData || []);

                if (channelData) {
                    setName(channelData.name);

                    let linkData: unknown = channelData.stream_link;

                    // 1. Pre-process string JSON if needed
                    if (typeof linkData === 'string') {
                        try {
                            if (linkData.startsWith('{') || linkData.startsWith('[')) {
                                linkData = JSON.parse(linkData);
                            } else {
                                // Simple string URL
                                linkData = [{ name: 'Default', url: linkData, is_premium: false }];
                            }
                        } catch {
                            linkData = [{ name: 'Default', url: linkData, is_premium: false }];
                        }
                    }

                    // 2. Use utility to robustly extract streams regardless of format (Legacy Rich Text OR Clean Format)
                    const extracted = extractStreamsFromData(linkData);
                    setStreams(extracted);

                    const channelWithCats = channelData as { categories?: Array<{ id: number | string }> };
                    if (channelWithCats.categories && Array.isArray(channelWithCats.categories)) {
                        setSelectedCats(channelWithCats.categories.map((c) => Number(c.id)));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [channelId]);

    const handleStreamChange = (index: number, field: keyof StreamItem, value: string | boolean) => {
        const newStreams = [...streams];
        newStreams[index] = { ...newStreams[index], [field]: value };
        setStreams(newStreams);
    };

    const addStream = () => {
        setStreams([...streams, { name: `Stream ${streams.length + 1}`, url: '', is_premium: false }]);
    };

    const removeStream = (index: number) => {
        setStreams(streams.filter((_, i) => i !== index));
    };

    const parseRichTextJson = () => {
        try {
            const raw = prompt("Paste the raw JSON content here:");
            if (!raw) return;

            let current;
            try {
                current = JSON.parse(raw);
            } catch {
                alert('Invalid JSON syntax.');
                return;
            }

            const cleanList = extractStreamsFromData(current);

            if (cleanList.length > 0) {
                const names = cleanList.map(i => i.name).join(', ');
                if (confirm(`Found ${cleanList.length} streams: \n${names}\n\nReplace current list?`)) {
                    setStreams(cleanList);
                }
            } else {
                alert('No compatible links found in the pasted JSON. Looked for objects with type="link" and a "url" property.');
            }
        } catch (e) {
            console.error(e);
            alert('Error parsing data.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const result = await updateChannel(channelId, {
                name,
                stream_link: streams, // Save as array of objects
                category_ids: selectedCats
            });

            if (result.success) {
                router.push('/channels');
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

    if (loading) return <div className="p-10 text-center text-sm text-inkmute">Loading channel...</div>;

    return (
        <div>
            <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Link href="/channels" aria-label="Back to channels" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Edit Channel #{channelId}</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

                    {/* Channel Name */}
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card">
                        <label htmlFor="channel-name" className="block text-sm font-medium text-ink mb-1.5">Channel Name</label>
                        <div className="relative">
                            <Tv className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                            <input
                                id="channel-name"
                                required
                                type="text"
                                className="w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink outline-none transition-colors"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </section>

                    {/* Categories */}
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-ink">Categories</label>
                            <button
                                type="button"
                                onClick={() => setShowAllCats(!showAllCats)}
                                className="text-xs font-medium text-accentstrong hover:underline transition focus-visible:outline-none"
                            >
                                {showAllCats ? 'Show Selected Only' : '+ Add/Edit Categories'}
                            </button>
                        </div>

                        {(showAllCats || selectedCats.length > 0) ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-h-60 overflow-y-auto pr-1">
                                {categories
                                    .filter(cat => showAllCats || selectedCats.includes(cat.id))
                                    .sort((a, b) => {
                                        // Sort selected first
                                        const aSel = selectedCats.includes(a.id);
                                        const bSel = selectedCats.includes(b.id);
                                        if (aSel && !bSel) return -1;
                                        if (!aSel && bSel) return 1;
                                        return 0;
                                    })
                                    .map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => {
                                                if (selectedCats.includes(cat.id)) {
                                                    setSelectedCats(selectedCats.filter(id => id !== cat.id));
                                                } else {
                                                    setSelectedCats([...selectedCats, cat.id]);
                                                }
                                            }}
                                            className={`cursor-pointer px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${selectedCats.includes(cat.id)
                                                ? 'border-violet-500 bg-violet-500/10 text-ink'
                                                : 'bg-surface2/50 border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                                                }`}
                                        >
                                            <span className="text-sm font-medium truncate" title={cat.name}>{cat.name}</span>
                                            {selectedCats.includes(cat.id) && (
                                                <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 ml-2" />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-sm text-inkmute py-2">No categories linked. Click &quot;Add/Edit&quot; to select.</div>
                        )}
                    </section>

                    {/* Stream List Config */}
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-ink">Stream Sources</h3>
                                <p className="text-xs text-inkmute mt-0.5">Manage multiple qualities or sources.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setIsEsenlinksOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium border border-violet-500/20 bg-violet-500/10 text-accentstrong hover:bg-violet-500/10/70 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                                    <Sparkles className="w-3.5 h-3.5" /> Import Esenlinks
                                </button>
                                <button type="button" onClick={parseRichTextJson} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium border border-line bg-surface text-inksoft hover:bg-surface2 hover:text-ink transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                                    <Wand2 className="w-3.5 h-3.5" /> Import from JSON
                                </button>
                                <button type="button" onClick={addStream} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium border border-line bg-surface text-accentstrong hover:bg-surface2 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                                    <Plus className="w-3.5 h-3.5" /> Add Stream
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {streams.map((stream, idx) => (
                                <div key={idx} className="group flex items-start gap-3 bg-surface2/50 p-3 md:p-4 rounded-xl border border-line hover:border-inkmute/30 transition-colors">
                                    <div className="mt-3 text-xs text-inkmute tabular-nums w-6 text-center">{idx + 1}</div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                        {/* Name */}
                                        <div className="md:col-span-3">
                                            <label className="text-xs font-medium text-inksoft mb-1 block">Label</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. FHD"
                                                className="w-full bg-surface border border-line focus:border-violet-500/60 rounded-[10px] px-2.5 py-1.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                                                value={stream.name}
                                                onChange={e => handleStreamChange(idx, 'name', e.target.value)}
                                            />
                                        </div>

                                        {/* URL */}
                                        <div className="md:col-span-6">
                                            <label className="text-xs font-medium text-inksoft mb-1 block">Stream URL</label>
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    className="flex-1 min-w-0 bg-surface border border-line focus:border-violet-500/60 rounded-[10px] px-2.5 py-1.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                                                    value={stream.url}
                                                    onChange={e => handleStreamChange(idx, 'url', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayWithToken(stream.url, idx)}
                                                    disabled={!stream.url || playingIdx === idx}
                                                    title="تشغيل تجريبي مع توكن"
                                                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-600 hover:bg-violet-500 hover:text-white disabled:opacity-40 transition-colors"
                                                >
                                                    <Play className={`w-3.5 h-3.5 ${playingIdx === idx ? 'animate-pulse' : ''} ${playingIdx !== idx ? 'ml-0.5' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Premium Toggle */}
                                        <div className="md:col-span-3 flex items-end h-full pb-1">
                                            <button
                                                type="button"
                                                onClick={() => handleStreamChange(idx, 'is_premium', !stream.is_premium)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] border transition-all duration-200 w-full justify-center focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none ${stream.is_premium
                                                    ? 'bg-warnsoft border-warn/40 text-warn'
                                                    : 'bg-surface border-line text-inksoft hover:bg-surface2'
                                                    }`}
                                            >
                                                <Star className={`w-3.5 h-3.5 ${stream.is_premium ? 'fill-current' : ''}`} />
                                                <span className="text-xs font-medium">{stream.is_premium ? 'Premium' : 'Free'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeStream(idx)}
                                        className="mt-6 p-1.5 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none"
                                        title="Remove Stream"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {streams.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-line bg-surface2/50 rounded-2xl text-inksoft text-sm">
                                    No streams configured. Click &quot;Add Stream&quot; to start.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                        <Link href="/channels" className="px-4 py-2 rounded-[10px] text-sm font-medium bg-surface border border-line hover:bg-surface2 text-ink transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 btn-gradient-red text-white px-6 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Channel</>}
                        </button>
                    </div>
                </form>
            </main>
            <EsenlinksModal 
                isOpen={isEsenlinksOpen} 
                onClose={() => setIsEsenlinksOpen(false)} 
                onAddStreams={handleAddEsenlinks} 
            />
        </div>
    );
}
