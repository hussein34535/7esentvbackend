
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getChannel, updateChannel, getCategories } from '@/app/actions';
import { Save, ArrowLeft, Tv, Plus, Trash2, Wand2, Star } from 'lucide-react';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { extractStreamsFromData, StreamItem } from '@/lib/stream-utils';

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

                    let linkData = channelData.stream_link as any;

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

                    const channelWithCats = channelData as any;
                    if (channelWithCats.categories && Array.isArray(channelWithCats.categories)) {
                        setSelectedCats(channelWithCats.categories.map((c: any) => Number(c.id)));
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

    const handleStreamChange = (index: number, field: keyof StreamItem, value: any) => {
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
            } catch (e) {
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

    if (loading) return <div className="p-10 text-center text-slate-500">Loading channel...</div>;

    return (
        <div className="font-sans">
            <main className="max-w-4xl mx-auto px-4 py-4 md:py-8">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <h1 className="text-xl md:text-2xl font-bold">Edit Channel #{channelId}</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 space-y-6 md:space-y-8">

                    {/* Channel Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Channel Name</label>
                        <div className="relative">
                            <Tv className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:border-emerald-500 outline-none transition"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-400">Categories</label>
                            <button
                                type="button"
                                onClick={() => setShowAllCats(!showAllCats)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                            >
                                {showAllCats ? 'Show Selected Only' : '+ Add/Edit Categories'}
                            </button>
                        </div>

                        {(showAllCats || selectedCats.length > 0) ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
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
                                            className={`cursor-pointer px-4 py-3 rounded-lg border transition flex items-center justify-between ${selectedCats.includes(cat.id)
                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                                                : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <span className="text-sm font-medium truncate" title={cat.name}>{cat.name}</span>
                                            {selectedCats.includes(cat.id) && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0 ml-2" />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 italic py-2">No categories linked. Click "Add/Edit" to select.</div>
                        )}
                    </div>

                    <div className="border-t border-slate-800"></div>

                    {/* Stream List Config */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-white">Stream Sources</h3>
                                <p className="text-sm text-slate-500">Manage multiple qualities or sources.</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={parseRichTextJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition">
                                    <Wand2 className="w-3.5 h-3.5" /> Import from JSON
                                </button>
                                <button type="button" onClick={addStream} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition">
                                    <Plus className="w-3.5 h-3.5" /> Add Stream
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {streams.map((stream, idx) => (
                                <div key={idx} className="group flex items-start gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                                    <div className="mt-3 text-xs text-slate-600 font-mono w-6 text-center">{idx + 1}</div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                        {/* Name */}
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">Label</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. FHD"
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                                value={stream.name}
                                                onChange={e => handleStreamChange(idx, 'name', e.target.value)}
                                            />
                                        </div>

                                        {/* URL */}
                                        <div className="md:col-span-6">
                                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">Stream URL</label>
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-300 focus:border-indigo-500 outline-none"
                                                value={stream.url}
                                                onChange={e => handleStreamChange(idx, 'url', e.target.value)}
                                            />
                                        </div>

                                        {/* Premium Toggle */}
                                        <div className="md:col-span-3 flex items-end h-full pb-1">
                                            <button
                                                type="button"
                                                onClick={() => handleStreamChange(idx, 'is_premium', !stream.is_premium)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition w-full justify-center ${stream.is_premium
                                                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
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
                                        className="mt-6 text-slate-600 hover:text-red-400 transition p-1"
                                        title="Remove Stream"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {streams.length === 0 && (
                                <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-slate-600 text-sm">
                                    No streams configured. Click "Add Stream" to start.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-medium transition disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Channel</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
