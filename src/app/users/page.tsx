'use client';

import { useState, useEffect } from 'react';
import { getUsers, addSubscription, getPackages, updateUserStatus, updateUserSubscription } from '@/app/actions';
import { Plus, Search, Calendar, CheckCircle, XCircle, Ban, RefreshCw, Edit, ChevronDown, X, Users as UsersIcon } from 'lucide-react';

type UserRow = {
    id: string;
    email?: string | null;
    photo_url?: string | null;
    status?: string | null;
    subscription_end?: string | null;
    joined_at?: string | null;
    plan_id?: number | null;
    plan_name?: string | null;
};

type PkgRow = {
    id: number;
    name: string;
    duration_days: number;
};

export default function Users() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [packages, setPackages] = useState<PkgRow[]>([]);

    // Add Subscription State
    const [isAdding, setIsAdding] = useState(false);
    const [email, setEmail] = useState('');
    const [duration, setDuration] = useState('30'); // days
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    // Edit Subscription State
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [editSubEnd, setEditSubEnd] = useState('');
    const [editPlanId, setEditPlanId] = useState<string>('');
    const [daysModifier, setDaysModifier] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const loadData = async () => {
        try {
            const [usersData, packagesData] = await Promise.all([
                getUsers(),
                getPackages()
            ]);
            setUsers((usersData || []) as unknown as UserRow[]);
            setPackages((packagesData || []) as PkgRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const planId = selectedPackage ? Number(selectedPackage) : undefined;
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

    const startEditing = (user: UserRow) => {
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
        if (!isNaN(num) && val !== '' && editingUser) {
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

    const isActive = (dateString?: string | null) => {
        if (!dateString) return false;
        return new Date(dateString) > new Date();
    };

    const filteredUsers = users.filter(user => {
        const isSub = isActive(user.subscription_end);
        const isBanned = user.status === 'banned';
        const matchesSearch =
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.id && user.id.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && isSub && !isBanned) ||
            (statusFilter === 'expired' && !isSub && !isBanned) ||
            (statusFilter === 'banned' && isBanned);
        return matchesSearch && matchesStatus;
    });

    const statusFilters = [
        { key: 'all', label: 'الكل' },
        { key: 'active', label: 'نشط' },
        { key: 'expired', label: 'منتهي' },
        { key: 'banned', label: 'محظور' },
    ];

    const inputSkin = "w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors";
    const btnFocus = "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
                        إدارة المستخدمين والاشتراكات
                    </h1>
                    <p className="text-sm text-inksoft mt-1">إدارة حسابات المستخدمين، باقاتهم وفترات اشتراكهم</p>
                    {!loading && (
                        <p className="text-xs md:text-sm text-inkmute mt-1">
                            {filteredUsers.length} من {users.length} مستخدم
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className={`inline-flex items-center justify-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm shrink-0 ${btnFocus}`}
                >
                    <Plus className="w-4 h-4" />
                    إضافة اشتراك يدوي
                </button>
            </div>
            <div className="mb-3 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmute w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="ابحث عن مستخدمين بالبريد الإلكتروني أو المعرّف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pr-9 pl-9 py-2.5 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        aria-label="مسح البحث"
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-inkmute hover:text-ink hover:bg-surface transition-colors ${btnFocus}`}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto mb-6 md:mb-8 pb-0.5">
                {statusFilters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 shrink-0 ${btnFocus} ${
                            statusFilter === f.key
                                ? 'bg-accent border-accent text-white'
                                : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface2 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-1/3 bg-surface2 rounded animate-pulse" />
                                <div className="h-3 w-1/4 bg-surface2 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-20 bg-surface2 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <UsersIcon className="w-10 h-10 text-inkmute/40" />
                    <p className="text-sm text-inksoft">لم يتم العثور على أي مستخدمين.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredUsers.map(user => {
                        const isSub = isActive(user.subscription_end);
                        const isBanned = user.status === 'banned';
                        const initial = (user.email || '?').charAt(0).toUpperCase();

                        return (
                            <div key={user.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-accent/40 hover:shadow-cardhover transition-all duration-200">
                                <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                                    {user.photo_url ? (
                                        <img
                                            src={user.photo_url ?? undefined}
                                            alt={user.email ?? 'User'}
                                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-line"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-accentsoft text-accentstrong font-semibold flex items-center justify-center shrink-0">
                                            {initial}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-ink truncate flex items-center gap-2">
                                            {user.email}
                                            {user.plan_name && (
                                                <span className="inline-flex items-center gap-1 shrink-0 bg-infosoft text-info px-2 py-0.5 rounded-full text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-info" />
                                                    {user.plan_name}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-inkmute mt-0.5">
                                            <span className="tabular-nums">{user.id}</span>
                                            {user.joined_at && <span>• انضم في {new Date(user.joined_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-1 ${
                                            isBanned ? 'bg-dangersoft text-danger' : isSub ? 'bg-successsoft text-success' : 'bg-dangersoft text-danger'
                                        }`}>
                                            {isBanned ? (
                                                <><Ban className="w-3.5 h-3.5" /> محظور</>
                                            ) : isSub ? (
                                                <><CheckCircle className="w-3.5 h-3.5" /> نشط</>
                                            ) : (
                                                <><XCircle className="w-3.5 h-3.5" /> منتهي</>
                                            )}
                                        </span>
                                        <div className="text-xs text-inkmute tabular-nums flex items-center gap-1.5 justify-end">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'بدون اشتراك'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEditing(user)}
                                            className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors ${btnFocus}`}
                                            title="تعديل باقة واشتراك الحساب"
                                        >
                                            <Edit className="w-[18px] h-[18px]" />
                                        </button>

                                        {isBanned ? (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'active')}
                                                className={`p-2 rounded-lg text-accentstrong hover:bg-accentsoft transition-colors ${btnFocus}`}
                                                title="إلغاء الحظر"
                                            >
                                                <RefreshCw className="w-[18px] h-[18px]" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'banned')}
                                                className={`p-2 rounded-lg text-inkmute hover:text-danger hover:bg-dangersoft transition-colors ${btnFocus}`}
                                                title="حظر الحساب"
                                            >
                                                <Ban className="w-[18px] h-[18px]" />
                                            </button>
                                        )}

                                        {isSub && !isBanned && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'cancelled')}
                                                className={`p-2 rounded-lg text-warn hover:bg-warnsoft transition-colors ${btnFocus}`}
                                                title="إلغاء الاشتراك"
                                            >
                                                <XCircle className="w-[18px] h-[18px]" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-line rounded-2xl shadow-cardhover p-5 md:p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-ink mb-4">إضافة اشتراك يدوي جديد</h2>
                        <form onSubmit={handleAddSubscription} className="space-y-4">
                            <div>
                                <label className="block text-sm text-inksoft mb-1">البريد الإلكتروني للمستخدم</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className={inputSkin}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">ربط بباقة محددة (اختياري)</label>
                                <div className="relative">
                                    <select
                                        value={selectedPackage}
                                        onChange={e => {
                                            setSelectedPackage(e.target.value);
                                            const pkg = packages.find(p => p.id === Number(e.target.value));
                                            if (pkg) setDuration(pkg.duration_days.toString());
                                        }}
                                        className={`${inputSkin} appearance-none pl-9`}
                                    >
                                        <option value="">-- مدة مخصصة بالأيام --</option>
                                        {packages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.duration_days} يوم)</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-inksoft mb-1">المدة بالأيام</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className={`${inputSkin} tabular-nums`}
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-surface border border-line hover:bg-surface2 text-ink text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnFocus}`}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-accent hover:bg-accentstrong text-white font-medium text-sm shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${btnFocus}`}
                                >
                                    {processing ? 'جاري المعالجة...' : 'إضافة الاشتراك'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-line rounded-2xl shadow-cardhover p-5 md:p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                            <Edit className="w-5 h-5 text-accentstrong" />
                            تعديل اشتراك الحساب
                        </h2>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-inksoft mb-1.5">البريد الإلكتروني للمستخدم</label>
                                <input
                                    type="email"
                                    disabled
                                    value={editingUser.email ?? ''}
                                    className="w-full bg-surface border border-line rounded-[10px] px-3 py-2.5 text-sm text-inkmute cursor-not-allowed outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-inksoft mb-1.5">الباقة الحالية</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={editPlanId}
                                            onChange={e => setEditPlanId(e.target.value)}
                                            className={`${inputSkin} appearance-none pl-9`}
                                        >
                                            <option value="">بدون باقة</option>
                                            {packages.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.duration_days} يوم)</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
                                    </div>

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
                                            className={`px-3 rounded-[10px] bg-surface2 border border-line hover:border-accent/60 text-accentstrong text-xs font-medium transition-colors ${btnFocus}`}
                                            title="تعيين تاريخ انتهاء الباقة الافتراضي"
                                        >
                                            تطبيق المدة
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-inksoft mb-1.5">تاريخ انتهاء الاشتراك</label>
                                <input
                                    type="date"
                                    value={editSubEnd}
                                    onChange={e => {
                                        setEditSubEnd(e.target.value);
                                        setDaysModifier('');
                                    }}
                                    className={`${inputSkin} tabular-nums`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-inksoft mb-1.5">تعديل بعدد الأيام (إضافة / خصم)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="مثال: +10 أو -5"
                                        value={daysModifier}
                                        onChange={e => handleDaysModifierChange(e.target.value)}
                                        className={`${inputSkin} flex-1 tabular-nums`}
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => adjustDays(30)}
                                            className={`px-3 bg-accentsoft hover:bg-accentline text-accentstrong rounded-[10px] text-xs font-semibold transition-colors ${btnFocus}`}
                                        >
                                            +30 يوم
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => adjustDays(-7)}
                                            className={`px-3 bg-dangersoft hover:bg-danger/15 text-danger rounded-[10px] text-xs font-semibold transition-colors ${btnFocus}`}
                                        >
                                            -7 أيام
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-surface border border-line hover:bg-surface2 text-ink text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnFocus}`}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className={`flex-1 py-2.5 rounded-[10px] bg-accent hover:bg-accentstrong text-white font-semibold text-sm shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${btnFocus}`}
                                >
                                    {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
