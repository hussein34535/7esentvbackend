'use client';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import { getMatches, deleteMatch, bulkDeleteMatches, duplicateMatch } from './actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import { Plus, Trash2, CheckSquare, Square, XSquare, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Match = Database['public']['Tables']['matches']['Row'];

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await getMatches();
      if (data && data.length > 0) {
        setMatches(data);
      } else {
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
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this match?')) return;
    await deleteMatch(id);
    loadMatches();
    router.refresh();
  };

  const handleDuplicate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const result = await duplicateMatch(id);
    if (result.success) {
      loadMatches();
      router.refresh();
    }
  };

  const handleEditClick = (id: number) => {
    if (selectMode) {
      toggleSelect(id);
    } else {
      router.push(`/matches/${id}`);
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => setSelectedIds(new Set(matches.map(m => m.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected matches?`)) return;

    setDeleting(true);
    try {
      await bulkDeleteMatches(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectMode(false);
      loadMatches();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
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

          <div className="flex gap-2">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition text-xs md:text-sm ${selectMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {selectMode ? <XSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              <span>{selectMode ? 'Cancel' : 'Select'}</span>
            </button>

            <Link href="/matches/new" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition cursor-pointer text-xs md:text-sm">
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Add Match</span>
            </Link>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectMode && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
            <button onClick={selectAll} className="text-xs text-emerald-400 hover:text-emerald-300">Select All</button>
            <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-300">Deselect All</button>
            <div className="flex-1" />
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          </div>
        )}

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
                    {selectMode && (
                      <button
                        onClick={() => toggleSelect(match.id)}
                        className="absolute top-2 left-2 z-30 p-1 rounded bg-slate-800/80"
                      >
                        {selectedIds.has(match.id) ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    )}
                    {!match.is_published && (
                      <div className="absolute top-[-8px] left-2 z-20 bg-slate-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-500">
                        DRAFT
                      </div>
                    )}
                    <div className={`${selectedIds.has(match.id) ? 'ring-2 ring-emerald-500 rounded-xl' : ''}`}>
                      <MatchCard match={match} onClick={() => handleEditClick(match.id)} />
                    </div>
                    {!selectMode && (
                      <div className="absolute top-2 right-2 flex gap-1 z-30">
                        <button
                          onClick={(e) => handleDuplicate(e, match.id)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                          title="Duplicate as Draft"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, match.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                          title="Delete Match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
