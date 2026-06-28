'use client';

import { useState, useEffect } from 'react';
import { getUsers, addSubscription, getPackages, updateUserStatus, updateUserSubscription } from '@/app/actions';
import { Plus, Search, Calendar, User, Loader2, CheckCircle, XCircle, AlertCircle, Ban, RefreshCw, Edit } from 'lucide-react';

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

    // Edit Subscription State
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editSubEnd, setEditSubEnd] = useState('');
    const [editPlanId, setEditPlanId] = useState<string>('');
    const [daysModifier, setDaysModifier] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

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
            alert('تم إضافة الاشتراك بنجاح!');
            setIsAdding(false);
            setEmail('');
            loadData();
        } else {
            alert('خطأ: ' + result.error);
        }
        setProcessing(false);
    };

    const handleStatusChange = async (uid: string, newStatus: string) => {
        const arabicStatus = newStatus === 'banned' ? 'حظر' : newStatus === 'active' ? 'تنشيط' : 'إلغاء اشتراك';
        if (!confirm(`هل أنت متأكد من تغيير حالة الحساب إلى (${arabicStatus})؟`)) return;
        const result = await updateUserStatus(uid, newStatus);
        if (result.success) {
            loadData();
        } else {
            alert('خطأ: ' + result.error);
        }
    };

    const startEditing = (user: any) => {
        setEditingUser(user);
        setEditPlanId(user.plan_id ? user.plan_id.toString() : '');
        setDaysModifier('');
        if (user.subscription_end) {
            const dateObj = new Date(user.subscription_end);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            setEditSubEnd(`${year}-${month}-${day}`);
        } else {
            setEditSubEnd('');
        }
    };

    const adjustDays = (days: number) => {
        let baseDate = editSubEnd ? new Date(editSubEnd) : new Date();
        if (isNaN(baseDate.getTime())) {
            baseDate = new Date();
        }
        baseDate.setDate(baseDate.getDate() + days);
        const year = baseDate.getFullYear();
        const month = String(baseDate.getMonth() + 1).padStart(2, '0');
        const day = String(baseDate.getDate()).padStart(2, '0');
        setEditSubEnd(`${year}-${month}-${day}`);
    };

    const handleDaysModifierChange = (val: string) => {
        setDaysModifier(val);
        const num = Number(val);
        if (!isNaN(num) && val !== '') {
            let baseDate = editingUser.subscription_end ? new Date(editingUser.subscription_end) : new Date();
            if (isNaN(baseDate.getTime())) baseDate = new Date();
            
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + num);
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const day = String(newDate.getDate()).padStart(2, '0');
            setEditSubEnd(`${year}-${month}-${day}`);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setSavingEdit(true);
        
        const planId = editPlanId ? Number(editPlanId) : null;
        let subEndISO = null;
        if (editSubEnd) {
            const dateObj = new Date(editSubEnd);
            dateObj.setHours(23, 59, 59, 999);
            subEndISO = dateObj.toISOString();
        }

        const result = await updateUserSubscription(editingUser.id, subEndISO, planId);
        if (result.success) {
            alert('تم تعديل الاشتراك بنجاح!');
            setEditingUser(null);
            loadData();
        } else {
            alert('خطأ أثناء حفظ التعديلات: ' + result.error);
        }
        setSavingEdit(false);
    };

    const filteredUsers = users.filter(user =>
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.id && user.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isActive = (dateString: string) => {
        if (!dateString) return false;
        return new Date(dateString) > new Date();
    };

    return (
        <div className="p-8" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        إدارة المستخدمين والاشتراكات
                    </h1>
                    <p className="text-slate-400 mt-1">إدارة حسابات المستخدمين، باقاتهم وفترات اشتراكهم</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 text-sm font-semibold"
                >
                    <Plus size={18} />
                    إضافة اشتراك يدوي
                </button>
            </div>

            {/* Modal: Add Subscription */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">إضافة اشتراك يدوي جديد</h2>
                        <form onSubmit={handleAddSubscription} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">البريد الإلكتروني للمستخدم</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ربط بباقة محددة (اختياري)</label>
                                <select
                                    value={selectedPackage}
                                    onChange={e => {
                                        setSelectedPackage(e.target.value);
                                        const pkg = packages.find(p => p.id === Number(e.target.value));
                                        if (pkg) setDuration(pkg.duration_days.toString());
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- مدة مخصصة بالأيام --</option>
                                    {packages.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.duration_days} يوم)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">المدة بالأيام</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-3 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {processing ? 'جاري المعالجة...' : 'إضافة الاشتراك'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Subscription */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-400" />
                            تعديل اشتراك الحساب
                        </h2>
                        
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">البريد الإلكتروني للمستخدم</label>
                                <input
                                    type="email"
                                    disabled
                                    value={editingUser.email}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">الباقة الحالية</label>
                                <div className="flex gap-2">
                                    <select
                                        value={editPlanId}
                                        onChange={e => setEditPlanId(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-slate-200 outline-none transition"
                                    >
                                        <option value="">بدون باقة</option>
                                        {packages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.duration_days} يوم)</option>
                                        ))}
                                    </select>
                                    
                                    {editPlanId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const pkg = packages.find(p => p.id === Number(editPlanId));
                                                if (pkg) {
                                                    const today = new Date();
                                                    today.setDate(today.getDate() + pkg.duration_days);
                                                    const year = today.getFullYear();
                                                    const month = String(today.getMonth() + 1).padStart(2, '0');
                                                    const day = String(today.getDate()).padStart(2, '0');
                                                    setEditSubEnd(`${year}-${month}-${day}`);
                                                    setDaysModifier('');
                                                }
                                            }}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-blue-400 transition"
                                            title="تعيين تاريخ انتهاء الباقة الافتراضي"
                                        >
                                            تطبيق المدة
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">تاريخ انتهاء الاشتراك</label>
                                <input
                                    type="date"
                                    value={editSubEnd}
                                    onChange={e => {
                                        setEditSubEnd(e.target.value);
                                        setDaysModifier('');
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-slate-200 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">تعديل بعدد الأيام (إضافة / خصم)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="مثال: +10 أو -5"
                                        value={daysModifier}
                                        onChange={e => handleDaysModifierChange(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700"
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => adjustDays(30)}
                                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold transition"
                                        >
                                            +30 يوم
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => adjustDays(-7)}
                                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition"
                                        >
                                            -7 أيام
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-800 hover:bg-slate-850 text-sm font-semibold transition text-slate-400 hover:text-white"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                >
                                    {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mb-6 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="ابحث عن مستخدمين بالبريد الإلكتروني أو المعرّف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm text-slate-200"
                />
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    جاري تحميل المستخدمين...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                    لم يتم العثور على أي مستخدمين.
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
                                    <div className="text-right">
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            {user.email}
                                            {user.plan_name && (
                                                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                                                    {user.plan_name}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className="font-mono text-xs opacity-50">{user.id}</span>
                                            {user.joined_at && <span>• انضم في {new Date(user.joined_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-left md:text-right">
                                        <div className={`flex items-center justify-start md:justify-end gap-1.5 mb-1 font-medium ${isBanned ? 'text-red-500' : isSub ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {isBanned ? (
                                                <><Ban className="w-4 h-4" /> محظور</>
                                            ) : isSub ? (
                                                <><CheckCircle className="w-4 h-4" /> نشط</>
                                            ) : (
                                                <><XCircle className="w-4 h-4" /> منتهي</>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 justify-start md:justify-end">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'بدون اشتراك'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEditing(user)}
                                            className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition"
                                            title="تعديل باقة واشتراك الحساب"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {isBanned ? (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'active')}
                                                className="p-2 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition"
                                                title="إلغاء الحظر"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'banned')}
                                                className="p-2 text-rose-400 hover:bg-rose-900/20 rounded-lg transition"
                                                title="حظر الحساب"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        )}

                                        {isSub && !isBanned && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'cancelled')}
                                                className="p-2 text-amber-400 hover:bg-amber-900/20 rounded-lg transition"
                                                title="إلغاء الاشتراك"
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
