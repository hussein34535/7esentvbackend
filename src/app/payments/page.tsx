'use client';

import { useState, useEffect } from 'react';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/app/actions';
import { Plus, Edit, Trash2, CreditCard, Search, X } from 'lucide-react';

type MethodRow = {
    id: number;
    name: string;
    number?: string | null;
    instructions?: string | null;
    input_label?: string | null;
    image?: unknown;
    is_active: boolean;
};

type MethodFormData = {
    name: string;
    number: string;
    instructions: string;
    input_label: string;
    image: unknown;
    is_active: boolean;
};

export default function Payments() {
    const [methods, setMethods] = useState<MethodRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<MethodFormData>({
        name: '',
        number: '',
        instructions: '',
        input_label: '',
        image: null,
        is_active: true
    });

    const loadMethods = async () => {
        try {
            const data = await getPaymentMethods();
            setMethods((data || []) as MethodRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMethods();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            await updatePaymentMethod(editingId, formData);
        } else {
            await createPaymentMethod(formData);
        }
        setIsModalOpen(false);
        loadMethods();
    };

    const handleEdit = (method: MethodRow) => {
        setEditingId(method.id);
        setFormData({
            name: method.name,
            number: method.number || '',
            instructions: method.instructions || '',
            input_label: method.input_label || '',
            image: method.image,
            is_active: method.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure?')) {
            await deletePaymentMethod(id);
            loadMethods();
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', number: '', instructions: '', input_label: '', image: null, is_active: true });
        setIsModalOpen(true);
    };

    const filteredMethods = methods.filter(m =>
        (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.number && m.number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputSkin = "w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors";
    const btnFocus = "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Payment Methods</h1>
                    <p className="text-sm text-inksoft mt-1">Manage payment options for users</p>
                    {!loading && (
                        <p className="text-xs md:text-sm text-inkmute mt-1">
                            {filteredMethods.length} of {methods.length} methods
                        </p>
                    )}
                </div>
                <button
                    onClick={resetForm}
                    className={`inline-flex items-center justify-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm shrink-0 ${btnFocus}`}
                >
                    <Plus className="w-4 h-4" />
                    Add Method
                </button>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-inkmute w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search methods..."
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
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-line rounded-2xl p-4 md:p-5 space-y-4">
                            <div className="h-5 w-1/2 bg-surface2 rounded animate-pulse" />
                            <div className="h-12 w-full bg-surface2 rounded-xl animate-pulse" />
                            <div className="h-3 w-full bg-surface2 rounded animate-pulse" />
                            <div className="h-9 w-full bg-surface2 rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filteredMethods.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <CreditCard className="w-10 h-10 text-inkmute/40" />
                    <p className="text-sm text-inksoft">No payment methods found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredMethods.map((method) => (
                        <div key={method.id} className="bg-surface border border-line rounded-2xl p-4 md:p-5 flex flex-col hover:border-accent/40 hover:shadow-cardhover transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-inkmute" />
                                    {method.name}
                                </h3>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${method.is_active ? 'bg-accentsoft text-accentstrong' : 'bg-surface2 text-inkmute'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${method.is_active ? 'bg-accent' : 'bg-inkmute/60'}`} />
                                    {method.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mb-4 px-3 py-2.5 bg-surface2 rounded-[10px] border border-line font-mono text-base text-ink text-center tabular-nums tracking-wider truncate" dir="ltr">
                                {method.number || 'No Number'}
                            </div>

                            {method.instructions && (
                                <p className="text-sm text-inksoft mb-5 line-clamp-3">
                                    {method.instructions}
                                </p>
                            )}

                            <div className="flex justify-end gap-1 mt-auto border-t border-line pt-4">
                                <button
                                    onClick={() => handleEdit(method)}
                                    aria-label={`Edit ${method.name}`}
                                    className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors ${btnFocus}`}
                                >
                                    <Edit className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    onClick={() => handleDelete(method.id)}
                                    aria-label={`Delete ${method.name}`}
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
                    <div className="bg-surface border border-line rounded-2xl shadow-cardhover p-5 md:p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-ink mb-4">{editingId ? 'Edit Method' : 'New Method'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Method Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={inputSkin}
                                    placeholder="Vodafone Cash"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Number / Account ID</label>
                                <input
                                    required
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    className={`${inputSkin} font-mono tabular-nums`}
                                    placeholder="010XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">Instructions (Optional)</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                    className={`${inputSkin} min-h-[80px] resize-y`}
                                    placeholder="Send screenshot after payment..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">User Input Label (What to ask user for)</label>
                                <input
                                    value={formData.input_label}
                                    onChange={e => setFormData({ ...formData, input_label: e.target.value })}
                                    className={inputSkin}
                                    placeholder="e.g. رقم محفظة فودافون / Account Number"
                                />
                            </div>

                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                                />
                                <span className="text-sm text-inksoft">Active</span>
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
                                    Save Method
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
