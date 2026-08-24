'use client';

import { useState, useEffect, useMemo } from 'react';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/app/actions';
import { Plus, Edit, Trash2, Tag, Check, Search, ArrowUpDown, ChevronDown, XSquare } from 'lucide-react';

const btnBase = 'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const inputSkin = `w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${btnBase}`;
const fieldLabel = 'block text-sm font-medium text-ink mb-1.5';

type SortOption = 'code-asc' | 'discount-desc' | 'uses-desc';

type PromoCode = {
    code: string;
    discount_percent: number;
    max_uses: number;
    expires_at?: string | null;
    is_active: boolean;
    used_count?: number;
};

export default function Coupons() {
    const [coupons, setCoupons] = useState<PromoCode[]>([]);
    const [nowTs, setNowTs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_percent: 10,
        max_uses: -1,
        expires_at: '',
        is_active: true
    });

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('code-asc');

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const data = await getPromoCodes();
            setCoupons((data || []) as PromoCode[]);
            setNowTs(Date.now());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const filtered = useMemo(() => {
        let list = [...coupons];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(c => (c.code || '').toLowerCase().includes(q));
        }
        switch (sortBy) {
            case 'discount-desc': list.sort((a, b) => b.discount_percent - a.discount_percent); break;
            case 'uses-desc': list.sort((a, b) => (b.used_count || 0) - (a.used_count || 0)); break;
            default: list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        }
        return list;
    }, [coupons, search, sortBy]);

    const isExpired = (coupon: PromoCode) =>
        !!coupon.expires_at && new Date(coupon.expires_at).getTime() < nowTs;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            max_uses: Number(formData.max_uses),
            discount_percent: Number(formData.discount_percent),
            expires_at: formData.expires_at || null
        };

        if (editingCode) {
            await updatePromoCode(editingCode, data);
        } else {
            await createPromoCode(data);
        }
        setIsModalOpen(false);
        loadCoupons();
    };

    const handleEdit = (coupon: PromoCode) => {
        setEditingCode(coupon.code);
        setFormData({
            code: coupon.code,
            discount_percent: coupon.discount_percent,
            max_uses: coupon.max_uses,
            expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
            is_active: coupon.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (code: string) => {
        if (confirm('Are you sure?')) {
            await deletePromoCode(code);
            loadCoupons();
        }
    };

    const resetForm = () => {
        setEditingCode(null);
        setFormData({ code: '', discount_percent: 10, max_uses: -1, expires_at: '', is_active: true });
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Promo Codes</h1>
                    <p className="text-xs md:text-sm text-inkmute mt-1">
                        {loading ? '…' : `${filtered.length} of ${coupons.length} codes`}
                    </p>
                </div>
                <button
                    onClick={resetForm}
                    className={`inline-flex items-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${btnBase}`}
                >
                    <Plus className="w-4 h-4" />
                    Create Code
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by code…"
                        className={`w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-9 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${btnBase}`}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkmute hover:text-ink transition-colors"
                        >
                            <XSquare className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={`appearance-none bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-8 py-2 text-sm text-ink outline-none transition-colors cursor-pointer w-full sm:w-auto ${btnBase}`}
                    >
                        <option value="code-asc">Code A → Z</option>
                        <option value="discount-desc">Discount high → low</option>
                        <option value="uses-desc">Most used</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-surface2 rounded-2xl h-44 animate-pulse" />
                    ))}
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-20 bg-surface border border-line rounded-2xl">
                    <Tag className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft mb-1">No promo codes found</p>
                    <p className="text-xs text-inkmute mb-4">Create your first discount code to get started</p>
                    <button onClick={resetForm} className={`inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accentstrong transition-colors ${btnBase}`}>
                        <Plus className="w-4 h-4" /> Create Code
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-surface border border-line rounded-2xl">
                    <Tag className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                    <p className="text-sm text-inksoft mb-3">No matching codes</p>
                    <button onClick={() => setSearch('')} className={`text-sm font-medium text-accent hover:text-accentstrong transition-colors ${btnBase}`}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filtered.map((coupon) => {
                        const expired = isExpired(coupon);

                        return (
                            <div key={coupon.code} className="bg-surface border border-line rounded-2xl p-4 md:p-5 transition-all duration-200 hover:border-accent/40 hover:shadow-cardhover flex flex-col">
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <span className="font-mono bg-surface2 border border-line px-2 py-0.5 rounded-md text-ink text-base font-semibold tracking-wide break-all">
                                        {coupon.code}
                                    </span>
                                    {expired ? (
                                        <span className="inline-flex items-center gap-1.5 shrink-0 bg-dangersoft text-danger text-xs font-medium px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Expired
                                        </span>
                                    ) : coupon.is_active ? (
                                        <span className="inline-flex items-center gap-1.5 shrink-0 bg-successsoft text-success text-xs font-medium px-2 py-1 rounded-md">
                                            <Check className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 shrink-0 bg-surface2 border border-line text-inkmute text-xs font-medium px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-inkmute" /> Inactive
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-ink tabular-nums">{coupon.discount_percent}%</span>
                                    <span className="text-sm text-inksoft ml-2">OFF</span>
                                </div>

                                <div className="space-y-1.5 text-sm text-inksoft mb-5">
                                    <div className="flex justify-between">
                                        <span>Uses:</span>
                                        <span className="text-ink tabular-nums">
                                            {coupon.used_count} / {coupon.max_uses === -1 ? '∞' : coupon.max_uses}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Expires:</span>
                                        <span className={`tabular-nums ${expired ? 'text-danger' : 'text-ink'}`}>
                                            {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-1 mt-auto border-t border-line pt-4">
                                    <button
                                        onClick={() => handleEdit(coupon)}
                                        title="Edit"
                                        className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors ${btnBase}`}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.code)}
                                        title="Delete"
                                        className={`p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${btnBase}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-cardhover max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-ink mb-4">{editingCode ? 'Edit Coupon' : 'New Coupon'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!editingCode && (
                                <div>
                                    <label className={fieldLabel}>Code (Uppercase)</label>
                                    <input
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className={`${inputSkin} font-mono`}
                                        placeholder="SUMMER2026"
                                    />
                                </div>
                            )}
                            <div>
                                <label className={fieldLabel}>Discount %</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.discount_percent}
                                    onChange={e => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                                    className={inputSkin}
                                />
                            </div>
                            <div>
                                <label className={fieldLabel}>Max Uses (-1 for infinite)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.max_uses}
                                    onChange={e => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                                    className={inputSkin}
                                />
                            </div>
                            <div>
                                <label className={fieldLabel}>Expires At (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    className={inputSkin}
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded accent-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none cursor-pointer"
                                />
                                <span className="text-sm text-ink">Active</span>
                            </label>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-surface border border-line hover:bg-surface2 text-ink text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-2.5 rounded-[10px] bg-accent hover:bg-accentstrong text-white text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${btnBase}`}
                                >
                                    Save Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
