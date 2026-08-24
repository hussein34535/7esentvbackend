'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/app/actions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Activity, TrendingUp } from 'lucide-react';

type HistoryPoint = { date: string; active_users?: number; total_requests?: number; [key: string]: unknown };
type Overview = { totalUsers: number; activeToday: number };

const TICK_STYLE = { fill: '#94a3b8', fontSize: 12 };
const TOOLTIP_STYLE = {
    contentStyle: {
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(30,41,59,0.08)',
        fontSize: 12,
    },
    labelStyle: { color: 'var(--ink)', fontWeight: 600, marginBottom: 2 },
    itemStyle: { color: 'var(--ink)' },
    cursor: { fill: 'rgba(100,116,139,0.10)' },
};

export default function AnalyticsPage() {
    const [data, setData] = useState<{ history: HistoryPoint[], overview: Overview } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalytics().then((res) => {
            // Format dates for chart
            const formattedHistory = res.history.map((item) => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            })).reverse(); // Reverse to show oldest to newest

            setData({ ...res, history: formattedHistory });
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="h-8 w-52 bg-surface2 rounded-xl animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface2 rounded-2xl animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {[1, 2].map(i => <div key={i} className="h-[400px] bg-surface2 rounded-2xl animate-pulse" />)}
            </div>
        </div>
    );
    if (!data) return <div className="p-10 text-center text-sm text-danger">Failed to load data</div>;

    const { overview, history } = data;

    const stats = [
        { label: 'Total Users', value: overview.totalUsers, icon: Users },
        { label: 'Active Today', value: overview.activeToday, icon: Activity },
        { label: 'Total Requests (Today)', value: history[history.length - 1]?.total_requests || 0, icon: TrendingUp },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-gradient-brand tracking-tight">Analytics Dashboard</h1>
                <p className="text-sm text-inksoft mt-1">Usage overview across the platform.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card flex items-center gap-4">
                        <div className="p-2.5 bg-surface2 rounded-xl shrink-0">
                            <Icon className="w-5 h-5 text-inkmute" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-inkmute">{label}</p>
                            <p className="text-2xl font-bold text-ink tabular-nums mt-0.5">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Active Users Chart */}
                <div className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card h-[400px]">
                    <h3 className="text-sm md:text-base font-semibold text-ink mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-inkmute" />
                        Daily Active Users
                    </h3>
                    <ResponsiveContainer width="100%" height="82%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={TICK_STYLE}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={TICK_STYLE}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Bar dataKey="active_users" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Requests Chart */}
                <div className="bg-surface border border-line rounded-2xl p-4 md:p-5 shadow-card h-[400px]">
                    <h3 className="text-sm md:text-base font-semibold text-ink mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-inkmute" />
                        Daily API Requests
                    </h3>
                    <ResponsiveContainer width="100%" height="82%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={TICK_STYLE}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={TICK_STYLE}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Bar dataKey="total_requests" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
