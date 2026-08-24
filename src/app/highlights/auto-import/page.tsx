'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scrapeBeinGoal, createHighlight } from '@/app/actions';
import { ArrowLeft, Sparkles, Send, RefreshCw, Star, Play, Check } from 'lucide-react';
import Link from 'next/link';

const btnBase = 'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
const inputSkin = `w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors ${btnBase}`;
const fieldLabel = 'block text-xs font-semibold text-inksoft mb-1.5';

export default function AutoImportHighlight() {
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
                setMessage({ type: 'success', text: 'تم جلب معلومات المباراة بنجاح! يرجى مراجعة التفاصيل أدناه قبل الحفظ.' });
            } else {
                setMessage({ type: 'error', text: res.error || 'فشل جلب المعلومات من الرابط المدخل.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: (err instanceof Error && err.message) || 'حدث خطأ غير متوقع أثناء الجلب.' });
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

            const res = await createHighlight({
                title: title || scrapedData.title,
                image: imagePayload,
                url: urlPayload,
                is_premium: isPremium,
                is_published: isPublished
            });

            if (res.success) {
                setMessage({ type: 'success', text: 'تم حفظ ونشر المباراة الكاملة بنجاح في قاعدة البيانات!' });
                setScrapedData(null);
                setPageUrl('');
                setVideoUrl('');
                router.refresh();
            } else {
                setMessage({ type: 'error', text: `فشل الحفظ: ${res.error}` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: (err instanceof Error && err.message) || 'حدث خطأ أثناء الحفظ.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Link href="/highlights" className={`p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors shrink-0 ${btnBase}`} aria-label="Back to highlights">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent shrink-0" />
                        جلب وإضافة المباريات الكاملة تلقائياً
                    </h1>
                    <p className="text-sm text-inksoft mt-1">أدخل روابط beIN Sports لتعبئة وحفظ تفاصيل المباراة الكاملة فوراً</p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                {/* Fetch form */}
                <section className="bg-surface border border-line rounded-2xl p-4 md:p-5">
                    <h2 className="text-sm font-semibold text-ink mb-4">الروابط المطلوبة</h2>
                    <form onSubmit={handleFetch} className="space-y-4">
                        <div>
                            <label className={fieldLabel}>رابط صفحة beIN Sports</label>
                            <input
                                type="url"
                                required
                                placeholder="https://www.beinsports.com/..."
                                className={inputSkin}
                                value={pageUrl}
                                onChange={e => setPageUrl(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={fieldLabel}>رابط الفيديو المباشر</label>
                            <input
                                type="url"
                                required
                                placeholder="https://...mp4 or embed"
                                className={inputSkin}
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center gap-2 py-2 px-4 btn-gradient-violet text-white rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${btnBase}`}
                        >
                            {loading ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الجلب...</>
                            ) : (
                                <><Send className="w-4 h-4" /> جلب معلومات المباراة</>
                            )}
                        </button>
                    </form>
                </section>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'success'
                        ? 'bg-accentsoft border-accentline text-accentstrong'
                        : message.type === 'error'
                            ? 'bg-dangersoft border-danger/20 text-danger'
                            : 'bg-infosoft border-info/20 text-info'
                        }`}>
                        {message.type === 'success' ? (
                            <Check className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                            <Play className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {/* Results */}
                {!scrapedData ? (
                    <div className="text-center py-20 bg-surface border border-line border-dashed rounded-2xl">
                        <Play className="w-10 h-10 mx-auto mb-3 text-inkmute/40" />
                        <p className="text-sm text-inksoft">لم يتم جلب أي بيانات بعد.</p>
                        <p className="text-xs text-inkmute mt-1">أدخل الروابط أعلاه واضغط على زر الجلب للتجربة.</p>
                    </div>
                ) : (
                    <section className="bg-surface border border-line rounded-2xl p-4 md:p-5 space-y-5">
                        <h2 className="text-sm font-semibold text-ink">البيانات التي تم العثور عليها</h2>

                        {/* Thumbnail Preview */}
                        {scrapedData.thumbnail && (
                            <div className="h-48 bg-surface2 rounded-xl relative overflow-hidden flex items-center justify-center border border-line">
                                <img src={scrapedData.thumbnail} alt="Match Thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                                    <span className="p-3 rounded-full bg-surface/90 shadow-cardhover flex items-center justify-center">
                                        <Play className="w-8 h-8 text-accent fill-current" />
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Editable Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className={fieldLabel}>عنوان المباراة (يمكن تعديله)</label>
                                <input
                                    type="text"
                                    required
                                    className={inputSkin}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={fieldLabel}>الوصف المسترجع من الصفحة</label>
                                <div className="w-full bg-surface2 border border-line rounded-[10px] px-3 py-2 text-xs text-inksoft min-h-[50px]">
                                    {scrapedData.description || 'لا يوجد وصف متاح.'}
                                </div>
                            </div>

                            <div>
                                <label className={fieldLabel}>رابط الفيديو الفعلي المستهدف</label>
                                <input
                                    type="text"
                                    disabled
                                    className={`w-full bg-surface2 border border-line rounded-[10px] px-3 py-2 text-xs text-inkmute font-mono select-all outline-none cursor-default`}
                                    value={scrapedData.videoUrl}
                                />
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsPremium(!isPremium)}
                                    className={`flex items-center gap-3 p-4 bg-surface2/50 border rounded-xl cursor-pointer text-left transition-colors duration-200 active:scale-[0.98] ${isPremium ? 'border-warn/50' : 'border-line'} ${btnBase}`}
                                >
                                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isPremium ? 'bg-warn border-warn' : 'bg-surface border-line'}`}>
                                        {isPremium && <Star className="w-3 h-3 text-surface fill-current" />}
                                    </span>
                                    <span>
                                        <span className="block text-xs font-medium text-ink">محتوى مميز (Premium)</span>
                                        <span className="block text-[11px] text-inksoft mt-0.5">للمشتركين فقط</span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsPublished(!isPublished)}
                                    className={`flex items-center gap-3 p-4 bg-surface2/50 border rounded-xl cursor-pointer text-left transition-colors duration-200 active:scale-[0.98] ${isPublished ? 'border-accent/50' : 'border-line'} ${btnBase}`}
                                >
                                    <span className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 flex items-center ${isPublished ? 'bg-accent' : 'bg-line'}`}>
                                        <span className={`w-4 h-4 bg-surface rounded-full shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </span>
                                    <span>
                                        <span className="block text-xs font-medium text-ink">{isPublished ? 'نشر مباشر' : 'حفظ كمسودة'}</span>
                                        <span className="block text-[11px] text-inksoft mt-0.5">{isPublished ? 'متاح بالكامل للجمهور' : 'لن يظهر في التطبيق حالياً'}</span>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-line flex justify-end gap-3">
                            <button
                                onClick={() => { setScrapedData(null); setMessage(null); }}
                                className={`inline-flex items-center bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnBase}`}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`inline-flex items-center gap-2 btn-gradient-red text-white rounded-[10px] px-6 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none ${btnBase}`}
                            >
                                {saving ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                                ) : (
                                    <><Check className="w-4 h-4" /> حفظ ونشر المباراة</>
                                )}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
