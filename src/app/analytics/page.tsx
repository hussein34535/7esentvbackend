'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/app/actions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Activity, TrendingUp, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
    const [data, setData] = useState<{ history: any[], overview: any } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalytics().then((res: { history: any[], overview: any }) => {
            // Format dates for chart
            const formattedHistory = res.history.map((item: any) => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            })).reverse(); // Reverse to show oldest to newest

            setData({ ...res, history: formattedHistory });
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Analytics...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Failed to load data</div>;

    const { overview, history } = data;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Analytics Dashboard</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-xl">
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total Users</p>
                        <h2 className="text-3xl font-bold text-white">{overview.totalUsers}</h2>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-xl">
                        <Activity className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Active Today</p>
                        <h2 className="text-3xl font-bold text-white">{overview.activeToday}</h2>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total Requests (Today)</p>
                        <h2 className="text-3xl font-bold text-white">{history[history.length - 1]?.total_requests || 0}</h2>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Users Chart */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Daily Active Users
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                cursor={{ fill: '#1e293b' }}
                            />
                            <Bar dataKey="active_users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Requests Chart */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-slate-400" />
                        Daily API Requests
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                cursor={{ fill: '#1e293b' }}
                            />
                            <Bar dataKey="total_requests" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
