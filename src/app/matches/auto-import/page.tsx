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
    stream_link: any[];
    status?: 'published' | 'already_published';
}

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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'فشلت عملية الجلب والنشر.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans text-white max-w-5xl mx-auto px-4 py-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            الجلب والنشر التلقائي للمباريات
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">جلب مباريات اليوم ونشرها مباشرة بضغطة زر واحدة مع منع التكرار</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleFetchAndPublish}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-purple-950/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'جاري الجلب والنشر والتأكد من التكرار...' : 'جلب ونشر مباريات اليوم'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
                    message.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : message.type === 'error'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {matches.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-400 text-lg">لا يوجد مباريات معروضة حالياً.</p>
                    <p className="text-slate-600 text-sm mt-1">اضغط على زر "جلب ونشر مباريات اليوم" للبدء بالعملية في خطوة واحدة.</p>
                </div>
            )}

            {matches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match, idx) => {
                        const isAlreadyPublished = match.status === 'already_published';
                        return (
                            <div 
                                key={idx} 
                                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                                    isAlreadyPublished 
                                        ? 'border-slate-800 bg-slate-900/40 opacity-80' 
                                        : 'border-emerald-500/35 bg-emerald-500/5'
                                }`}
                            >
                                <div className="p-5 flex flex-col h-full">
                                    <div className="text-center mb-3 pb-3 border-b border-slate-800">
                                        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                                            {match.champion || 'بطولة غير محددة'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-center mb-4 flex-1">
                                        <div className="flex flex-col items-center gap-2 w-[40%]">
                                            {match.logo_a ? (
                                                <img src={match.logo_a} alt={match.team_a} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                    {match.team_a.charAt(0)}
                                                </div>
                                            )}
                                            <p className="text-sm font-bold text-slate-200 truncate w-full" title={match.team_a}>
                                                {match.team_a}
                                            </p>
                                        </div>

                                        <div className="text-center px-1">
                                            <p className="text-xl font-mono font-bold text-slate-100">{match.match_time.slice(0, 5)}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">مكة المكرمة</p>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 w-[40%]">
                                            {match.logo_b ? (
                                                <img src={match.logo_b} alt={match.team_b} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                    {match.team_b.charAt(0)}
                                                </div>
                                            )}
                                            <p className="text-sm font-bold text-slate-200 truncate w-full" title={match.team_b}>
                                                {match.team_b}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-auto">
                                        <div className="text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg py-1 border border-slate-800">
                                            {match.channel || 'القناة غير محددة'} {match.commentator ? `| ${match.commentator}` : ''}
                                        </div>

                                        <div className="pt-2">
                                            {isAlreadyPublished ? (
                                                <div className="w-full py-2 bg-slate-800/80 text-slate-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default">
                                                    <Check className="w-4 h-4 text-slate-500" />
                                                    منشورة بالفعل
                                                </div>
                                            ) : (
                                                <div className="w-full py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default">
                                                    <Check className="w-4 h-4 text-emerald-400" />
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
