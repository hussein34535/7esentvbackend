import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/mobile/goals
export async function GET() {
    try {
        const goals = await sql`
            SELECT * FROM goals 
            WHERE is_published = true
            ORDER BY created_at DESC
        `;

        // Filter premium content and clean up URL
        const filteredGoals = goals.map(goal => {
            let sources: { name: string, url: string }[] = [];
            let primaryUrl = '';

            let rawUrl = goal.url;
            if (rawUrl) {
                if (typeof rawUrl === 'string' && (rawUrl.trim().startsWith('{') || rawUrl.trim().startsWith('['))) {
                    try { rawUrl = JSON.parse(rawUrl); } catch (e) { }
                }

                if (Array.isArray(rawUrl)) {
                    sources = rawUrl;
                    primaryUrl = rawUrl[0]?.url || '';
                } else if (typeof rawUrl === 'object' && rawUrl.url) {
                    sources = [{ name: 'Server 1', url: rawUrl.url }];
                    primaryUrl = rawUrl.url;
                } else if (typeof rawUrl === 'string') {
                    sources = [{ name: 'Server 1', url: rawUrl }];
                    primaryUrl = rawUrl;
                }
            }

            return {
                id: goal.id,
                title: goal.title,
                image: goal.image,
                is_premium: goal.is_premium,
                // Only show URLs if not premium
                url: goal.is_premium ? null : primaryUrl,
                sources: goal.is_premium ? [] : sources,
                created_at: goal.created_at
            };
        });

        return NextResponse.json({
            success: true,
            data: filteredGoals
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch goals' },
            { status: 500 }
        );
    }
}
