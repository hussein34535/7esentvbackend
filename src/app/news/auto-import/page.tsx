'use client';

import { useState } from 'react';
import { fetchVideoInfo, createNews } from '@/app/actions';
import {
    ArrowLeft, Zap, Play, Save, CheckCircle2,
    AlertCircle, Loader2, Film, X, Star
} from 'lucide-react';
import Link from 'next/link';

interface FetchedData {
    title: string;
    thumbnail: string;
    videoUrl: string;       // الرابط المحوَّل (7esentv-match) — يُحفظ في DB
    originalUrl: string;    // الرابط الأصلي — للعرض فقط
    videoId: string | null;
}

const FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

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
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
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
        } catch (e) {
            setError(e instanceof Error ? e.message : 'فشلت عملية الحفظ.');
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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 font-sans" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Link
                    href="/news"
                    aria-label="Back to full matches"
                    className={`p-2 rounded-lg bg-surface border border-line text-inksoft hover:text-ink hover:bg-surface2 transition-colors shrink-0 ${FOCUS_RING}`}
                >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight flex items-center gap-2">
                        جلب مباراة كاملة تلقائياً
                        <Zap className="w-5 h-5 text-accent shrink-0" />
                    </h1>
                    <p className="text-sm text-inksoft mt-1">
                        أدخل رابط الفيديو (Dailymotion / YouTube) ويجلب العنوان والصورة تلقائياً
                    </p>
                </div>
            </div>

            {/* Input Card */}
            <section className="bg-surface border border-line rounded-2xl p-4 md:p-6 shadow-card space-y-3 mb-4 md:mb-6">
                <label htmlFor="video-url" className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Play className="w-3.5 h-3.5 text-accent" />
                    رابط الفيديو
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                        id="video-url"
                        type="url"
                        placeholder="https://www.dailymotion.com/video/... أو YouTube"
                        className={`flex-1 bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-4 py-2.5 text-sm text-ink outline-none transition-colors font-mono placeholder:text-inkmute placeholder:font-sans ${FOCUS_RING}`}
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        disabled={fetching || saving}
                        onKeyDown={e => e.key === 'Enter' && handleFetch()}
                    />
                    <button
                        onClick={handleFetch}
                        disabled={fetching || saving || !videoUrl.trim()}
                        className={`flex items-center justify-center gap-2 btn-gradient-violet text-white px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0 ${FOCUS_RING}`}
                    >
                        {fetching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                        {fetching ? 'جاري الجلب...' : 'جلب'}
                    </button>
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="mb-4 md:mb-5 p-4 bg-dangersoft border border-danger/20 rounded-xl flex items-start gap-3 text-danger">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Success */}
            {successMsg && (
                <div className="mb-4 md:mb-5 p-4 bg-accentsoft border border-accentline rounded-xl flex items-start gap-3 text-accentstrong">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{successMsg}</p>
                        <div className="flex gap-2 mt-3">
                            <Link
                                href="/news"
                                className={`inline-flex items-center gap-2 btn-gradient-red text-white px-4 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                            >
                                عرض المباريات الكاملة
                            </Link>
                            <button
                                onClick={handleReset}
                                className={`inline-flex items-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink px-4 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                            >
                                إضافة مباراة أخرى
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {fetching && (
                <div className="flex flex-col items-center justify-center py-14 bg-surface border border-line rounded-2xl gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-[3px] border-surface2 border-t-accent animate-spin" />
                        <Film className="w-4 h-4 text-accent absolute inset-0 m-auto" />
                    </div>
                    <p className="text-inksoft text-sm">جاري جلب بيانات الفيديو...</p>
                </div>
            )}

            {/* Empty State */}
            {!fetchedData && !fetching && !error && !successMsg && (
                <div className="flex flex-col items-center justify-center py-14 bg-surface border border-dashed border-line rounded-2xl gap-3 text-center px-6">
                    <Film className="w-10 h-10 text-inkmute/40" />
                    <p className="text-sm font-medium text-inksoft">لم يتم جلب أي بيانات بعد</p>
                    <p className="text-xs text-inkmute">أدخل رابط الفيديو واضغط جلب</p>
                </div>
            )}

            {/* Preview & Edit */}
            {fetchedData && !saved && (
                <section className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-video bg-surface2">
                        {fetchedData.thumbnail ? (
                            <img
                                src={fetchedData.thumbnail}
                                alt="thumbnail"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-10 h-10 text-inkmute/40" />
                            </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-ink/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Film className="w-3 h-3 text-accent" />
                            مباراة كاملة
                        </div>
                    </div>

                    <div className="p-4 md:p-5 space-y-4">
                        {/* Editable Title */}
                        <div>
                            <label htmlFor="edit-title" className="block text-sm font-medium text-ink mb-1.5">عنوان المباراة (قابل للتعديل)</label>
                            <input
                                id="edit-title"
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className={`w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-inkmute ${FOCUS_RING}`}
                                placeholder="عنوان المباراة..."
                            />
                        </div>

                        {/* Video URL Preview */}
                        <div className="space-y-2">
                            {/* Converted URL (saved to DB) */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-ink mb-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                                    الرابط المحوَّل (يُحفظ هكذا)
                                </label>
                                <div className="flex items-center gap-2 bg-accentsoft border border-accentline rounded-[10px] px-3 py-2.5">
                                    <Play className="w-3.5 h-3.5 text-accent shrink-0" />
                                    <span className="text-xs text-accentstrong font-mono truncate">{fetchedData.videoUrl}</span>
                                    {fetchedData.videoId && (
                                        <span className="shrink-0 text-[10px] bg-surface border border-accentline text-accentstrong px-2 py-0.5 rounded-md font-mono font-semibold tabular-nums">
                                            ID: {fetchedData.videoId}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Original URL */}
                            {fetchedData.originalUrl !== fetchedData.videoUrl && (
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-ink mb-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-inkmute inline-block" />
                                        الرابط الأصلي
                                    </label>
                                    <div className="flex items-center gap-2 bg-surface2 border border-line rounded-[10px] px-3 py-2">
                                        <span className="text-xs text-inkmute font-mono truncate">{fetchedData.originalUrl}</span>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Publish Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsPremium(!isPremium)}
                                aria-pressed={isPremium}
                                className={`flex items-center gap-3 p-3 border rounded-xl text-right transition-all duration-200 active:scale-[0.99] ${FOCUS_RING} ${isPremium
                                    ? 'border-accent bg-accentsoft/50'
                                    : 'bg-surface2 border-line hover:border-inkmute/40'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isPremium ? 'bg-warn border-warn' : 'border-inkmute/60 bg-surface'}`}>
                                    {isPremium && <Star className="w-3 h-3 text-white fill-current" />}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-ink">Premium</div>
                                    <div className="text-xs text-inksoft">للمشتركين فقط</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPublished(!isPublished)}
                                aria-pressed={isPublished}
                                className={`flex items-center gap-3 p-3 border rounded-xl text-right transition-all duration-200 active:scale-[0.99] ${FOCUS_RING} ${isPublished
                                    ? 'border-accent bg-accentsoft/50'
                                    : 'bg-surface2 border-line hover:border-inkmute/40'
                                    }`}
                            >
                                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${isPublished ? 'bg-accent' : 'bg-inkmute/40'}`}>
                                    <div className={`w-5 h-5 bg-surface rounded-full shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-ink">{isPublished ? 'منشور' : 'مسودة'}</div>
                                    <div className="text-xs text-inksoft">{isPublished ? 'مرئي للجميع' : 'مخفي'}</div>
                                </div>
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleReset}
                                className={`flex items-center gap-2 px-4 py-2.5 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm ${FOCUS_RING}`}
                            >
                                <X className="w-4 h-4" />
                                إعادة
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editTitle.trim()}
                                className={`flex-1 flex items-center justify-center gap-2 btn-gradient-red text-white py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${FOCUS_RING}`}
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
                </section>
            )}
        </main>
    );
}
