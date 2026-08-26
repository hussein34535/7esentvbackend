'use client';

import { useState, useEffect } from 'react';
import { getPaymentRequests, approvePaymentRequest, rejectPaymentRequest } from '@/app/actions';
import { Check, X, Clock, Image as ImageIcon, Inbox } from 'lucide-react';

type RequestRow = {
    id: string;
    user_id: string;
    package_id?: number | null;
    duration_days?: number | null;
    status?: string;
    created_at?: string;
    plan_name?: string | null;
    payment_identifier?: string | null;
    receipt_image?: { url?: string } | null;
};

export default function RequestsPage() {
    const [requests, setRequests] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const loadData = async () => {
        try {
            const data = await getPaymentRequests();
            setRequests((data || []) as RequestRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (req: RequestRow) => {
        if (!confirm('Approve this request? Use will get subscription immediately.')) return;
        setProcessingId(req.id);

        const result = await approvePaymentRequest(
            req.id,
            req.user_id,
            req.duration_days || 30, // Default to 30 if package deleted
            req.package_id ?? 0
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

    const filteredRequests = requests.filter(req =>
        statusFilter === 'all' || (req.status && req.status === statusFilter)
    );

    const statusFilters = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
    ];

    const btnFocus = "focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Payment Requests</h1>
                {!loading && (
                    <p className="text-xs md:text-sm text-inkmute mt-1">
                        {filteredRequests.length} of {requests.length} requests
                    </p>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto mb-4 pb-0.5">
                {statusFilters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 shrink-0 ${btnFocus} ${
                            statusFilter === f.key
                                ? 'bg-gradient-red border-transparent text-white'
                                : 'bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-6">
                            <div className="w-24 h-24 bg-surface2 rounded-xl animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-surface2 rounded animate-pulse" />
                                <div className="h-5 w-1/3 bg-surface2 rounded animate-pulse" />
                                <div className="h-3 w-1/4 bg-surface2 rounded animate-pulse" />
                            </div>
                            <div className="hidden md:flex h-9 w-36 bg-surface2 rounded-[10px] animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <Inbox className="w-10 h-10 text-inkmute/40" />
                    <p className="text-sm text-inksoft">No payment requests found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRequests.map((req) => (
                        <div key={req.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-violet-500/40 hover:shadow-cardhover transition-all duration-200">

                            <div className="w-24 h-24 bg-surface2 rounded-xl overflow-hidden flex-shrink-0 relative border border-line">
                                {req.receipt_image ? (
                                    <a href={req.receipt_image.url || '#'} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={req.receipt_image.url}
                                            alt="Receipt"
                                            className="w-full h-full object-cover hover:opacity-80 transition cursor-pointer"
                                        />
                                    </a>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-inkmute/50">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        req.status === 'approved' ? 'bg-successsoft text-success' :
                                        req.status === 'rejected' ? 'bg-dangersoft text-danger' :
                                            'bg-warnsoft text-warn'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            req.status === 'approved' ? 'bg-success' :
                                            req.status === 'rejected' ? 'bg-danger' : 'bg-warn'
                                        }`} />
                                        {req.status}
                                    </span>
                                    <span className="text-inkmute text-xs tabular-nums flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-ink text-lg">
                                    {req.plan_name || 'Unknown Package'}
                                </h3>
                                <p className="text-xs text-inkmute tabular-nums mt-1">
                                    User ID: {req.user_id}
                                </p>
                                {req.payment_identifier && (
                                    <div className="mt-2 inline-flex items-baseline gap-2 bg-surface2 border border-line px-3 py-1.5 rounded-[10px] text-sm">
                                        <span className="text-inkmute">Sender:</span>
                                        <span className="text-ink font-medium tabular-nums">{req.payment_identifier}</span>
                                    </div>
                                )}
                            </div>

                            {req.status === 'pending' && (
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={processingId === req.id}
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium text-accentstrong hover:bg-violet-500/10 transition-colors disabled:opacity-40 disabled:pointer-events-none ${btnFocus}`}
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        disabled={processingId === req.id}
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium text-danger hover:bg-dangersoft transition-colors disabled:opacity-40 disabled:pointer-events-none ${btnFocus}`}
                                    >
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {(req.status === 'approved' || req.status === 'rejected') && (
                                <div className="text-inkmute text-sm italic shrink-0">
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
