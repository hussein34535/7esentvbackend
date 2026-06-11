'use client';

import { useState, useRef } from 'react';
import { analyzeAIInput, executeAIActions, AIOperation } from './actions';
import { Brain, FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AILinkManager() {
    const [prompt, setPrompt] = useState('');
    const [fileText, setFileText] = useState('');
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actions, setActions] = useState<AIOperation[] | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setFileText(text);
        };
        reader.onerror = () => {
            setError('فشل قراءة الملف. يرجى المحاولة مرة أخرى.');
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setFileText(text);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const clearFile = () => {
        setFileName('');
        setFileText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAnalyze = async () => {
        if (!prompt.trim() && !fileText.trim()) {
            setError('يرجى كتابة أمر أو رفع ملف قنوات أولاً للتحليل.');
            return;
        }

        setLoading(true);
        setError(null);
        setActions(null);
        setSuccessMessage(null);

        try {
            const res = await analyzeAIInput(prompt, fileText);
            if (res.success && res.actions) {
                setActions(res.actions);
                if (res.actions.length === 0) {
                    setError('لم يتمكن الذكاء الاصطناعي من تحديد أي عمليات بناءً على المدخلات المحددة. يرجى كتابة أوامر أكثر وضوحاً.');
                }
            } else {
                setError(res.error || 'فشل تحليل المدخلات.');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!actions || actions.length === 0) return;

        setExecuting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await executeAIActions(actions);
            if (res.success) {
                setSuccessMessage('تم تطبيق كافة التعديلات وحفظها في قاعدة البيانات بنجاح! 🚀');
                setActions(null);
                setPrompt('');
                clearFile();
            } else {
                setError(res.error || 'حدث خطأ أثناء تطبيق العمليات.');
            }
        } catch (err: any) {
            setError(err.message || 'فشل تطبيق العمليات على قاعدة البيانات.');
        } finally {
            setExecuting(false);
        }
    };

    const getActionBadgeColor = (type: string) => {
        switch (type) {
            case 'CREATE_CATEGORY': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
            case 'CREATE_CHANNEL': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            case 'UPDATE_CHANNEL_STREAMS': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            case 'DELETE_CHANNEL': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
            case 'ADD_CHANNEL_TO_CATEGORY': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
            case 'REMOVE_CHANNEL_FROM_CATEGORY': return 'bg-pink-500/10 border-pink-500/30 text-pink-400';
            case 'REPLACE_CATEGORY_CHANNELS': return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
            default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
        }
    };

    const getActionLabel = (type: string) => {
        switch (type) {
            case 'CREATE_CATEGORY': return 'إنشاء تصنيف جديد';
            case 'CREATE_CHANNEL': return 'إنشاء قناة جديدة';
            case 'UPDATE_CHANNEL_STREAMS': return 'تحديث روابط البث';
            case 'DELETE_CHANNEL': return 'حذف قناة';
            case 'ADD_CHANNEL_TO_CATEGORY': return 'إضافة قناة إلى تصنيف';
            case 'REMOVE_CHANNEL_FROM_CATEGORY': return 'إزالة قناة من تصنيف';
            case 'REPLACE_CATEGORY_CHANNELS': return 'استبدال قنوات التصنيف';
            default: return type;
        }
    };

    return (
        <div className="font-sans min-h-screen text-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <Brain className="w-6 h-6 text-emerald-400 animate-pulse" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                مدير الروابط بالذكاء الاصطناعي (Gemini AI)
                            </h1>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm md:text-base">
                            قم بإدارة وإضافة واستبدال روابط القنوات والمجموعات بسهولة عن طريق الأوامر النصية أو رفع ملفات البث.
                        </p>
                    </div>
                    <Link href="/channels" className="self-start md:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition flex items-center gap-2">
                        <span>إدارة القنوات</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Forms Section (2 cols on large) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prompt Input */}
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span>اكتب أمرك للذكاء الاصطناعي:</span>
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="مثال: أضف هذه القنوات إلى تصنيف 'BeIN Sports'، أو استبدل قنوات تصنيف 'الأخبار' بالروابط المرفقة..."
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none transition text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-emerald-500/20"
                            />
                            
                            {/* Tips */}
                            <div className="text-xs text-slate-500 space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                                <span className="font-semibold block text-slate-400">💡 تلميحات مفيدة:</span>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>يمكنك تحديد ما إذا كانت القنوات أو التصنيفات مميزة (Premium).</li>
                                    <li>سيقوم الذكاء الاصطناعي بالتحقق من القنوات الموجودة بالفعل لتفادي التكرار.</li>
                                    <li>يمكنك لصق روابط أو نصوص بصيغة M3U مباشرةً هنا أو في ملف مستقل.</li>
                                </ul>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="bg-slate-900/50 backdrop-blur-md border border-slate-800 border-dashed hover:border-emerald-500/50 rounded-2xl p-8 transition flex flex-col items-center justify-center text-center cursor-pointer relative group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".m3u,.txt,.json,.m3u8"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            
                            <div className="p-4 bg-slate-950/60 rounded-full border border-slate-800 group-hover:border-emerald-500/30 transition mb-4">
                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition" />
                            </div>

                            {fileName ? (
                                <div className="space-y-2 z-10">
                                    <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium">
                                        <FileText className="w-4 h-4" />
                                        <span>{fileName}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearFile();
                                            }}
                                            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-300 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">تم تحميل محتوى الملف بنجاح وجاهز للتحليل.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-300">اسحب وأفلت ملف القنوات هنا، أو اضغط للتصفح</p>
                                    <p className="text-xs text-slate-500">يدعم ملفات (.m3u, .txt, .json) حتى حجم 5 ميجابايت</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || (!prompt.trim() && !fileText.trim())}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-lg shadow-emerald-950/40 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>جاري تحليل البيانات مع Gemini...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>تحليل البيانات بالذكاء الاصطناعي</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Instructions / Quick Templates Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-slate-200">أمثلة سريعة للأوامر</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setPrompt("قم بإنشاء تصنيف جديد باسم 'باقة الأفلام' واجعله تصنيف مميز Premium")}
                                    className="w-full text-right p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                                >
                                    إنشاء تصنيف جديد باسم 'باقة الأفلام' واجعله تصنيف مميز Premium
                                </button>
                                <button
                                    onClick={() => setPrompt("أضف القنوات الموجودة في الملف إلى تصنيف 'قنوات الأخبار'")}
                                    className="w-full text-right p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                                >
                                    أضف القنوات الموجودة في الملف إلى تصنيف 'قنوات الأخبار'
                                </button>
                                <button
                                    onClick={() => setPrompt("استبدل جميع القنوات الحالية في تصنيف 'مصر الرياضية' بقنوات الملف")}
                                    className="w-full text-right p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                                >
                                    استبدل جميع القنوات الحالية في تصنيف 'مصر الرياضية' بقنوات الملف
                                </button>
                                <button
                                    onClick={() => setPrompt("احذف قناة 'Test channel'")}
                                    className="w-full text-right p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                                >
                                    احذف قناة 'Test channel'
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Results */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-400 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">تنبيه: </span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-lg mb-1">تمت العملية بنجاح!</h4>
                            <p className="text-sm text-emerald-500/80">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Actions Preview Section */}
                {actions && actions.length > 0 && (
                    <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-200">معاينة العمليات المقترحة ({actions.length})</h3>
                                <p className="text-xs text-slate-500 mt-1">راجع التعديلات التي سيقوم الذكاء الاصطناعي بتطبيقها على قاعدة البيانات.</p>
                            </div>
                            
                            <button
                                onClick={handleApply}
                                disabled={executing}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-900/10"
                            >
                                {executing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>جاري تطبيق التعديلات...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>تأكيد وتطبيق التعديلات</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* List of operations */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {actions.map((act, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-slate-950 p-4 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-4 transition hover:bg-slate-900/40`}
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-slate-600 font-mono">#{idx + 1}</span>
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getActionBadgeColor(act.type)}`}>
                                                {getActionLabel(act.type)}
                                            </span>
                                        </div>

                                        {/* Dynamic details based on type */}
                                        <div className="text-sm space-y-1">
                                            {act.categoryName && (
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">التصنيف المستهدف:</span> {act.categoryName}
                                                    {act.isPremiumCategory && <span className="text-amber-500 font-medium text-xs ml-2">(مميز)</span>}
                                                </p>
                                            )}
                                            {act.channelName && (
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">اسم القناة:</span> {act.channelName}
                                                </p>
                                            )}
                                            {act.categoryNames && act.categoryNames.length > 0 && (
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">التصنيفات المربوطة:</span> {act.categoryNames.join(', ')}
                                                </p>
                                            )}
                                            
                                            {/* Streams */}
                                            {act.streams && act.streams.length > 0 && (
                                                <div className="mt-2 space-y-1 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                                                    <span className="text-xs text-slate-500 font-bold block mb-1">مصادر البث المكتشفة ({act.streams.length}):</span>
                                                    {act.streams.map((stream, sIdx) => (
                                                        <div key={sIdx} className="flex flex-col md:flex-row md:items-center justify-between text-xs gap-2 py-1 border-b border-slate-800 last:border-0">
                                                            <span className="text-slate-300 font-medium">{stream.name}</span>
                                                            <span className="font-mono text-slate-500 truncate max-w-md" title={stream.url}>{stream.url}</span>
                                                            {stream.isPremiumStream && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 rounded">Premium</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Channels (For Bulk Replace) */}
                                            {act.channels && act.channels.length > 0 && (
                                                <div className="mt-2 space-y-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 max-h-40 overflow-y-auto">
                                                    <span className="text-xs text-slate-500 font-bold block mb-1">القنوات المستبدلة ({act.channels.length}):</span>
                                                    {act.channels.map((ch, cIdx) => (
                                                        <div key={cIdx} className="text-xs border-b border-slate-800 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
                                                            <span className="text-slate-300 font-semibold">{ch.name}</span>
                                                            <div className="space-y-0.5 mt-1">
                                                                {ch.stream_link.map((st, stIdx) => (
                                                                    <div key={stIdx} className="text-[11px] text-slate-500 flex items-center justify-between pl-2 border-l border-slate-800">
                                                                        <span>{st.name}</span>
                                                                        <span className="truncate max-w-xs text-slate-600">{st.url}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
