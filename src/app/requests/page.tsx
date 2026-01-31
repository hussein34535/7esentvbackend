'use client';

import { useState, useEffect } from 'react';
import { getPaymentRequests, approvePaymentRequest, rejectPaymentRequest } from '@/app/actions';
import { Check, X, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getPaymentRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleApprove = async (req: any) => {
        if (!confirm('Approve this request? Use will get subscription immediately.')) return;
        setProcessingId(req.id);

        const result = await approvePaymentRequest(
            req.id,
            req.user_id,
            req.duration_days || 30, // Default to 30 if package deleted
            req.package_id
        );

        if (result.success) {
            loadData();
        } else {
            alert('Error: ' + result.error);
        }
        setProcessingId(null);
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this request?')) return;
        setProcessingId(id);
        await rejectPaymentRequest(id);
        loadData();
        setProcessingId(null);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Payment Requests</h1>

            {loading ? (
                <div className="text-center text-slate-500">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-xl border border-slate-800">
                    No payment requests found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-6">

                            {/* Receipt Image Preview */}
                            <div className="w-24 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0 relative border border-slate-700">
                                {req.receipt_image ? (
                                    <a href={req.receipt_image.url || '#'} target="_blank" rel="noopener noreferrer">
                                        {/* Using standard img tag for simplicity with unknown domains, or Next Image if configured */}
                                        <img
                                            src={req.receipt_image.url}
                                            alt="Receipt"
                                            className="w-full h-full object-cover hover:opacity-80 transition cursor-pointer"
                                        />
                                    </a>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <ImageIcon size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${req.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400' :
                                            req.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                                                'bg-yellow-900/50 text-yellow-400'
                                        }`}>
                                        {req.status}
                                    </span>
                                    <span className="text-slate-500 text-sm flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-white text-lg">
                                    {req.plan_name || 'Unknown Package'}
                                </h3>
                                <p className="text-slate-400 text-sm font-mono mt-1">
                                    User ID: {req.user_id}
                                </p>
                            </div>

                            {/* Actions */}
                            {req.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={processingId === req.id}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                                    >
                                        <Check size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        disabled={processingId === req.id}
                                        className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 transition border border-red-900/50 disabled:opacity-50"
                                    >
                                        <X size={18} />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {(req.status === 'approved' || req.status === 'rejected') && (
                                <div className="text-slate-500 text-sm italic">
                                    Processed
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
