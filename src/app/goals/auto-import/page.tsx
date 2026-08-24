'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scrapeBeinGoal, createGoal } from '@/app/actions';
import { ArrowLeft, Sparkles, Send, RefreshCw, Star, Play, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AutoImportGoal() {
    const router = useRouter();
    const [pageUrl, setPageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Scraped Data State
    const [scrapedData, setScrapedData] = useState<{
        title: string;
        description: string;
        thumbnail: string;
        videoUrl: string;
        sourceUrl: string;
    } | null>(null);

    // Custom overrides after scraping
    const [title, setTitle] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const handleFetch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageUrl || !videoUrl) {
            setMessage({ type: 'error', text: 'الرجاء إدخال رابط صفحة beIN Sports ورابط الفيديو المباشر.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setScrapedData(null);

        try {
            const res = await scrapeBeinGoal(pageUrl, videoUrl);
            if (res.success && res.data) {
                setScrapedData(res.data);
                setTitle(res.data.title);
                setMessage({ type: 'success', text: 'تم جلب معلومات الهدف بنجاح! يرجى مراجعة التفاصيل أدناه قبل الحفظ.' });
            } else {
                setMessage({ type: 'error', text: res.error || 'فشل جلب المعلومات من الرابط المدخل.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: (err instanceof Error ? err.message : undefined) || 'حدث خطأ غير متوقع أثناء الجلب.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!scrapedData) return;
        setSaving(true);
        setMessage(null);

        try {
            // Structure the image same way as CloudinaryAsset for compatibility
            const imagePayload = scrapedData.thumbnail ? [{
                url: scrapedData.thumbnail,
                secure_url: scrapedData.thumbnail,
                public_id: '',
                format: 'jpg',
                width: 1280,
                height: 720
            }] : null;

            // Structure the video URL in a way the app expects: Array of servers [{ name, url }]
            const urlPayload = [{
                name: 'Server 1',
                url: videoUrl
            }];

            const res = await createGoal({
                title: title || scrapedData.title,
                image: imagePayload,
                url: urlPayload,
                is_premium: isPremium,
                is_published: isPublished
            });

            if (res.success) {
                setMessage({ type: 'success', text: 'تم حفظ ونشر الهدف بنجاح في قاعدة البيانات!' });
                setScrapedData(null);
                setPageUrl('');
                setVideoUrl('');
                router.refresh();
            } else {
                setMessage({ type: 'error', text: `فشل الحفظ: ${res.error}` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: (err instanceof Error ? err.message : undefined) || 'حدث خطأ أثناء الحفظ.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="font-sans max-w-3xl mx-auto px-4 py-6 md:py-8">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Link
                    href="/goals"
                    aria-label="Back to goals"
                    className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        جلب وإضافة الأهداف تلقائياً (Auto Goals)
                    </h1>
                    <p className="text-sm text-inksoft mt-0.5">أدخل روابط beIN Sports لتعبئة وحفظ تفاصيل الهدف فوراً</p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                {/* Scrape Controls */}
                <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-4">
                    <h2 className="text-sm font-semibold text-ink">الروابط المطلوبة</h2>
                    <form onSubmit={handleFetch} className="space-y-4">
                        <div>
                            <label htmlFor="page-url" className="block text-sm font-medium text-ink mb-1.5">
                                رابط صفحة beIN Sports
                            </label>
                            <input
                                id="page-url"
                                type="url"
                                required
                                placeholder="https://www.beinsports.com/..."
                                className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                value={pageUrl}
                                onChange={e => setPageUrl(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="video-url" className="block text-sm font-medium text-ink mb-1.5">
                                رابط الفيديو المباشر
                            </label>
                            <input
                                id="video-url"
                                type="url"
                                required
                                placeholder="https://...mp4 or embed"
                                className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto flex justify-center items-center gap-2 btn-gradient-violet disabled:opacity-40 disabled:pointer-events-none text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            {loading ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الجلب...</>
                            ) : (
                                <><Send className="w-4 h-4" /> جلب معلومات الهدف</>
                            )}
                        </button>
                    </form>
                </section>

                {/* Feedback message */}
                {message && (
                    <div className={`flex items-start gap-2.5 p-4 rounded-xl border ${
                        message.type === 'success'
                            ? 'bg-accentsoft border-accentline text-accentstrong'
                            : message.type === 'error'
                            ? 'bg-dangersoft border-danger/30 text-danger'
                            : 'bg-infosoft border-info/30 text-info'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {!scrapedData ? (
                    <div className="text-center py-16 bg-surface/60 border border-line border-dashed rounded-2xl">
                        <Play className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                        <p className="text-sm text-inksoft">لم يتم جلب أي بيانات بعد.</p>
                        <p className="text-xs text-inkmute mt-1">أدخل الروابط في الأعلى واضغط على زر الجلب للتجربة.</p>
                    </div>
                ) : (
                    /* Result */
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card space-y-4">
                        <h2 className="text-sm font-semibold text-ink">البيانات التي تم العثور عليها</h2>

                        {scrapedData.thumbnail && (
                            <div className="h-48 bg-surface2 rounded-xl relative overflow-hidden flex items-center justify-center border border-line">
                                <img src={scrapedData.thumbnail} alt="Match Thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                                    <Play className="w-10 h-10 text-white drop-shadow-md" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="scraped-title" className="block text-sm font-medium text-ink mb-1.5">
                                    عنوان الهدف (يمكن تعديله)
                                </label>
                                <input
                                    id="scraped-title"
                                    type="text"
                                    required
                                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <span className="block text-sm font-medium text-ink mb-1.5">
                                    الوصف المسترجع من الصفحة
                                </span>
                                <div className="w-full bg-surface2 border border-line rounded-[10px] px-3 py-2 text-xs text-inksoft min-h-[50px]">
                                    {scrapedData.description || 'لا يوجد وصف متاح.'}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="target-video-url" className="block text-sm font-medium text-ink mb-1.5">
                                    رابط الفيديو الفعلي المستهدف
                                </label>
                                <input
                                    id="target-video-url"
                                    type="text"
                                    disabled
                                    className="w-full bg-surface2/60 border border-line rounded-[10px] px-3 py-2 text-xs text-inksoft font-mono select-all opacity-80"
                                    value={scrapedData.videoUrl}
                                />
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div
                                    role="switch"
                                    aria-checked={isPremium}
                                    tabIndex={0}
                                    onClick={() => setIsPremium(!isPremium)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPremium(!isPremium); } }}
                                    className={`flex items-center gap-3 p-3.5 md:p-4 bg-surface2 border rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isPremium ? 'border-accent/60' : 'border-line hover:border-inkmute/40'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isPremium ? 'bg-accent border-accent' : 'border-inkmute/50 bg-surface'}`}>
                                        {isPremium && <Star className="w-3 h-3 text-surface fill-current" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-ink text-sm">محتوى مميز (Premium)</div>
                                        <div className="text-xs text-inksoft">للمشتركين فقط</div>
                                    </div>
                                </div>

                                <div
                                    role="switch"
                                    aria-checked={isPublished}
                                    tabIndex={0}
                                    onClick={() => setIsPublished(!isPublished)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPublished(!isPublished); } }}
                                    className={`flex items-center gap-3 p-3.5 md:p-4 bg-surface2 border rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isPublished ? 'border-accent/60' : 'border-line hover:border-inkmute/40'}`}
                                >
                                    <div className={`w-10 h-6 rounded-full p-1 shrink-0 transition-colors ${isPublished ? 'bg-accent' : 'bg-inkmute/40'}`}>
                                        <div className={`w-4 h-4 bg-surface rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-ink text-sm">
                                            {isPublished ? 'نشر مباشر' : 'حفظ كمسودة'}
                                        </div>
                                        <div className="text-xs text-inksoft">{isPublished ? 'متاح بالكامل للجمهور' : 'لن يظهر في التطبيق حالياً'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-line flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 btn-gradient-red disabled:opacity-40 disabled:pointer-events-none text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                                {saving ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                                ) : (
                                    <><Check className="w-4 h-4" /> حفظ ونشر الهدف</>
                                )}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
