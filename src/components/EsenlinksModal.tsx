'use client';

import { useState, useEffect } from 'react';
import { fetchEsenlinks } from '@/app/actions';
import { StreamItem } from '@/lib/stream-utils';
import { Search, X, Link2, Check, Loader2, Sparkles, Filter } from 'lucide-react';

interface EsenlinkItem {
    id: string | number;
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
    const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string | number>>(new Set());

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 font-sans">
            <div className="relative w-full max-w-3xl bg-surface border border-line rounded-2xl shadow-cardhover overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg text-accentstrong">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-ink">إستيراد من 7esenlink</h2>
                            <p className="text-xs text-inkmute mt-0.5">اختر الروابط والقنوات التي تود إضافتها</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        aria-label="Close"
                        className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-5 py-3 border-b border-line bg-surface flex flex-col md:flex-row gap-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ابحث عن رابط أو قناة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface2 border border-line focus:border-violet-500/60 focus:bg-surface rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1">
                        <Filter className="w-4 h-4 text-inkmute shrink-0" />
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                                selectedCategory === 'all'
                                    ? 'bg-violet-500 border-violet-500 text-white'
                                    : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                            }`}
                        >
                            الكل
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap capitalize ${
                                    selectedCategory === cat
                                        ? 'bg-violet-500 border-violet-500 text-white'
                                        : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            <span className="text-sm text-inksoft">جاري تحميل الروابط من السيرفر...</span>
                        </div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="text-center py-20">
                            <Link2 className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                            <p className="text-sm text-inksoft">لم يتم العثور على روابط تطابق البحث.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Select All Toggle */}
                            <div 
                                onClick={toggleSelectAllFiltered}
                                className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-surface2/60 border border-line rounded-xl cursor-pointer transition-colors select-none hover:border-inkmute/40"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isAllFilteredSelected 
                                        ? 'bg-violet-500 border-violet-500 text-white' 
                                        : 'border-inkmute/50 bg-surface'
                                }`}>
                                    {isAllFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-semibold text-inksoft">
                                    {isAllFilteredSelected ? 'إلغاء تحديد الكل' : 'تحديد كل الروابط المصفاة'}
                                </span>
                            </div>

                            {/* List rows */}
                            <div className="divide-y divide-line">
                                {filteredLinks.map(link => {
                                    const uniqueKey = `${link.category}_${link.id}`;
                                    const isSelected = selectedLinkIds.has(uniqueKey);
                                    return (
                                        <div
                                            key={uniqueKey}
                                            onClick={() => toggleSelectLink(uniqueKey)}
                                            className={`group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors select-none ${
                                                isSelected ? 'bg-violet-500/10' : 'hover:bg-surface2/60'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex shrink-0 items-center justify-center transition-colors ${
                                                isSelected 
                                                    ? 'bg-violet-500 border-violet-500 text-white' 
                                                    : 'border-inkmute/50 bg-surface group-hover:border-inkmute'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-accentstrong' : 'text-ink'}`}>
                                                        {link.name}
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface2 border border-line text-inksoft shrink-0 capitalize">
                                                        {link.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-inkmute truncate mt-0.5">
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
                <div className="px-5 py-4 border-t border-line bg-surface flex items-center justify-between shrink-0">
                    <div className="text-xs text-inkmute">
                        تم تحديد <span className="font-bold text-accentstrong">{selectedLinkIds.size}</span> رابط
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-[10px] text-sm font-medium bg-surface border border-line hover:bg-surface2 text-ink transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedLinkIds.size === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium btn-gradient-red text-white transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <Link2 className="w-4 h-4" />
                            استيراد الروابط المحددة
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
