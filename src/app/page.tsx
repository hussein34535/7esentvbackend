'use client';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import { getMatches, deleteMatch } from './actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Match = Database['public']['Tables']['matches']['Row'];

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to load data
  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await getMatches();
      if (data && data.length > 0) {
        setMatches(data);
      } else {
        console.log("No data in DB");
        setMatches([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm('Are you sure you want to delete this match?')) return;

    await deleteMatch(id);
    loadMatches();
    router.refresh();
  };

  const handleEditClick = (id: number) => {
    router.push(`/matches/${id}`);
  };

  return (
    <div className="font-sans selection:bg-emerald-500/30">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Matches Dashboard
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">Manage your matches, scores, and channels.</p>
          </div>

          <Link href="/matches/new" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition cursor-pointer text-xs md:text-sm">
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Add Match</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-900 rounded-xl border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <>
            {matches.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                <p className="text-slate-500 mb-4">No matches found.</p>
                <Link href="/matches/new" className="text-emerald-400 hover:underline">Add your first match</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {matches.map((match) => (
                  <div key={match.id} className={`relative group ${!match.is_published ? 'opacity-60' : ''}`}>
                    {!match.is_published && (
                      <div className="absolute top-[-8px] left-2 z-20 bg-slate-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-500">
                        DRAFT
                      </div>
                    )}
                    <MatchCard match={match} onClick={() => handleEditClick(match.id)} />
                    <button
                      onClick={(e) => handleDelete(e, match.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition z-30"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
