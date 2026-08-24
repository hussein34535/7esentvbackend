'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/app/actions';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';
import { Save, ArrowLeft, Plus, Trash2, Star, Wand2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { StreamItem, extractStreamsFromData } from '@/lib/stream-utils';
import EsenlinksModal from '@/components/EsenlinksModal';

const inputClass = 'w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors';
const streamInputClass = 'w-full bg-surface border border-line focus:border-accent/60 focus:bg-surface2 rounded-[10px] px-2.5 py-1.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors';
const miniBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium bg-surface border border-line text-inksoft hover:bg-surface2 hover:text-ink transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const primaryBtn = 'inline-flex items-center gap-2 btn-gradient-red text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const secondaryBtn = 'inline-flex items-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const sectionCard = 'bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-4';
const sectionTitle = 'text-sm font-semibold text-ink';

export default function NewMatch() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [logoA, setLogoA] = useState<CloudinaryAsset | string | null>(null);
    const [logoB, setLogoB] = useState<CloudinaryAsset | string | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const [streams, setStreams] = useState<StreamItem[]>([
        { name: 'Default', url: '', is_premium: false }
    ]);
    const [isEsenlinksOpen, setIsEsenlinksOpen] = useState(false);

    const handleAddEsenlinks = (importedStreams: StreamItem[]) => {
        if (streams.length === 1 && streams[0].url.trim() === '') {
            setStreams(importedStreams);
        } else {
            setStreams([...streams, ...importedStreams]);
        }
    };

    const [formData, setFormData] = useState({
        team_a: '',
        team_b: '',
        match_time: '',
        channel: '',
        commentator: '',
        champion: ''
    });

    const handleStreamChange = (index: number, field: keyof StreamItem, value: StreamItem[keyof StreamItem]) => {
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
        } catch {
            alert('Error parsing data.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createMatch({
                ...formData,
                logo_a: logoA,
                logo_b: logoB,
                is_premium: isPremium,
                is_published: isPublished,
                stream_link: streams // Send array directly
            });

            if (result.success) {
                router.push('/');
                router.refresh();
            } else {
                alert('Error creating match: ' + result.error);
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
                    <Link href="/" aria-label="Back to matches" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Add New Match</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

                    {/* Teams */}
                    <section className={sectionCard}>
                        <h2 className={sectionTitle}>Teams</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Uploader label="Team A Logo" value={logoA} onChange={setLogoA} />
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1.5">Team A Name</label>
                                    <input required type="text" className={inputClass}
                                        value={formData.team_a} onChange={e => setFormData({ ...formData, team_a: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Uploader label="Team B Logo" value={logoB} onChange={setLogoB} />
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1.5">Team B Name</label>
                                    <input required type="text" className={inputClass}
                                        value={formData.team_b} onChange={e => setFormData({ ...formData, team_b: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Details */}
                    <section className={sectionCard}>
                        <h2 className={sectionTitle}>Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1.5">Time (UTC)</label>
                                <input required type="time" className={inputClass}
                                    value={formData.match_time} onChange={e => setFormData({ ...formData, match_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1.5">Championship</label>
                                <input type="text" className={inputClass}
                                    value={formData.champion} onChange={e => setFormData({ ...formData, champion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1.5">Channel</label>
                                <input type="text" className={inputClass}
                                    value={formData.channel} onChange={e => setFormData({ ...formData, channel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1.5">Commentator</label>
                                <input type="text" className={inputClass}
                                    value={formData.commentator} onChange={e => setFormData({ ...formData, commentator: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Multi-Stream Input */}
                    <section className={sectionCard}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className={sectionTitle}>Stream Servers</h2>
                                <p className="text-xs text-inkmute mt-0.5">Add multiple servers/qualities for this match.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setIsEsenlinksOpen(true)} className={miniBtn}>
                                    <Sparkles className="w-3.5 h-3.5" /> Import Esenlinks
                                </button>
                                <button type="button" onClick={parseRichTextJson} className={miniBtn}>
                                    <Wand2 className="w-3.5 h-3.5" /> Import JSON
                                </button>
                                <button type="button" onClick={addStream} className={miniBtn}>
                                    <Plus className="w-3.5 h-3.5" /> Add Server
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {streams.map((stream, idx) => (
                                <div key={idx} className="group flex items-start gap-3 bg-surface2 p-3 rounded-xl border border-line hover:border-inkmute/30 transition-colors">
                                    <div className="pt-2.5 text-xs text-inkmute tabular-nums w-5 text-center shrink-0">{idx + 1}</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                        <div className="md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Label (e.g. FHD)"
                                                className={streamInputClass}
                                                value={stream.name}
                                                onChange={e => handleStreamChange(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                className={streamInputClass}
                                                value={stream.url}
                                                onChange={e => handleStreamChange(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => handleStreamChange(idx, 'is_premium', !stream.is_premium)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-xs font-medium w-full justify-center transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${stream.is_premium
                                                    ? 'bg-warnsoft border-warn/40 text-warn'
                                                    : 'bg-surface border-line text-inksoft hover:bg-surface2 hover:text-ink'
                                                    }`}
                                            >
                                                <Star className={`w-3.5 h-3.5 ${stream.is_premium ? 'fill-current' : ''}`} />
                                                <span>{stream.is_premium ? 'Premium' : 'Free'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Remove server"
                                        onClick={() => removeStream(idx)}
                                        className="mt-1 p-1.5 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Visibility */}
                    <section className={sectionCard}>
                        <h2 className={sectionTitle}>Visibility</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPremium(!isPremium)}
                                className="flex items-center gap-3 p-3.5 bg-surface2 border border-line rounded-xl text-left transition-all duration-200 hover:border-inkmute/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${isPremium ? 'bg-warn border-warn' : 'bg-surface border-inkmute/40'}`}>
                                    {isPremium && <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-ink flex items-center gap-2">Premium Match <span className="bg-warnsoft text-warn text-[10px] font-semibold px-2 py-0.5 rounded-full">VIP</span></div>
                                    <div className="text-xs text-inkmute mt-0.5">Only visible to subscribed users.</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPublished(!isPublished)}
                                className="flex items-center gap-3 p-3.5 bg-surface2 border border-line rounded-xl text-left transition-all duration-200 hover:border-inkmute/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 shrink-0 ${isPublished ? 'bg-accent' : 'bg-inkmute/30'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-ink">
                                        {isPublished ? 'Published' : 'Draft'}
                                    </div>
                                    <div className="text-xs text-inkmute mt-0.5">{isPublished ? 'Visible to everyone' : 'Hidden from app'}</div>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Footer actions */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <Link href="/" className={secondaryBtn}>Cancel</Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={primaryBtn}
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Match</>}
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
