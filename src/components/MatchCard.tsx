'use client';

import { Database } from '@/types/database.types';
import { CheckCircle2, Clock, Crown, Mic, MonitorPlay } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
    selected?: boolean;
}

export default function MatchCard({ match, onClick, selected }: MatchCardProps) {
    const formatTime = (timeStr: string) => {
        // Basic time formatting, assumes UTC
        return timeStr.slice(0, 5);
    };

    const getLogoUrl = (logo: unknown): string | null => {
        if (!logo) return null;

        // Handle "Stringified JSON" (Edge case protection)
        if (typeof logo === 'string') {
            if (logo.trim().startsWith('{') || logo.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(logo);
                    return getLogoUrl(parsed); // Recursive call to handle the object/array
                } catch {
                    return logo; // Return as is if parse fails (it's just a string URL)
                }
            }
            return logo;
        }

        if (Array.isArray(logo)) return (logo[0] as { url?: string } | undefined)?.url ?? null;
        return (logo as { url?: string }).url ?? null;
    };

    const logoAUrl = getLogoUrl(match.logo_a);
    const logoBUrl = getLogoUrl(match.logo_b);

    const renderTeam = (name: string, logoUrl: string | null) => (
        <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface2 border border-line flex items-center justify-center p-2 mb-1.5 md:mb-2 overflow-hidden">
                {logoUrl ? (
                    <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
                ) : (
                    <span className="text-sm md:text-lg font-bold text-inkmute">{name[0]}</span>
                )}
            </div>
            <h3 className="text-xs md:text-sm font-semibold text-ink text-center truncate w-full">{name}</h3>
        </div>
    );

    return (
        <div
            onClick={onClick}
            className={`rounded-2xl p-4 md:p-5 cursor-pointer border transition-all duration-200 ${
                selected
                    ? 'border-accent bg-accentsoft/50'
                    : 'bg-surface border-line hover:border-accent/40 hover:shadow-cardhover'
            }`}
        >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
                {match.champion && (
                    <span className="text-xs md:text-sm font-medium text-inkmute truncate min-w-0">
                        {match.champion}
                    </span>
                )}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    {match.is_premium && (
                        <span className="inline-flex items-center gap-1 bg-warnsoft text-warn text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full">
                            <Crown className="w-3 h-3" />
                            Premium
                        </span>
                    )}
                    <span
                        className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${
                            match.is_published
                                ? 'bg-accentsoft text-accentstrong'
                                : 'bg-warnsoft text-warn'
                        }`}
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        {match.is_published ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {renderTeam(match.team_a, logoAUrl)}
                <span className="text-xs md:text-sm font-semibold text-inkmute shrink-0">VS</span>
                {renderTeam(match.team_b, logoBUrl)}
            </div>

            <div className="mt-3 md:mt-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 bg-accentsoft text-accentstrong rounded-full px-3 py-1.5 text-sm md:text-base font-semibold tabular-nums">
                    <Clock className="w-4 h-4" />
                    {formatTime(match.match_time)}
                    <span className="text-[10px] font-medium text-accentstrong/70">UTC</span>
                </span>
            </div>

            <div className="mt-3 md:mt-4 pt-3 border-t border-line space-y-1.5">
                <div className="flex items-center gap-2 text-xs md:text-sm text-inksoft min-w-0">
                    <Mic className="w-4 h-4 text-inkmute shrink-0" />
                    <span className="truncate">{match.commentator || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-inksoft min-w-0">
                    <MonitorPlay className="w-4 h-4 text-inkmute shrink-0" />
                    <span className="truncate">{match.channel || 'TBD'}</span>
                </div>
            </div>
        </div>
    );
}
