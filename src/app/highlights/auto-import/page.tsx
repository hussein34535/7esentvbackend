'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scrapeBeinGoal, createHighlight } from '@/app/actions';
import { ArrowLeft, Sparkles, Send, RefreshCw, Star, Play, Check } from 'lucide-react';
import Link from 'next/link';

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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'حدث خطأ غير متوقع أثناء الجلب.' });
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
                image: imagePayload as any,
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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء الحفظ.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="font-sans text-white max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/highlights" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        جلب وإضافة المباريات الكاملة تلقائياً (Auto Full Matches)
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">أدخل روابط beIN Sports لتعبئة وحفظ تفاصيل المباراة الكاملة فوراً</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                        <h2 className="text-lg font-semibold text-slate-200">الروابط المطلوبة</h2>
                        <form onSubmit={handleFetch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                    رابط صفحة beIN Sports
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://www.beinsports.com/..."
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none transition"
                                    value={pageUrl}
                                    onChange={e => setPageUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                    رابط الفيديو المباشر
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://...mp4 or embed"
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none transition"
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
                            >
                                {loading ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الجلب...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> جلب معلومات المباراة</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Display & Save Section */}
                <div className="lg:col-span-2 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                            message.type === 'success' 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                : message.type === 'error'
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    {!scrapedData ? (
                        <div className="text-center py-24 bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
                            <Play className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                            <p className="text-slate-400">لم يتم جلب أي بيانات بعد.</p>
                            <p className="text-slate-600 text-sm mt-1">أدخل الروابط على اليمين واضغط على زر الجلب للتجربة.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-slate-200">البيانات التي تم العثور عليها</h3>

                            {/* Thumbnail Preview */}
                            {scrapedData.thumbnail && (
                                <div className="h-48 bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
                                    <img src={scrapedData.thumbnail} alt="Match Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Play className="w-10 h-10 text-white drop-shadow-md" />
                                    </div>
                                </div>
                            )}

                            {/* Editable Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                                        عنوان المباراة (يمكن تعديله)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                                        الوصف المسترجع من الصفحة
                                    </label>
                                    <div className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-500 min-h-[50px]">
                                        {scrapedData.description || 'لا يوجد وصف متاح.'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                                        رابط الفيديو الفعلي المستهدف
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono select-all"
                                        value={scrapedData.videoUrl}
                                    />
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div 
                                        className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer" 
                                        onClick={() => setIsPremium(!isPremium)}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isPremium ? 'bg-amber-500 border-amber-500 text-black' : 'border-slate-600'}`}>
                                            {isPremium && <Star className="w-3 h-3 fill-current" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-xs">محتوى مميز (Premium)</div>
                                            <div className="text-[10px] text-slate-500">للمشتركين فقط</div>
                                        </div>
                                    </div>

                                    <div 
                                        className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer" 
                                        onClick={() => setIsPublished(!isPublished)}
                                    >
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-xs">
                                                {isPublished ? 'نشر مباشر' : 'حفظ كمسودة'}
                                            </div>
                                            <div className="text-[10px] text-slate-500">{isPublished ? 'متاح بالكامل للجمهور' : 'لن يظهر في التطبيق حالياً'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                                >
                                    {saving ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                                    ) : (
                                        <><Check className="w-4 h-4" /> حفظ ونشر المباراة</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
