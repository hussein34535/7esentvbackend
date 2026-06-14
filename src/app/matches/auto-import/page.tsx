'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scrapeMatches, createMultipleMatches, createMatch } from '@/app/actions';
import { ArrowLeft, RefreshCw, Save, Check, AlertCircle, Sparkles } from 'lucide-react';
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
}

export default function AutoImportMatches() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [matches, setMatches] = useState<ScrapedMatch[]>([]);
    const [publishedIndices, setPublishedIndices] = useState<Set<number>>(new Set());
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const handleFetch = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await scrapeMatches();
            if (result.success && result.matches) {
                setMatches(result.matches);
                setMessage({ type: 'success', text: `تم جلب ${result.matches.length} مباراة بنجاح من المصدر.` });
            } else {
                setMessage({ type: 'error', text: result.error || 'حدث خطأ غير معروف أثناء جلب المباريات.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'فشلت عملية الجلب.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishSingle = async (match: ScrapedMatch, index: number) => {
        setPublishing(true);
        try {
            const res = await createMatch({
                team_a: match.team_a,
                team_b: match.team_b,
                match_time: match.match_time,
                channel: match.channel,
                commentator: match.commentator,
                champion: match.champion,
                logo_a: match.logo_a,
                logo_b: match.logo_b,
                is_premium: match.is_premium,
                is_published: match.is_published,
                stream_link: match.stream_link
            });

            if (res.success) {
                setPublishedIndices(prev => new Set(prev).add(index));
                setMessage({ type: 'success', text: `تم حفظ مباراة ${match.team_a} ضد ${match.team_b} بنجاح.` });
            } else {
                setMessage({ type: 'error', text: `فشل الحفظ: ${res.error}` });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'فشلت عملية حفظ المباراة.' });
        } finally {
            setPublishing(false);
        }
    };

    const handlePublishAll = async () => {
        const unpublishedMatches = matches.filter((_, idx) => !publishedIndices.has(idx));
        if (unpublishedMatches.length === 0) return;

        setPublishing(true);
        try {
            const res = await createMultipleMatches(unpublishedMatches);
            if (res.success) {
                const newIndices = new Set(publishedIndices);
                matches.forEach((_, idx) => newIndices.add(idx));
                setPublishedIndices(newIndices);
                setMessage({ type: 'success', text: `تم بنجاح استيراد ونشر جميع المباريات (${unpublishedMatches.length}).` });
            } else {
                setMessage({ type: 'error', text: `فشل استيراد الكل: ${res.error}` });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'فشلت عملية استيراد الكل.' });
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="font-sans text-white max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            جلب المباريات التلقائي (Auto-Import)
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">جلب مباريات اليوم وحفظها مباشرة بضغطة زر</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleFetch}
                        disabled={loading || publishing}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-purple-950/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'جاري جلب البيانات...' : 'جلب مباريات اليوم'}
                    </button>
                    {matches.length > 0 && publishedIndices.size < matches.length && (
                        <button
                            onClick={handlePublishAll}
                            disabled={publishing}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-emerald-950/20"
                        >
                            <Save className="w-4 h-4" />
                            استيراد كل المباريات
                        </button>
                    )}
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
                    <p className="text-slate-600 text-sm mt-1">اضغط على زر "جلب مباريات اليوم" بالملأ التلقائي.</p>
                </div>
            )}

            {matches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match, idx) => {
                        const isPublished = publishedIndices.has(idx);
                        return (
                            <div 
                                key={idx} 
                                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                                    isPublished 
                                        ? 'border-emerald-500/35 bg-emerald-500/5' 
                                        : 'border-slate-800 hover:border-purple-500/45'
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

                                        <button
                                            onClick={() => handlePublishSingle(match, idx)}
                                            disabled={isPublished || publishing}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                                isPublished 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
                                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                            }`}
                                        >
                                            {isPublished ? (
                                                <><Check className="w-3.5 h-3.5" /> تم الحفظ</>
                                            ) : (
                                                <><Save className="w-3.5 h-3.5" /> حفظ المباراة</>
                                            )}
                                        </button>
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
