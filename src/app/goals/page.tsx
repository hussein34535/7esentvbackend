'use client';

import { useEffect, useState } from 'react';
import { getGoals, deleteGoal } from '@/app/actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, Video, Calendar, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Goal = Database['public']['Tables']['goals']['Row'];

export default function GoalsPage() {
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getGoals();
            setGoals(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        if (!confirm('Delete this goal?')) return;
        await deleteGoal(id);
        loadData();
        router.refresh();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                        Goals
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage latest goal highlights.</p>
                </div>

                <Link href="/goals/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition">
                    <Plus className="w-4 h-4" />
                    <span>Add Goal</span>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        // Helper to get image URL safely
                        const imgUrl = Array.isArray(goal.image) && goal.image[0]?.url ? goal.image[0].url : null;

                        return (
                            <Link href={`/goals/${goal.id}`} key={goal.id} className={`block group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition relative ${!goal.is_published ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                {/* Premium Badge */}
                                {goal.is_premium && (
                                    <div className="absolute top-2 right-2 z-10 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> VIP
                                    </div>
                                )}
                                {/* Draft Badge */}
                                {!goal.is_published && (
                                    <div className="absolute top-2 left-2 z-10 bg-slate-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow-lg border border-slate-500">
                                        DRAFT
                                    </div>
                                )}

                                <div className="h-40 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                                    {imgUrl ? (
                                        <img src={imgUrl} alt={goal.title || 'Goal Image'} className="w-full h-full object-cover transition group-hover:scale-105" />
                                    ) : (
                                        <Video className="w-10 h-10 text-slate-700" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2 truncate group-hover:text-blue-400 transition">{goal.title || 'Untitled Goal'}</h3>
                                    <div className="flex items-center text-slate-500 text-xs mb-4">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {goal.time ? new Date(goal.time).toLocaleDateString() : 'No Date'}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                        <span className="text-xs text-slate-500 font-mono">ID: {goal.id}</span>
                                        <button
                                            onClick={(e) => handleDelete(e, goal.id)}
                                            className="text-red-500 hover:bg-red-500/10 p-2 rounded transition z-20 relative"
                                            title="Delete Goal"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
            {!loading && goals.length === 0 && (
                <div className="text-center p-10 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    No goals found. Add one to get started.
                </div>
            )}
        </div>
    );
}
