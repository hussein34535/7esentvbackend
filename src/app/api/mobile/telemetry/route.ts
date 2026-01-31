import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { uid } = await request.json();
        const today = new Date().toISOString().split('T')[0];

        // 1. Ensure Daily Stat Row Exists
        await sql`
            INSERT INTO daily_stats (date, active_users, new_users, total_requests)
            VALUES (${today}, 0, 0, 0)
            ON CONFLICT (date) DO NOTHING
        `;

        // 2. Update Total Requests (Simple Hit Counter)
        await sql`
            UPDATE daily_stats 
            SET total_requests = total_requests + 1, updated_at = now() 
            WHERE date = ${today}
        `;

        // 3. Update User Last Active
        if (uid) {
            await sql`
                UPDATE users 
                SET last_active_at = now() 
                WHERE id = ${uid}
            `;

            // NOTE: Accurate DAU (Daily Active Users) requires verifying if THIS user was already counted today.
            // For a simple "Estimate", we can't easily do specific DAU without a lookup table.
            // However, we can approximate "Active Users" by counting users with last_active_at = today.

            const activeCountRes = await sql`
                SELECT count(*) as count 
                FROM users 
                WHERE date(last_active_at) = ${today}
            `;

            await sql`
                UPDATE daily_stats 
                SET active_users = ${activeCountRes[0].count} 
                WHERE date = ${today}
            `;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Telemetry Error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
