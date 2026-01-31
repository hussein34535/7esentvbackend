'use client';

import { useState, useEffect } from 'react';
import { getUsers, addSubscription, getPackages, updateUserStatus } from '@/app/actions';
import { Plus, Search, Calendar, User, Loader2, CheckCircle, XCircle, AlertCircle, Ban, RefreshCw } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [packages, setPackages] = useState<any[]>([]);

    // Add Subscription State
    const [isAdding, setIsAdding] = useState(false);
    const [email, setEmail] = useState('');
    const [duration, setDuration] = useState('30'); // days
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [usersData, packagesData] = await Promise.all([
            getUsers(),
            getPackages()
        ]);
        setUsers(usersData);
        setPackages(packagesData);
        setLoading(false);
    };

    const handleAddSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        let planId = selectedPackage ? Number(selectedPackage) : undefined;
        const result = await addSubscription(email, Number(duration), planId);

        if (result.success) {
            alert(result.message);
            setIsAdding(false);
            setEmail('');
            loadData();
        } else {
            alert('Error: ' + result.error);
        }
        setProcessing(false);
    };

    const handleStatusChange = async (uid: string, newStatus: string) => {
        if (!confirm(`Change status to ${newStatus}?`)) return;
        const result = await updateUserStatus(uid, newStatus);
        if (result.success) {
            loadData();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isActive = (dateString: string) => {
        if (!dateString) return false;
        return new Date(dateString) > new Date();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage users and subscriptions</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Add Subscription
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add Subscription</h2>
                        <form onSubmit={handleAddSubscription} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">User Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Assign Package (Optional)</label>
                                <select
                                    value={selectedPackage}
                                    onChange={e => {
                                        setSelectedPackage(e.target.value);
                                        const pkg = packages.find(p => p.id === Number(e.target.value));
                                        if (pkg) setDuration(pkg.duration_days.toString());
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- Custom Duration --</option>
                                    {packages.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.duration_days} days)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Duration (Days)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-3 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Add Subscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition"
                />
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading users...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                    No users found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredUsers.map(user => {
                        const isSub = isActive(user.subscription_end);
                        const isBanned = user.status === 'banned';

                        return (
                            <div key={user.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-emerald-500/30 transition shadow-sm">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            {user.email}
                                            {user.plan_name && (
                                                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                                    {user.plan_name}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className="font-mono text-xs opacity-50">{user.id}</span>
                                            {user.joined_at && <span>• Joined {new Date(user.joined_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className={`flex items-center justify-end gap-1.5 mb-1 font-medium ${isBanned ? 'text-red-500' : isSub ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {isBanned ? (
                                                <><Ban className="w-4 h-4" /> BANNED</>
                                            ) : isSub ? (
                                                <><CheckCircle className="w-4 h-4" /> Active</>
                                            ) : (
                                                <><XCircle className="w-4 h-4" /> Expired</>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 justify-end">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'No Sub'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isBanned ? (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'active')}
                                                className="p-2 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition"
                                                title="Unban"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'banned')}
                                                className="p-2 text-rose-400 hover:bg-rose-900/20 rounded-lg transition"
                                                title="Ban User"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        )}

                                        {isSub && !isBanned && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'cancelled')}
                                                className="p-2 text-amber-400 hover:bg-amber-900/20 rounded-lg transition"
                                                title="Cancel Subscription"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
