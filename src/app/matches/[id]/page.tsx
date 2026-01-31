
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getMatch, updateMatch } from '@/app/actions';
import Navbar from '@/components/Navbar';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';
import { Save, ArrowLeft, Plus, Trash2, Wand2, Star } from 'lucide-react';
import Link from 'next/link';
import { StreamItem, extractStreamsFromData } from '@/lib/stream-utils';

export default function EditMatch({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [logoA, setLogoA] = useState<any>(null);
    const [logoB, setLogoB] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const [streams, setStreams] = useState<StreamItem[]>([]);

    const [formData, setFormData] = useState({
        team_a: '',
        team_b: '',
        match_time: '',
        channel: '',
        commentator: '',
        champion: ''
    });

    useEffect(() => {
        getMatch(Number(id)).then(match => {
            if (match) {
                setFormData({
                    team_a: match.team_a || '',
                    team_b: match.team_b || '',
                    match_time: match.match_time || '',
                    channel: match.channel || '',
                    commentator: match.commentator || '',
                    champion: match.champion || ''
                });

                // Handle Logo A
                if (match.logo_a) {
                    if (Array.isArray(match.logo_a)) setLogoA(match.logo_a[0]);
                    else setLogoA(match.logo_a);
                }

                // Handle Logo B
                if (match.logo_b) {
                    if (Array.isArray(match.logo_b)) setLogoB(match.logo_b[0]);
                    else setLogoB(match.logo_b);
                }

                setIsPremium(match.is_premium || false);
                setIsPublished(match.is_published ?? true);

                // Handle Streams
                let linkData = match.stream_link as any;
                const extracted = extractStreamsFromData(linkData);
                if (extracted.length === 0 && match.stream_link && typeof match.stream_link === 'string') {
                    // Fallback for simple string if utility missed it (unlikely but safe)
                    setStreams([{ name: 'Default', url: match.stream_link, is_premium: false }]);
                } else {
                    setStreams(extracted.length > 0 ? extracted : [{ name: 'Default', url: '', is_premium: false }]);
                }
            }
            setLoading(false);
        });
    }, [id]);

    const handleStreamChange = (index: number, field: keyof StreamItem, value: any) => {
        const newStreams = [...streams];
        newStreams[index] = { ...newStreams[index], [field]: value };
        setStreams(newStreams);
    };

    const addStream = () => {
        setStreams([...streams, { name: `Server ${streams.length + 1}`, url: '', is_premium: false }]);
    };

    const removeStream = (index: number) => {
        setStreams(streams.filter((_, i) => i !== index));
    };

    const parseRichTextJson = () => {
        try {
            const raw = prompt("Paste the raw JSON content here:");
            if (!raw) return;
            const current = JSON.parse(raw);
            const cleanList = extractStreamsFromData(current);
            if (cleanList.length > 0) {
                if (confirm(`Found ${cleanList.length} streams. Replace current list?`)) {
                    setStreams(cleanList);
                }
            } else {
                alert('No compatible links found.');
            }
        } catch (e) {
            alert('Error parsing data.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const result = await updateMatch(Number(id), {
                ...formData,
                logo_a: logoA,
                logo_b: logoB,
                is_premium: isPremium,
                is_published: isPublished,
                stream_link: streams
            });

            if (result.success) {
                router.push('/');
                router.refresh();
            } else {
                alert('Error updating match: ' + result.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading match...</div>;

    return (
        <div className="font-sans">
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Match</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">

                    {/* Teams Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Uploader label="Team A Logo" value={logoA} onChange={setLogoA} />
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Team A Name</label>
                                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                    value={formData.team_a} onChange={e => setFormData({ ...formData, team_a: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Uploader label="Team B Logo" value={logoB} onChange={setLogoB} />
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Team B Name</label>
                                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                    value={formData.team_b} onChange={e => setFormData({ ...formData, team_b: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 my-4"></div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Time (Egypt Time 🇪🇬)</label>
                            <input required type="time" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                value={formData.match_time} onChange={e => setFormData({ ...formData, match_time: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Championship</label>
                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                value={formData.champion} onChange={e => setFormData({ ...formData, champion: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Channel</label>
                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                value={formData.channel} onChange={e => setFormData({ ...formData, channel: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Commentator</label>
                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-500 outline-none"
                                value={formData.commentator} onChange={e => setFormData({ ...formData, commentator: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Multi-Stream Input */}
                    <div className="border-t border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-white">Stream Servers</h3>
                                <p className="text-sm text-slate-500">Manage stream qualities/servers.</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={parseRichTextJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition">
                                    <Wand2 className="w-3.5 h-3.5" /> Import JSON
                                </button>
                                <button type="button" onClick={addStream} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition">
                                    <Plus className="w-3.5 h-3.5" /> Add Server
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {streams.map((stream, idx) => (
                                <div key={idx} className="group flex items-start gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                                    <div className="mt-2 text-xs text-slate-600 font-mono w-6 text-center">{idx + 1}</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Label (e.g. FHD)"
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                                value={stream.name}
                                                onChange={e => handleStreamChange(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-300 focus:border-indigo-500 outline-none"
                                                value={stream.url}
                                                onChange={e => handleStreamChange(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3 flex items-center">
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
                                        className="mt-1 text-slate-600 hover:text-red-400 transition p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer max-w-sm" onClick={() => setIsPremium(!isPremium)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                {isPremium && <svg className="w-3 h-3 text-black fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>}
                            </div>
                            <div>
                                <div className="font-medium text-white flex items-center gap-2">Premium Match <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded">VIP</span></div>
                                <div className="text-xs text-slate-500">Only visible to subscribed users.</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer max-w-sm" onClick={() => setIsPublished(!isPublished)}>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <div>
                                <div className="font-medium text-white flex items-center gap-2">
                                    {isPublished ? 'Published' : 'Draft'}
                                </div>
                                <div className="text-xs text-slate-500">{isPublished ? 'Visible to everyone' : 'Hidden from app'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Update Match</>}
                        </button>
                    </div>

                </form>
            </main>
        </div>
    );
}
