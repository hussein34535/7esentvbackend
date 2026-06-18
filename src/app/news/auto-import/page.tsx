'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchVideoInfo, createNews } from '@/app/actions';
import {
    ArrowLeft, Zap, Play, Save, CheckCircle2,
    AlertCircle, Loader2, Film, RefreshCw, X, Star
} from 'lucide-react';
import Link from 'next/link';

interface FetchedData {
    title: string;
    thumbnail: string;
    videoUrl: string;       // الرابط المحوَّل (7esentv-match) — يُحفظ في DB
    originalUrl: string;    // الرابط الأصلي — للعرض فقط
    videoId: string | null;
}

export default function AutoImportFullMatch() {
    const [videoUrl, setVideoUrl] = useState('');
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [fetchedData, setFetchedData] = useState<FetchedData | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleFetch = async () => {
        if (!videoUrl.trim()) {
            setError('يرجى إدخال رابط الفيديو.');
            return;
        }
        setFetching(true);
        setError(null);
        setFetchedData(null);
        setSaved(false);
        setSuccessMsg(null);

        try {
            const result = await fetchVideoInfo(videoUrl.trim());
            if (result.success && result.data) {
                setFetchedData(result.data);
                setEditTitle(result.data.title);
            } else {
                setError(result.error || 'فشل جلب بيانات الفيديو.');
            }
        } catch (e: any) {
            setError(e.message || 'حدث خطأ غير متوقع.');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!fetchedData) return;
        setSaving(true);
        setError(null);

        try {
            const result = await createNews({
                title: editTitle || fetchedData.title,
                link: { url: fetchedData.videoUrl },
                image: fetchedData.thumbnail || null,
                is_premium: isPremium,
                is_published: isPublished,
            });

            if (result.success) {
                setSaved(true);
                setSuccessMsg('تم حفظ المباراة الكاملة بنجاح!');
            } else {
                setError('فشل الحفظ: ' + result.error);
            }
        } catch (e: any) {
            setError(e.message || 'فشلت عملية الحفظ.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setVideoUrl('');
        setFetchedData(null);
        setEditTitle('');
        setError(null);
        setSuccessMsg(null);
        setSaved(false);
    };

    return (
        <div className="font-sans text-white min-h-screen" dir="rtl">
            <main className="max-w-3xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/news" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
                                جلب مباراة كاملة تلقائياً
                            </span>
                            <Zap className="w-6 h-6 text-orange-400 flex-shrink-0" />
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            أدخل رابط الفيديو (Dailymotion / YouTube) ويجلب العنوان والصورة تلقائياً
                        </p>
                    </div>
                </div>

                {/* Input Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 mb-6">
                    <label className="block text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Play className="w-3.5 h-3.5 text-orange-400" />
                        رابط الفيديو
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="url"
                            placeholder="https://www.dailymotion.com/video/... أو YouTube"
                            className="flex-1 bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition font-mono placeholder:text-slate-600 placeholder:font-sans"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            disabled={fetching || saving}
                            onKeyDown={e => e.key === 'Enter' && handleFetch()}
                        />
                        <button
                            onClick={handleFetch}
                            disabled={fetching || saving || !videoUrl.trim()}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-orange-950/20 disabled:shadow-none whitespace-nowrap flex-shrink-0"
                        >
                            {fetching ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            {fetching ? 'جاري الجلب...' : 'جلب'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Success */}
                {successMsg && (
                    <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold">{successMsg}</p>
                            <div className="flex gap-3 mt-3">
                                <Link
                                    href="/news"
                                    className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition"
                                >
                                    عرض المباريات الكاملة
                                </Link>
                                <button
                                    onClick={handleReset}
                                    className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg transition"
                                >
                                    إضافة مباراة أخرى
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {fetching && (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin" />
                            <Film className="w-5 h-5 text-orange-400 absolute inset-0 m-auto" />
                        </div>
                        <p className="text-slate-400 text-sm">جاري جلب بيانات الفيديو...</p>
                    </div>
                )}

                {/* Empty State */}
                {!fetchedData && !fetching && !error && !successMsg && (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl gap-3 text-center">
                        <Film className="w-12 h-12 text-slate-700" />
                        <p className="text-slate-400 font-medium">لم يتم جلب أي بيانات بعد</p>
                        <p className="text-slate-600 text-sm">أدخل رابط الفيديو واضغط جلب</p>
                    </div>
                )}

                {/* Preview & Edit */}
                {fetchedData && !saved && (
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video bg-slate-950">
                            {fetchedData.thumbnail ? (
                                <img
                                    src={fetchedData.thumbnail}
                                    alt="thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Film className="w-14 h-14 text-slate-700" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                                <Film className="w-3 h-3 text-orange-400" />
                                مباراة كاملة
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Editable Title */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">عنوان المباراة (قابل للتعديل)</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                                    placeholder="عنوان المباراة..."
                                />
                            </div>

                            {/* Video URL Preview */}
                            <div className="space-y-2">
                                {/* Converted URL (saved to DB) */}
                                <div>
                                    <label className="block text-xs font-medium text-emerald-500 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                        الرابط المحوَّل (يُحفظ هكذا)
                                    </label>
                                    <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-3 py-2.5">
                                        <Play className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-xs text-emerald-300 font-mono truncate">{fetchedData.videoUrl}</span>
                                        {fetchedData.videoId && (
                                            <span className="flex-shrink-0 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                                                ID: {fetchedData.videoId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Original URL */}
                                {fetchedData.originalUrl !== fetchedData.videoUrl && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
                                            الرابط الأصلي
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                                            <span className="text-xs text-slate-500 font-mono truncate">{fetchedData.originalUrl}</span>
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* Publish Settings */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div
                                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                                    onClick={() => setIsPremium(!isPremium)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                        {isPremium && <Star className="w-3 h-3 text-black fill-current" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Premium</div>
                                        <div className="text-xs text-slate-500">للمشتركين فقط</div>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                                    onClick={() => setIsPublished(!isPublished)}
                                >
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${isPublished ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{isPublished ? 'منشور' : 'مسودة'}</div>
                                        <div className="text-xs text-slate-500">{isPublished ? 'مرئي للجميع' : 'مخفي'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition"
                                >
                                    <X className="w-4 h-4" />
                                    إعادة
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !editTitle.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-orange-950/20"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            حفظ في المباريات الكاملة
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
