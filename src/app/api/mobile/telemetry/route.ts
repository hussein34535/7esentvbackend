import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        let uid = null;
        try {
            const body = await request.json();
            uid = body?.uid;
        } catch (e) {
            // Ignore empty body errors for telemetry
            console.log('Telemetry body is empty or not JSON, skipping uid.');
        }
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

        // 3. Update User Last Active and ensure registration
        if (uid) {
            try {
                // Check if user exists in PostgreSQL
                const userExists = await sql`SELECT id FROM users WHERE id = ${uid}`;
                
                if (userExists.length === 0) {
                    // Fetch user details from Firebase Auth to register them
                    const userRecord = await auth.getUser(uid);
                    await sql`
                        INSERT INTO users (id, email, status, joined_at, last_active_at, updated_at)
                        VALUES (${uid}, ${userRecord.email || null}, 'active', ${userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime).toISOString() : new Date().toISOString()}, now(), now())
                    `;
                } else {
                    await sql`
                        UPDATE users 
                        SET last_active_at = now() 
                        WHERE id = ${uid}
                    `;
                }
            } catch (userErr) {
                console.error('Error handling user telemetry / auto-registration:', userErr);
                // Fallback to simple update if Firebase/Db query failed
                try {
                    await sql`
                        UPDATE users 
                        SET last_active_at = now() 
                        WHERE id = ${uid}
                    `;
                } catch (_) {}
            }

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
