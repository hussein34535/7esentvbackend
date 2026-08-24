'use client';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import { getMatches, deleteMatch, bulkDeleteMatches, duplicateMatch, deleteAllMatches } from './actions';
import { Database } from '@/types/database.types';
import Link from 'next/link';
import {
    Plus,
    Trash2,
    CheckSquare,
    Square,
    XSquare,
    Copy,
    Sparkles,
    Search,
    X,
    CalendarDays
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type Match = Database['public']['Tables']['matches']['Row'];

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

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

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL matches? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const result = await deleteAllMatches();
      if (result.success) {
        loadMatches();
        router.refresh();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredMatches = query
    ? matches.filter(
        (m) =>
          m.team_a.toLowerCase().includes(query) ||
          m.team_b.toLowerCase().includes(query)
      )
    : matches;

  const secondaryBtn =
    'inline-flex items-center gap-2 bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] px-3 md:px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
  const primaryBtn =
    'inline-flex items-center gap-2 bg-accent hover:bg-accentstrong text-white rounded-[10px] px-3 md:px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';
  const iconBtn =
    'p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Matches</h1>
          {!loading && (
            <p className="text-xs md:text-sm text-inkmute mt-1 tabular-nums">
              {filteredMatches.length} of {matches.length} matches
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={`${secondaryBtn} ${selectMode ? 'bg-accent border-accent text-white hover:bg-accentstrong' : ''}`}
          >
            {selectMode ? <XSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            <span>{selectMode ? 'إلغاء' : 'تحديد'}</span>
          </button>

          <Link href="/matches/auto-import" className={secondaryBtn}>
            <Sparkles className="w-4 h-4" />
            <span>جلب تلقائي</span>
          </Link>

          <Link href="/matches/new" className={primaryBtn}>
            <Plus className="w-4 h-4" />
            <span>إضافة مباراة</span>
          </Link>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmute pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name..."
            className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-9 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconBtn} text-inkmute hover:text-ink hover:bg-canvas`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectMode && !loading && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 p-3 bg-surface border border-line rounded-xl shadow-card">
          <span className="text-sm text-inksoft font-medium tabular-nums mr-1">
            {selectedIds.size} selected
          </span>
          <button
            onClick={selectAll}
            className="text-xs font-medium text-accent hover:text-accentstrong px-2 py-1.5 rounded-lg hover:bg-accentsoft transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-xs font-medium text-inksoft hover:text-ink px-2 py-1.5 rounded-lg hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            Deselect All
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || deleting}
            className="inline-flex items-center gap-2 bg-danger hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={deleting || matches.length === 0}
            className="inline-flex items-center gap-2 bg-surface border border-line hover:bg-dangersoft hover:border-danger/40 hover:text-danger disabled:opacity-40 disabled:pointer-events-none text-ink px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-line rounded-2xl p-4 md:p-5 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-3 w-20 bg-surface2 rounded-full" />
                <div className="h-5 w-20 bg-surface2 rounded-full" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-full bg-surface2" />
                <div className="h-3 w-6 bg-surface2 rounded-full" />
                <div className="w-14 h-14 rounded-full bg-surface2" />
              </div>
              <div className="h-9 w-28 mx-auto bg-surface2 rounded-full mb-4" />
              <div className="pt-3 border-t border-line space-y-2">
                <div className="h-3 w-3/4 bg-surface2 rounded-full" />
                <div className="h-3 w-1/2 bg-surface2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 md:py-20">
          <CalendarDays className="w-10 h-10 text-inkmute/40 mx-auto mb-3" />
          {search ? (
            <>
              <p className="text-sm text-inksoft mb-3">No matches found for your search.</p>
              <button
                onClick={() => setSearch('')}
                className="text-sm font-medium text-accent hover:text-accentstrong transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg focus-visible:outline-none"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-inksoft mb-3">No matches yet.</p>
              <Link
                href="/matches/new"
                className="inline-block text-sm font-medium text-accent hover:text-accentstrong transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg focus-visible:outline-none"
              >
                Add your first match
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredMatches.map((match) => (
            <div key={match.id} className={`relative group ${!match.is_published ? 'opacity-60' : ''}`}>
              {selectMode && (
                <button
                  onClick={() => toggleSelect(match.id)}
                  aria-label="Toggle selection"
                  className={`absolute top-2 left-2 z-30 p-2 rounded-lg bg-surface border border-line transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                    selectedIds.has(match.id)
                      ? 'border-accent text-accentstrong'
                      : 'text-inkmute hover:text-ink hover:bg-surface2'
                  }`}
                >
                  {selectedIds.has(match.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              )}
              {!match.is_published && (
                <div className="absolute -top-2 left-3 z-20 bg-warnsoft text-warn text-[10px] font-bold px-2 py-0.5 rounded-full border border-line shadow-sm">
                  DRAFT
                </div>
              )}
              <MatchCard
                match={match}
                onClick={() => handleEditClick(match.id)}
                selected={selectMode && selectedIds.has(match.id)}
              />
              {!selectMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-30">
                  <button
                    onClick={(e) => handleDuplicate(e, match.id)}
                    title="Duplicate as Draft"
                    className={`p-2 rounded-lg bg-surface border border-line text-inkmute hover:text-accentstrong hover:border-accent/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, match.id)}
                    title="Delete Match"
                    className={`p-2 rounded-lg bg-surface border border-line text-inkmute hover:text-danger hover:bg-dangersoft hover:border-danger/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
