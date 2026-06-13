'use client';

import { useState, useEffect } from 'react';
import { fetchEsenlinks } from '@/app/actions';
import { StreamItem } from '@/lib/stream-utils';
import { Search, X, Link2, Check, Loader2, Sparkles, Filter } from 'lucide-react';

interface EsenlinkItem {
    id: any;
    name: string;
    original: string;
    converted: string;
    category: string;
    createdAt: string;
}

interface EsenlinksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStreams: (streams: StreamItem[]) => void;
}

export default function EsenlinksModal({ isOpen, onClose, onAddStreams }: EsenlinksModalProps) {
    const [loading, setLoading] = useState(false);
    const [links, setLinks] = useState<EsenlinkItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLinkIds, setSelectedLinkIds] = useState<Set<any>>(new Set());

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const data = await fetchEsenlinks();
                    setLinks(data.links || []);
                    setCategories(data.categories || []);
                } catch (error) {
                    console.error('Failed to load Esenlinks:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
            // Reset selection when opening
            setSelectedLinkIds(new Set());
            setSearchTerm('');
            setSelectedCategory('all');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter links
    const filteredLinks = links.filter(link => {
        const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleSelectLink = (uniqueKey: string) => {
        const next = new Set(selectedLinkIds);
        if (next.has(uniqueKey)) {
            next.delete(uniqueKey);
        } else {
            next.add(uniqueKey);
        }
        setSelectedLinkIds(next);
    };

    const toggleSelectAllFiltered = () => {
        const allFilteredKeys = filteredLinks.map(l => `${l.category}_${l.id}`);
        const allSelected = allFilteredKeys.every(key => selectedLinkIds.has(key));

        const next = new Set(selectedLinkIds);
        if (allSelected) {
            // Uncheck all filtered
            allFilteredKeys.forEach(key => next.delete(key));
        } else {
            // Check all filtered
            allFilteredKeys.forEach(key => next.add(key));
        }
        setSelectedLinkIds(next);
    };

    const handleImport = () => {
        if (selectedLinkIds.size === 0) return;

        const baseUrl = process.env.NEXT_PUBLIC_ESENLINKS_URL || 'https://7esenlink.vercel.app';
        
        const selectedItems = links.filter(l => selectedLinkIds.has(`${l.category}_${l.id}`));
        const streamsToAdd: StreamItem[] = selectedItems.map(link => {
            // Ensure converted URL starts with /
            const path = link.converted.startsWith('/') ? link.converted : `/${link.converted}`;
            return {
                name: `${link.category.toUpperCase()} - ${link.name}`,
                url: `${baseUrl}${path}`,
                is_premium: false
            };
        });

        onAddStreams(streamsToAdd);
        onClose();
    };

    const isAllFilteredSelected = filteredLinks.length > 0 && 
        filteredLinks.every(l => selectedLinkIds.has(`${l.category}_${l.id}`));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">إستيراد من 7esenlink</h2>
                            <p className="text-xs text-slate-500">اختر الروابط والقنوات التي تود إضافتها</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="ابحث عن رابط أو قناة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none transition"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                                selectedCategory === 'all'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            الكل
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap capitalize ${
                                    selectedCategory === cat
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <span className="text-sm">جاري تحميل الروابط من السيرفر...</span>
                        </div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <Link2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                            <p className="text-sm">لم يتم العثور على روابط تطابق البحث.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Select All Toggle */}
                            <div 
                                onClick={toggleSelectAllFiltered}
                                className="flex items-center gap-3 px-4 py-2 bg-slate-950/20 hover:bg-slate-950/40 border border-slate-800/40 rounded-lg cursor-pointer transition select-none mb-4"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    isAllFilteredSelected 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-slate-700 bg-slate-950'
                                }`}>
                                    {isAllFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-semibold text-slate-300">
                                    {isAllFilteredSelected ? 'إلغاء تحديد الكل' : 'تحديد كل الروابط المصفاة'}
                                </span>
                            </div>

                            {/* List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredLinks.map(link => {
                                    const uniqueKey = `${link.category}_${link.id}`;
                                    const isSelected = selectedLinkIds.has(uniqueKey);
                                    return (
                                        <div
                                            key={uniqueKey}
                                            onClick={() => toggleSelectLink(uniqueKey)}
                                            className={`group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                                                isSelected
                                                    ? 'bg-slate-950/60 border-emerald-500/50 hover:border-emerald-500'
                                                    : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center transition-all ${
                                                isSelected 
                                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                    : 'border-slate-700 bg-slate-950 group-hover:border-slate-600'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                        {link.name}
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50 flex-shrink-0">
                                                        {link.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono truncate mt-1">
                                                    {link.converted}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                    <div className="text-xs text-slate-400">
                        تم تحديد <span className="font-bold text-emerald-400">{selectedLinkIds.size}</span> رابط
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedLinkIds.size === 0}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-lg shadow-emerald-950/20"
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            استيراد الروابط المحددة
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
