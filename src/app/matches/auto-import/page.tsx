'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAndPublishMatches } from '@/app/actions';
import { ArrowLeft, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ScrapedMatch {
    team_a: string;
    team_b: string;
    logo_a: string;
    logo_b: string;
    match_time: string;
    channel: string;
    commentator: string;
    champion: string;
    is_premium: boolean;
    is_published: boolean;
    stream_link: unknown[];
    status?: 'published' | 'already_published';
}

const primaryBtn = 'inline-flex items-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

export default function AutoImportMatches() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<ScrapedMatch[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const handleFetchAndPublish = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await fetchAndPublishMatches();
            if (result.success && result.matches) {
                setMatches(result.matches);
                if (result.newlyAdded !== undefined && result.newlyAdded > 0) {
                    setMessage({ 
                        type: 'success', 
                        text: `تم فحص وجلب مباريات اليوم بنجاح! تم نشر ${result.newlyAdded} مباراة جديدة بنجاح.` 
                    });
                } else {
                    setMessage({ 
                        type: 'info', 
                        text: 'تم فحص وجلب مباريات اليوم بنجاح. جميع المباريات منشورة بالفعل مسبقاً ولم يتم إضافة تكرار.' 
                    });
                }
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'حدث خطأ غير معروف أثناء جلب ونشر المباريات.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'فشلت عملية الجلب والنشر.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans max-w-5xl mx-auto px-4 py-6 md:py-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-start gap-3">
                    <Link href="/" aria-label="رجوع" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-inkmute" />
                            الجلب والنشر التلقائي للمباريات
                        </h1>
                        <p className="text-sm text-inksoft mt-1">جلب مباريات اليوم ونشرها مباشرة بضغطة زر واحدة مع منع التكرار</p>
                    </div>
                </div>

                <button
                    onClick={handleFetchAndPublish}
                    disabled={loading}
                    className={primaryBtn + " shrink-0"}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'جاري الجلب والنشر والتأكد من التكرار...' : 'جلب ونشر مباريات اليوم'}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-accentsoft border-accentline text-accentstrong' 
                        : message.type === 'error'
                        ? 'bg-dangersoft border-danger/20 text-danger'
                        : 'bg-infosoft border-info/20 text-info'
                }`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {matches.length === 0 && !loading && (
                <div className="text-center py-16 bg-surface border border-line border-dashed rounded-2xl">
                    <Sparkles className="w-10 h-10 text-inkmute/40 mx-auto" />
                    <p className="text-sm text-inksoft mt-3">لا يوجد مباريات معروضة حالياً.</p>
                    <p className="text-xs text-inkmute mt-1">اضغط على زر &quot;جلب ونشر مباريات اليوم&quot; للبدء بالعملية في خطوة واحدة.</p>
                </div>
            )}

            {matches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {matches.map((match, idx) => {
                        const isAlreadyPublished = match.status === 'already_published';
                        return (
                            <div 
                                key={idx} 
                                className={`rounded-2xl border p-4 md:p-5 shadow-card transition-all duration-200 ${
                                    isAlreadyPublished 
                                        ? 'bg-surface border-line opacity-90' 
                                        : 'bg-surface border-accent/40 hover:border-accent hover:shadow-cardhover'
                                }`}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="text-center mb-3 pb-3 border-b border-line">
                                        <span className="text-xs font-medium text-inksoft bg-surface2 px-2.5 py-1 rounded-full">
                                            {match.champion || 'بطولة غير محددة'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-center mb-4 flex-1">
                                        <div className="flex flex-col items-center gap-2 w-[40%]">
                                            {match.logo_a ? (
                                                <img src={match.logo_a} alt={match.team_a} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center font-semibold text-inkmute">
                                                    {match.team_a.charAt(0)}
                                                </div>
                                            )}
                                            <p className="text-sm font-semibold text-ink truncate w-full" title={match.team_a}>
                                                {match.team_a}
                                            </p>
                                        </div>

                                        <div className="text-center px-1">
                                            <p className="text-lg font-bold text-ink tabular-nums">{match.match_time.slice(0, 5)}</p>
                                            <p className="text-[10px] text-inkmute">مكة المكرمة</p>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 w-[40%]">
                                            {match.logo_b ? (
                                                <img src={match.logo_b} alt={match.team_b} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center font-semibold text-inkmute">
                                                    {match.team_b.charAt(0)}
                                                </div>
                                            )}
                                            <p className="text-sm font-semibold text-ink truncate w-full" title={match.team_b}>
                                                {match.team_b}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-auto">
                                        <div className="text-center text-xs text-inksoft bg-surface2 rounded-[10px] py-1.5 px-2">
                                            {match.channel || 'القناة غير محددة'} {match.commentator ? `| ${match.commentator}` : ''}
                                        </div>

                                        <div className="pt-1">
                                            {isAlreadyPublished ? (
                                                <div className="w-full py-2 bg-surface2 text-inkmute rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default">
                                                    <Check className="w-4 h-4" />
                                                    منشورة بالفعل
                                                </div>
                                            ) : (
                                                <div className="w-full py-2 bg-accentsoft text-accentstrong rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default">
                                                    <Check className="w-4 h-4" />
                                                    تم النشر بنجاح
                                                </div>
                                            )}
                                        </div>
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
