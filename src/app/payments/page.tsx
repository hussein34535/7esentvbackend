'use client';

import { useState, useEffect } from 'react';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/app/actions';
import { Plus, Edit, Trash2, CreditCard, Check, X, Loader2 } from 'lucide-react';

export default function Payments() {
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        instructions: '',
        input_label: '',
        image: null as any,
        is_active: true
    });

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        setLoading(true);
        const data = await getPaymentMethods();
        setMethods(data);
        setLoading(false);
    };

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

    const handleEdit = (method: any) => {
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

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Payment Methods
                    </h1>
                    <p className="text-slate-400 mt-1">Manage payment options for users</p>
                </div>
                <button
                    onClick={resetForm}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Add Method
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.map((method) => (
                        <div key={method.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group hover:border-emerald-500/30 transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                    {method.name}
                                </h3>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${method.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                    {method.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-700 font-mono text-lg text-emerald-400 text-center tracking-wider">
                                {method.number || 'No Number'}
                            </div>

                            {method.instructions && (
                                <p className="text-sm text-slate-400 mb-6 line-clamp-3">
                                    {method.instructions}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 mt-auto border-t border-slate-700 pt-4">
                                <button
                                    onClick={() => handleEdit(method)}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(method.id)}
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
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Method' : 'New Method'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Method Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                    placeholder="Vodafone Cash"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Number / Account ID</label>
                                <input
                                    required
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 font-mono"
                                    placeholder="010XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Instructions (Optional)</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                    placeholder="Send screenshot after payment..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">User Input Label (What to ask user for)</label>
                                <input
                                    value={formData.input_label}
                                    onChange={e => setFormData({ ...formData, input_label: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                    placeholder="e.g. رقم محفظة فودافون / Account Number"
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
