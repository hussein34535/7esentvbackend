'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChannel, getCategories } from '@/app/actions';
import { Database } from '@/types/database.types';
import { Save, ArrowLeft, Tv, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

type Category = Database['public']['Tables']['channel_categories']['Row'];

export default function NewChannel() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isComplex, setIsComplex] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const streamLinkJson = isComplex ? JSON.parse(url) : { url: url, type: 'hls' };

            const result = await createChannel({
                name,
                stream_link: streamLinkJson,
                category_ids: [] // Removed category selection from here as per user request
            });

            if (result.success) {
                router.push('/channels');
                router.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Invalid JSON format');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/channels" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">New Channel</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Name & URL Inputs (Keep existing) */}
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

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Stream URL (or JSON)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="text"
                                    placeholder="https://example.com/stream.m3u8"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:border-emerald-500 outline-none transition font-mono text-sm"
                                    value={url} onChange={e => setUrl(e.target.value)}
                                />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <input type="checkbox" id="complex" checked={isComplex} onChange={e => setIsComplex(e.target.checked)} className="rounded border-slate-700 bg-slate-900" />
                                <label htmlFor="complex" className="text-xs text-slate-500 select-none cursor-pointer">Raw JSON Mode</label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Create Channel</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
