'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCategory, updateCategory, getChannels } from '@/app/actions';
import { Save, ArrowLeft, Search, Check, Tv } from 'lucide-react';
import Link from 'next/link';
import { Database } from '@/types/database.types';
import Uploader from '@/components/Uploader';
import { CloudinaryAsset } from '@/types/cloudinary.types';

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
    const [image, setImage] = useState<CloudinaryAsset | null>(null);

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
                    setImage(catData.image || null);

                    // Pre-select channels
                    // The Action returns 'channels' as a JSON array of objects {id, name}
                    const currentChannels = (catData as { channels?: Array<{ id: number | string }> }).channels;
                    if (Array.isArray(currentChannels)) {
                        setSelectedChannelIds(currentChannels.map((c) => Number(c.id)));
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
                channel_ids: selectedChannelIds,
                image
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

    if (loading) return <div className="p-10 text-center text-sm text-inkmute">Loading category...</div>;

    return (
        <div>
            <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Link href="/categories" aria-label="Back to categories" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Edit Category #{categoryId}</h1>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-1 space-y-4 md:space-y-6">
                        <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-5">
                            <h2 className="font-semibold text-base text-ink">Details</h2>

                            <Uploader
                                label="Category Icon"
                                value={image}
                                onChange={(val) => { if (typeof val !== 'string') setImage(val); }}
                            />

                            <div>
                                <label htmlFor="category-name" className="block text-sm font-medium text-ink mb-1.5">Category Name</label>
                                <input
                                    id="category-name"
                                    required
                                    type="text"
                                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink outline-none transition-colors"
                                    value={name} onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="sort-order" className="block text-sm font-medium text-ink mb-1.5">Sort Order</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none flex items-center justify-center">#</span>
                                    <input
                                        id="sort-order"
                                        type="number"
                                        className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-8 pr-3 py-2 text-sm text-ink tabular-nums outline-none transition-colors"
                                        value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <p className="text-xs text-inkmute mt-1.5">Lower numbers appear first.</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-surface2/50 rounded-xl border border-line">
                                <span className="font-medium text-sm text-ink">Premium Content</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isPremium}
                                    aria-label="Toggle premium content"
                                    onClick={() => setIsPremium(!isPremium)}
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isPremium ? 'bg-warn' : 'bg-line'}`}
                                >
                                    <span className={`block w-5 h-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ${isPremium ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2">
                            <Link href="/categories" className="px-4 py-2 rounded-[10px] text-sm font-medium bg-surface border border-line hover:bg-surface2 text-ink transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-accent hover:bg-accentstrong text-white px-6 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Channel Selection */}
                    <section className="lg:col-span-2 bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card flex flex-col h-fit lg:h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-base text-ink flex items-center gap-2">
                                <Tv className="w-4 h-4 text-inkmute" /> Linked Channels
                                <span className="bg-surface2 border border-line text-xs px-2 py-0.5 rounded-full text-inksoft tabular-nums">
                                    {selectedChannelIds.length}
                                </span>
                            </h2>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search channels to add..."
                                className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                            <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
                                {filteredChannels.map((channel: Channel) => {
                                    const isSelected = selectedChannelIds.includes(channel.id);
                                    return (
                                        <div
                                            key={channel.id}
                                            onClick={() => toggleChannel(channel.id)}
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isSelected
                                                ? 'bg-accentsoft/50'
                                                : 'hover:bg-surface2/60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'border-inkmute/50 bg-surface'
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <span className={`text-sm font-medium truncate ${isSelected ? 'text-accentstrong' : 'text-ink'}`}>{channel.name}</span>
                                            </div>
                                            <span className="text-xs text-inkmute tabular-nums shrink-0 ml-3">#{channel.id}</span>
                                        </div>
                                    );
                                })}
                                {filteredChannels.length === 0 && (
                                    <div className="text-center py-10 bg-surface2/50">
                                        <Tv className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
                                        <p className="text-sm text-inksoft">No channels found matching &quot;{searchQuery}&quot;</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </form>
            </main>
        </div>
    );
}
