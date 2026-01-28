'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCategory, updateCategory, getChannels } from '@/app/actions';
import { Save, ArrowLeft, Search, Check, Tv, Hash } from 'lucide-react';
import Link from 'next/link';
import { Database } from '@/types/database.types';

type Channel = Database['public']['Tables']['channels']['Row'];

export default function EditCategory() {
    const router = useRouter();
    const params = useParams();
    const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
    const categoryId = parseInt(idStr as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);

    const [allChannels, setAllChannels] = useState<Channel[]>([]);
    const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [catData, channelsData] = await Promise.all([
                    getCategory(categoryId),
                    getChannels()
                ]);

                setAllChannels(channelsData || []);

                if (catData) {
                    setName(catData.name);
                    setIsPremium(catData.is_premium || false);
                    setSortOrder(catData.sort_order || 0);

                    // Pre-select channels
                    // The Action returns 'channels' as a JSON array of objects {id, name}
                    const currentChannels = (catData as any).channels;
                    if (Array.isArray(currentChannels)) {
                        setSelectedChannelIds(currentChannels.map((c: any) => c.id));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [categoryId]);

    const filteredChannels = useMemo(() => {
        return allChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allChannels, searchQuery]);

    const toggleChannel = (id: number) => {
        if (selectedChannelIds.includes(id)) {
            setSelectedChannelIds(selectedChannelIds.filter(cid => cid !== id));
        } else {
            setSelectedChannelIds([...selectedChannelIds, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const result = await updateCategory(categoryId, {
                name,
                is_premium: isPremium,
                sort_order: sortOrder,
                channel_ids: selectedChannelIds
            });

            if (result.success) {
                router.push('/categories');
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

    if (loading) return <div className="p-10 text-center text-slate-500">Loading category...</div>;

    return (
        <div className="font-sans">
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/categories" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Category #{categoryId}</h1>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                            <h2 className="font-bold text-lg mb-4">Details</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Category Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition"
                                    value={name} onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Sort Order</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none transition"
                                        value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Lower numbers appear first.</p>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-700">
                                <span className="font-medium text-sm">Premium Content</span>
                                <div
                                    onClick={() => setIsPremium(!isPremium)}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPremium ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPremium ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>

                    {/* Right Column: Channel Selection */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Tv className="w-5 h-5 text-slate-400" /> Linked Channels
                                <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-300">
                                    {selectedChannelIds.length}
                                </span>
                            </h2>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search channels to add..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none transition text-sm"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredChannels.map((channel: Channel) => {
                                const isSelected = selectedChannelIds.includes(channel.id);
                                return (
                                    <div
                                        key={channel.id}
                                        onClick={() => toggleChannel(channel.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition group ${isSelected
                                            ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900'
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`font-medium ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>{channel.name}</span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-600 group-hover:text-slate-500">#{channel.id}</span>
                                    </div>
                                );
                            })}
                            {filteredChannels.length === 0 && (
                                <div className="text-center py-10 text-slate-500">
                                    No channels found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
