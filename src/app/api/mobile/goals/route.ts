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
            let cleanUrl = goal.url;

            // Unpack if stringified JSON
            if (typeof cleanUrl === 'string' && (cleanUrl.trim().startsWith('{') || cleanUrl.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(cleanUrl);
                    if (parsed.url) cleanUrl = parsed.url;
                } catch (e) { /* ignore */ }
            }
            // Unpack if already object
            else if (typeof cleanUrl === 'object' && cleanUrl?.url) {
                cleanUrl = cleanUrl.url;
            }

            return {
                id: goal.id,
                title: goal.title,
                image: goal.image,
                is_premium: goal.is_premium,
                // Only show URL if not premium
                url: goal.is_premium ? null : cleanUrl,
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
