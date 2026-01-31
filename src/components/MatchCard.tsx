'use client';

import { Database } from '@/types/database.types';
import { Calendar, MonitorPlay } from 'lucide-react';
import Image from 'next/image';

type Match = Database['public']['Tables']['matches']['Row'];

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
    const formatTime = (timeStr: string) => {
        // Basic time formatting, assumes UTC
        return timeStr.slice(0, 5);
    };

    const getLogoUrl = (logo: any) => {
        if (!logo) return null;

        // Handle "Stringified JSON" (Edge case protection)
        if (typeof logo === 'string') {
            if (logo.trim().startsWith('{') || logo.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(logo);
                    return getLogoUrl(parsed); // Recursive call to handle the object/array
                } catch (e) {
                    return logo; // Return as is if parse fails (it's just a string URL)
                }
            }
            return logo;
        }

        if (Array.isArray(logo)) return logo[0]?.url;
        return logo.url;
    };

    const logoAUrl = getLogoUrl(match.logo_a);
    const logoBUrl = getLogoUrl(match.logo_b);

    return (
        <div
            onClick={onClick}
            className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-emerald-900/20 transition group cursor-pointer"
        >
            <div className="p-3 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="flex items-center space-x-2 text-slate-400 text-[10px] md:text-sm">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Today</span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 text-[9px] md:text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Live
                    </div>
                </div>

                <div className="flex items-center justify-between gap-1 md:gap-2">
                    {/* Team A */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-16 md:h-16 relative mb-1 md:mb-2 bg-slate-700/50 rounded-full flex items-center justify-center p-1.5 md:p-2 border border-slate-600/30">
                            {/* Use Cloudinary URL if available, else placeholder */}
                            {logoAUrl ? (
                                <img src={logoAUrl} alt={match.team_a} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-base md:text-xl font-bold text-slate-500">{match.team_a[0]}</div>
                            )}
                        </div>
                        <h3 className="text-white font-semibold text-center text-[10px] md:text-base leading-tight truncate w-full px-0.5">{match.team_a}</h3>
                    </div>

                    {/* VS / Time */}
                    <div className="flex flex-col items-center px-1 md:px-4">
                        <div className="text-lg md:text-2xl font-bold text-white mb-0 md:mb-1">{formatTime(match.match_time)}</div>
                        <span className="text-slate-500 text-[9px] md:text-xs">UTC</span>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-16 md:h-16 relative mb-1 md:mb-2 bg-slate-700/50 rounded-full flex items-center justify-center p-1.5 md:p-2 border border-slate-600/30">
                            {logoBUrl ? (
                                <img src={logoBUrl} alt={match.team_b} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-base md:text-xl font-bold text-slate-500">{match.team_b[0]}</div>
                            )}
                        </div>
                        <h3 className="text-white font-semibold text-center text-[10px] md:text-base leading-tight truncate w-full px-0.5">{match.team_b}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center group-hover:bg-slate-800 transition">
                <div className="text-sm text-slate-400">
                    <span className="mr-2">🎙️</span>
                    {match.commentator || 'TBD'}
                </div>
                <button className="flex items-center space-x-2 text-emerald-400 font-medium hover:text-emerald-300 transition">
                    <MonitorPlay className="w-4 h-4" />
                    <span>Watch</span>
                </button>
            </div>
        </div>
    );
}
