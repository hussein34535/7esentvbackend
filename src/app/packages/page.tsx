'use client';

import { useState, useEffect } from 'react';
import { getPackages, createPackage, updatePackage, deletePackage } from '@/app/actions';
import { Plus, Edit, Trash2, Tag, Calendar, Check, X, Loader2 } from 'lucide-react';

export default function Packages() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        features: '',
        is_active: true
    });

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        const data = await getPackages();
        setPackages(data);
        setLoading(false);
    };

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

    const handleEdit = (pkg: any) => {
        setEditingId(pkg.id);
        setFormData({
            name: pkg.name,
            description: pkg.description || '',
            price: pkg.price,
            duration_days: pkg.duration_days,
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
        setFormData({ name: '', description: '', price: 0, duration_days: 30, features: '', is_active: true });
        setIsModalOpen(true);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Packages
                    </h1>
                    <p className="text-slate-400 mt-1">Manage subscription plans and pricing</p>
                </div>
                <button
                    onClick={resetForm}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Create Package
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group hover:border-emerald-500/30 transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                                    <p className="text-slate-400 text-sm">{pkg.duration_days} Days</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${pkg.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                    {pkg.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-white">${pkg.price}</span>
                            </div>

                            <ul className="space-y-2 mb-6 text-sm text-slate-300">
                                {Array.isArray(pkg.features) && pkg.features.map((feat: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex justify-end gap-2 mt-auto border-t border-slate-700 pt-4">
                                <button
                                    onClick={() => handleEdit(pkg)}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(pkg.id)}
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
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Package' : 'New Package'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                    placeholder="e.g. Premium Monthly"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Duration (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.duration_days}
                                        onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Features (One per line)</label>
                                <textarea
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 min-h-[100px]"
                                    placeholder="No Ads&#10;4K Streaming&#10;Priority Support"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300">Active (Visible to users)</span>
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
