'use client';

import { useEffect, useState } from 'react';
import { getChannels, deleteChannel, bulkDeleteChannels, duplicateChannel } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Tv, Hash, CheckSquare, Square, XSquare, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Channel = Database['public']['Tables']['channels']['Row'];

export default function ChannelsPage() {
    const router = useRouter();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadChannels = async () => {
        setLoading(true);
        try {
            const data = await getChannels();
            setChannels(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChannels();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this channel?')) return;
        await deleteChannel(id);
        loadChannels();
        router.refresh();
    };

    const handleDuplicate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await duplicateChannel(id);
        if (result.success) {
            loadChannels();
            router.refresh();
        }
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        setSelectedIds(new Set(channels.map(c => c.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected channels?`)) return;

        setDeleting(true);
        try {
            await bulkDeleteChannels(Array.from(selectedIds));
            setSelectedIds(new Set());
            setSelectMode(false);
            loadChannels();
            router.refresh();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                        Channels
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">Manage TV channels and stream links.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition text-xs md:text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {selectMode ? <XSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{selectMode ? 'Cancel' : 'Select'}</span>
                    </button>

                    <Link href="/channels/new" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition cursor-pointer text-xs md:text-sm">
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Add Channel</span>
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectMode && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
                    <button onClick={selectAll} className="text-xs text-emerald-400 hover:text-emerald-300">Select All</button>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-300">Deselect All</button>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || deleting}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 md:h-40 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <>
                    {channels.length === 0 ? (
                        <div className="p-8 md:p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-sm md:text-base">
                            No channels found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                            {channels.map((channel) => (
                                <div key={channel.id} className="relative">
                                    {selectMode && (
                                        <button
                                            onClick={() => toggleSelect(channel.id)}
                                            className="absolute top-2 left-2 z-30 p-1 rounded bg-slate-800/80"
                                        >
                                            {selectedIds.has(channel.id) ? (
                                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <Square className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                    <Link
                                        href={selectMode ? '#' : `/channels/${channel.id}`}
                                        onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(channel.id); } : undefined}
                                        className={`group bg-slate-900 border rounded-xl p-3 md:p-5 transition relative block ${selectedIds.has(channel.id)
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-800 hover:border-emerald-500/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2 md:mb-4">
                                            <div className="bg-slate-950 p-2 md:p-3 rounded-lg border border-slate-800 group-hover:border-emerald-500/30 transition">
                                                <Tv className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                                            </div>
                                            {!selectMode && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleDuplicate(e, channel.id)}
                                                        className="text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 p-1.5 md:p-2 rounded transition z-20 relative"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, channel.id)}
                                                        className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 md:p-2 rounded transition z-20 relative"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1 group-hover:text-emerald-400 transition truncate">{channel.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 font-mono mb-2 md:mb-4">
                                            <Hash className="w-2.5 h-2.5 md:w-3 md:h-3" /> ID: {channel.id}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
