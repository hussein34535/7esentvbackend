'use client';

import { useState, useEffect } from 'react';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/app/actions';
import { Plus, Edit, Trash2, Tag, Calendar, Check, X, Loader2 } from 'lucide-react';

export default function Coupons() {
    const [coupons, setCoupons] = useState<any[]>([]);
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

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        const data = await getPromoCodes();
        setCoupons(data);
        setLoading(false);
    };

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

    const handleEdit = (coupon: any) => {
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
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Promo Codes
                    </h1>
                    <p className="text-slate-400 mt-1">Manage discount codes and coupons</p>
                </div>
                <button
                    onClick={resetForm}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Create Code
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon) => (
                        <div key={coupon.code} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group hover:border-emerald-500/30 transition">
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-mono text-xl font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 border-dashed">
                                    {coupon.code}
                                </span>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${coupon.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                    {coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <span className="text-4xl font-bold text-emerald-400">{coupon.discount_percent}%</span>
                                <span className="text-slate-400 ml-2">OFF</span>
                            </div>

                            <div className="space-y-2 text-sm text-slate-400 mb-6">
                                <div className="flex justify-between">
                                    <span>Uses:</span>
                                    <span className="text-white">
                                        {coupon.used_count} / {coupon.max_uses === -1 ? '∞' : coupon.max_uses}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Expires:</span>
                                    <span className="text-white">
                                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-auto border-t border-slate-700 pt-4">
                                <button
                                    onClick={() => handleEdit(coupon)}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(coupon.code)}
                                    className="p-2 text-rose-400 hover:text-white bg-rose-900/20 hover:bg-rose-600 rounded-lg transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editingCode ? 'Edit Coupon' : 'New Coupon'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!editingCode && (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Code (Uppercase)</label>
                                    <input
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 font-mono"
                                        placeholder="SUMMER2026"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Discount %</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.discount_percent}
                                    onChange={e => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Max Uses (-1 for infinite)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.max_uses}
                                    onChange={e => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Expires At (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300">Active</span>
                            </label>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20"
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
