'use client';

import { useState, useEffect } from 'react';
import { getPackages, createPackage, updatePackage, deletePackage } from '@/app/actions';
import { Plus, Edit, Trash2, Tag, Check, Search, X, Package as PackageIcon } from 'lucide-react';

type PackageRow = {
    id: number;
    name: string;
    description?: string | null;
    price?: number;
    sale_price?: number | null;
    duration_days?: number | null;
    duration_months?: number | null;
    discount_months?: number | null;
    features?: string[] | null;
    is_active: boolean;
};

export default function Packages() {
    const [packages, setPackages] = useState<PackageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        price: number;
        sale_price?: number;
        duration_months: number;
        discount_months: number;
        features: string;
        is_active: boolean;
    }>({
        name: '',
        description: '',
        price: 0,
        sale_price: undefined,
        duration_months: 1,
        discount_months: 0,
        features: '',
        is_active: true
    });

    const loadPackages = async () => {
        try {
            const data = await getPackages();
            setPackages((data || []) as PackageRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            features: formData.features.split('\n').filter(f => f.trim())
        };

        if (editingId) {
            await updatePackage(editingId, data);
        } else {
            await createPackage(data);
        }
        setIsModalOpen(false);
        loadPackages();
    };

    const handleEdit = (pkg: PackageRow) => {
        setEditingId(pkg.id);
        setFormData({
            name: pkg.name,
            description: pkg.description || '',
            price: pkg.price || 0,
            sale_price: pkg.sale_price || undefined,
            duration_months: pkg.duration_months || (pkg.duration_days ? Math.round(pkg.duration_days / 30) : 1),
            discount_months: pkg.discount_months || 0,
            features: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
            is_active: pkg.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure?')) {
            await deletePackage(id);
            loadPackages();
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', price: 0, sale_price: undefined, duration_months: 1, discount_months: 0, features: '', is_active: true });
        setIsModalOpen(true);
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.name && pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputSkin = "w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors";
    const btnFocus = "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Packages</h1>
                    <p className="text-sm text-inksoft mt-1">Manage subscription plans and pricing</p>
                    {!loading && (
                        <p className="text-xs md:text-sm text-inkmute mt-1">
                            {filteredPackages.length} of {packages.length} packages
                        </p>
                    )}
                </div>
                <button
                    onClick={resetForm}
                    className={`inline-flex items-center justify-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm shrink-0 ${btnFocus}`}
                >
                    <Plus className="w-4 h-4" />
                    Create Package
                </button>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-inkmute w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-9 py-2.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-inkmute hover:text-ink hover:bg-surface transition-colors ${btnFocus}`}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-line rounded-2xl p-4 md:p-5 space-y-4">
                            <div className="h-5 w-1/2 bg-surface2 rounded animate-pulse" />
                            <div className="h-8 w-2/3 bg-surface2 rounded animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-surface2 rounded animate-pulse" />
                                <div className="h-3 w-4/5 bg-surface2 rounded animate-pulse" />
                            </div>
                            <div className="h-9 w-full bg-surface2 rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filteredPackages.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <PackageIcon className="w-10 h-10 text-inkmute/40" />
                    <p className="text-sm text-inksoft">No packages found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredPackages.map((pkg) => (
                        <div key={pkg.id} className="bg-surface border border-line rounded-2xl p-4 md:p-5 flex flex-col hover:border-accent/40 hover:shadow-cardhover transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-ink">{pkg.name}</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-inksoft text-sm tabular-nums">
                                            {pkg.duration_months ? `${pkg.duration_months} Month(s)` : `${Math.round((pkg.duration_days || 30) / 30)} Month(s)`}
                                            <span className="text-inkmute text-xs ml-1">({pkg.duration_days} Days)</span>
                                        </p>
                                        {(pkg.discount_months ?? 0) > 0 && (
                                            <span className="inline-flex items-center gap-1 self-start bg-warnsoft text-warn text-xs font-semibold px-2 py-0.5 rounded-full">
                                                <Tag className="w-3 h-3" />
                                                {pkg.discount_months === 1 ? 'خصم شهر واحد' : pkg.discount_months === 2 ? 'خصم شهرين' : `خصم ${pkg.discount_months} شهور`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-successsoft text-success' : 'bg-surface2 text-inkmute'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pkg.is_active ? 'bg-accent' : 'bg-inkmute/60'}`} />
                                    {pkg.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mb-5">
                                {pkg.sale_price ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-ink tabular-nums">${pkg.sale_price}</span>
                                        <span className="text-lg text-inkmute line-through tabular-nums">${pkg.price}</span>
                                    </div>
                                ) : (
                                    <span className="text-3xl font-bold text-ink tabular-nums">${pkg.price}</span>
                                )}
                            </div>

                            <ul className="space-y-2 mb-5 text-sm text-inksoft">
                                {Array.isArray(pkg.features) && pkg.features.map((feat: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-accent shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex justify-end gap-1 mt-auto border-t border-line pt-4">
                                <button
                                    onClick={() => handleEdit(pkg)}
                                    aria-label={`Edit ${pkg.name}`}
                                    className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors ${btnFocus}`}
                                >
                                    <Edit className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pkg.id)}
                                    aria-label={`Delete ${pkg.name}`}
                                    className={`p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${btnFocus}`}
                                >
                                    <Trash2 className="w-[18px] h-[18px]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-line rounded-2xl shadow-cardhover p-5 md:p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold text-ink mb-4">{editingId ? 'Edit Package' : 'New Package'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={inputSkin}
                                    placeholder="e.g. Premium Monthly"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-inksoft mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className={`${inputSkin} tabular-nums`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-inksoft mb-1">Sale Price (Optional) ($)</label>
                                    <input
                                        type="number"
                                        value={formData.sale_price || ''}
                                        onChange={e => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : undefined })}
                                        className={`${inputSkin} tabular-nums`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-inksoft mb-1">Duration (Months)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={formData.duration_months}
                                        onChange={e => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                                        className={`${inputSkin} tabular-nums`}
                                        placeholder="e.g. 12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-inksoft mb-1">Discount (Months)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.discount_months}
                                        onChange={e => setFormData({ ...formData, discount_months: Number(e.target.value) })}
                                        className={`${inputSkin} tabular-nums`}
                                        placeholder="e.g. 2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className={`${inputSkin} min-h-[80px] resize-y`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Features (One per line)</label>
                                <textarea
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    className={`${inputSkin} min-h-[100px] resize-y`}
                                    placeholder="No Ads&#10;4K Streaming&#10;Priority Support"
                                />
                            </div>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                />
                                <span className="text-sm text-inksoft">Active (Visible to users)</span>
                            </label>

                            <div className="flex gap-3 pt-4 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-surface border border-line hover:bg-surface2 text-ink text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnFocus}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-2.5 rounded-[10px] bg-accent hover:bg-accentstrong text-white font-medium text-sm shadow-sm transition-all duration-200 active:scale-[0.98] ${btnFocus}`}
                                >
                                    Save Package
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
