'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { previewMatches, publishSingleMatch, publishAllMatches, getBlockedChampions, getDistinctChampions, blockChampion, unblockChampion } from '@/app/actions';
import { ArrowLeft, RefreshCw, Check, AlertCircle, Sparkles, Shield, Ban, Plus, Trash2, X } from 'lucide-react';
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

const primaryBtn = 'inline-flex items-center gap-2 btn-gradient-violet text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, m] = timeStr.slice(0, 5).split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h) || m === undefined) return timeStr.slice(0, 5);
    const isPM = h >= 12;
    h = h % 12 || 12;
    return `${h}:${m} ${isPM ? 'م' : 'ص'}`;
};

export default function AutoImportMatches() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<ScrapedMatch[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [blocked, setBlocked] = useState<{id:number; name:string}[]>([]);
    const [allChampions, setAllChampions] = useState<string[]>([]);
    const [newBlock, setNewBlock] = useState('');
    const [blocking, setBlocking] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [publishingAll, setPublishingAll] = useState(false);
    const [publishingIdx, setPublishingIdx] = useState<string | null>(null);

    const loadBlockedData = async () => {
        try {
            const [b, c] = await Promise.all([getBlockedChampions(), getDistinctChampions()]);
            setBlocked(b || []);
            setAllChampions(c || []);
        } catch {}
    };
    useEffect(() => { loadBlockedData(); }, []);

    const handleBlock = async (name: string) => {
        const n = name.trim();
        if (!n) return;
        setBlocking(true);
        const res = await blockChampion(n);
        if (res.success) {
            setNewBlock('');
            await loadBlockedData();
            router.refresh();
        } else {
            setMessage({ type: 'error', text: res.error || 'فشل الحظر' });
        }
        setBlocking(false);
    };
    const handleUnblock = async (id: number) => {
        await unblockChampion(id);
        await loadBlockedData();
        router.refresh();
    };

    const handleFetchAndPublish = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result: any = await previewMatches();
            if (result.success && result.matches) {
                setMatches(result.matches);
                if (result.matches.length === 0) {
                    setMessage({ type: 'info', text: 'لا يوجد مباريات قادمة متاحة حالياً على المصدر (يلا كورة). جرّب مرة أخرى لاحقاً.' });
                } else {
                    const newCount = result.matches.filter((m:any)=> m.status !== 'already_published').length;
                    if (newCount === 0) {
                        setMessage({ type: 'info', text: 'جميع المباريات المعروضة منشورة بالفعل. يمكنك نشرها واحداً واحداً أو الضغط على نشر الكل.' });
                    } else {
                        setMessage({ type: 'success', text: `تم جلب ${result.matches.length} مباراة — ${newCount} جديدة جاهزة للنشر (اختر واحدة واحدة أو انشر الكل).` });
                    }
                }
                await loadBlockedData();
            } else {
                setMessage({ type: 'error', text: result.error || 'حدث خطأ أثناء الجلب.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'فشلت عملية الجلب.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishOne = async (match: ScrapedMatch, key: string) => {
        setPublishingIdx(key);
        try {
            const res: any = await publishSingleMatch(match);
            if (res.success) {
                setMessage({ type: 'success', text: `تم نشر مباراة ${match.team_a} ضد ${match.team_b} بنجاح.` });
                setMatches(prev => prev.map(m => (m.team_a===match.team_a && m.team_b===match.team_b && m.match_time===match.match_time) ? {...m, status:'already_published'} : m));
                router.refresh();
            } else {
                setMessage({ type: 'error', text: res.error || 'فشل النشر' });
            }
        } catch (e:any) {
            setMessage({ type: 'error', text: e.message || 'فشل النشر' });
        } finally { setPublishingIdx(null); }
    };

    const handlePublishAll = async () => {
        const toPublish = matches.filter(m => m.status !== 'already_published');
        if (toPublish.length === 0) {
            setMessage({ type: 'info', text: 'لا يوجد مباريات جديدة للنشر.' });
            return;
        }
        setPublishingAll(true);
        try {
            const res: any = await publishAllMatches(toPublish);
            if (res.success) {
                setMessage({ type: 'success', text: res.published ? `تم نشر ${res.published} مباراة بنجاح.` : (res.message || 'تم النشر') });
                setMatches(prev => prev.map(m => ({...m, status:'already_published'} as ScrapedMatch)));
                router.refresh();
            } else {
                setMessage({ type: 'error', text: res.error || 'فشل نشر الكل' });
            }
        } catch (e:any) {
            setMessage({ type: 'error', text: e.message });
        } finally { setPublishingAll(false); }
    };

    return (
        <div className="font-sans max-w-5xl mx-auto px-4 py-6 md:py-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-start gap-3">
                    <Link href="/" aria-label="رجوع" className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight flex items-center gap-2">
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
                    {loading ? 'جاري الجلب...' : 'جلب المباريات'}
                </button>
                {matches.some(m=> m.status !== 'already_published') && (
                    <button
                        onClick={handlePublishAll}
                        disabled={publishingAll || loading}
                        className="inline-flex items-center gap-1.5 btn-gradient-red text-white px-4 py-2 rounded-[10px] text-sm font-medium disabled:opacity-40 shrink-0 transition-all active:scale-[0.98] shadow-sm"
                    >
                        <Check className={`w-4 h-4 ${publishingAll ? 'animate-pulse' : ''}`} />
                        {publishingAll ? 'جاري النشر...' : `نشر الكل (${matches.filter(m=>m.status!=='already_published').length})`}
                    </button>
                )}
                <button
                    onClick={()=>setShowBlockedModal(true)}
                    className="inline-flex items-center gap-1.5 bg-surface border border-line hover:bg-surface2 text-ink px-3 py-2 rounded-[10px] text-sm font-medium transition-colors shrink-0"
                    title="إدارة البطولات المحظورة"
                >
                    <Shield className="w-4 h-4 text-inkmute" />
                    {blocked.length>0 ? `محظورة (${blocked.length})` : 'حظر بطولات'}
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
                    <p className="text-xs text-inkmute mt-1">اضغط على زر &quot;جلب المباريات&quot; ثم انشر واحدة واحدة أو استخدم &quot;نشر الكل&quot;.</p>
                </div>
            )}

            {matches.length > 0 && (() => {
                const grouped: Record<string, typeof matches> = {};
                matches.forEach(m => {
                    const k = (m.champion?.trim() || 'غير مصنف');
                    if (!grouped[k]) grouped[k] = [];
                    grouped[k].push(m);
                });
                const entries = Object.entries(grouped).sort(([a],[b])=> a.localeCompare(b, 'ar'));
                return (
                    <div className="space-y-8">
                        {entries.map(([champ, list]) => (
                            <div key={champ}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                                        <span className="w-1 h-5 bg-accent rounded-full"></span>
                                        {champ}
                                        <span className="text-xs font-normal text-inkmute">({list.length})</span>
                                    </h3>
                                    <button
                                        onClick={()=>handleBlock(champ)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-inkmute hover:text-danger hover:bg-dangersoft px-2.5 py-1 rounded-full border border-transparent hover:border-danger/20 transition-colors"
                                        title={`حظر ${champ}`}
                                    >
                                        <Ban className="w-3 h-3" /> حظر الدوري
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                    {list.map((match, idx) => {
                                        const isAlreadyPublished = match.status === 'already_published';
                                        return (
                            <div 
                                key={`${champ}-${idx}`} 
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
                                            <p className="text-lg font-bold text-ink tabular-nums">{formatTime12h(match.match_time)}</p>
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
                                                <button
                                                    onClick={()=>handlePublishOne(match, `${champ}-${idx}`)}
                                                    disabled={publishingIdx===`${champ}-${idx}`}
                                                    className="w-full py-2 btn-gradient-red text-white rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all active:scale-[0.98]"
                                                >
                                                    {publishingIdx===`${champ}-${idx}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                    {publishingIdx===`${champ}-${idx}` ? 'جاري النشر...' : 'نشر المباراة'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}
            {showBlockedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowBlockedModal(false)} />
                    <div className="relative bg-surface border border-line rounded-2xl shadow-cardhover w-full max-w-md p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-ink flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> البطولات المحظورة</h3>
                            <button onClick={()=>setShowBlockedModal(false)} className="p-2 rounded-lg hover:bg-surface2 text-inkmute hover:text-ink transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-inksoft">اكتب أي جزء من اسم البطولة وسيتم حظر كل ما يحتويه. مثال: "القطري"</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newBlock}
                                onChange={(e)=>setNewBlock(e.target.value)}
                                onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); handleBlock(newBlock); } }}
                                placeholder="اسم البطولة..."
                                className="flex-1 bg-surface2 border border-line focus:border-accent/50 rounded-[10px] px-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none"
                            />
                            <button onClick={()=>handleBlock(newBlock)} disabled={blocking || !newBlock.trim()} className="btn-gradient-red text-white px-4 py-2 rounded-[10px] text-sm font-medium disabled:opacity-40 shrink-0 inline-flex items-center gap-1">
                                <Plus className="w-4 h-4" /> حظر
                            </button>
                        </div>
                        {blocked.length>0 ? (
                            <div className="flex flex-wrap gap-2">
                                {blocked.map(b=>(
                                    <span key={b.id} className="inline-flex items-center gap-1.5 bg-dangersoft text-danger border border-danger/20 px-3 py-1.5 rounded-full text-xs font-medium">
                                        {b.name}
                                        <button onClick={()=>handleUnblock(b.id)} className="p-0.5 rounded-full hover:bg-danger/10"><Trash2 className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        ) : <p className="text-xs text-inkmute">لا يوجد محظور حالياً.</p>}
                        {allChampions.length>0 && (
                            <div className="pt-3 border-t border-line">
                                <p className="text-xs font-semibold text-inksoft mb-2">اقتراحات من البطولات الحالية:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {allChampions.slice(0,12).map(ch=>{
                                        const isBlocked = blocked.some(b=> b.name.toLowerCase()===ch.toLowerCase() || ch.toLowerCase().includes(b.name.toLowerCase()));
                                        if(isBlocked) return null;
                                        return <button key={ch} onClick={()=>handleBlock(ch)} className="px-2.5 py-1 rounded-full text-xs bg-surface2 border border-line text-inksoft hover:border-accent/40 hover:text-accent transition-colors">{ch}</button>
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
