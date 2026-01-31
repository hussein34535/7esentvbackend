const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, 'src/app/actions.ts');

const analyticsCode = `
// --- ANALYTICS ---
export async function getAnalytics() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Ensure today's record exists
        await sql\`
            INSERT INTO daily_stats (date, active_users, new_users, total_requests)
            VALUES (\${today}, 0, 0, 0)
            ON CONFLICT (date) DO NOTHING
        \`;

        const stats = await sql\`
            SELECT * FROM daily_stats 
            ORDER BY date DESC 
            LIMIT 30
        \`;
        
        // Calculate totals
        const totalUsers = await sql\`SELECT count(*) as count FROM users\`;
        const activeToday = stats[0]?.active_users || 0;
        
        return {
            history: stats,
            overview: {
                totalUsers: totalUsers[0].count,
                activeToday
            }
        };
    } catch (e) {
        console.error(e);
        return { history: [], overview: { totalUsers: 0, activeToday: 0 } };
    }
}

export async function trackUserActivity(uid: string) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Update User Last Active
        await sql\`UPDATE users SET last_active_at = now() WHERE id = \${uid}\`;

        // 2. Update Daily Stats (Total Requests)
        await sql\`
            INSERT INTO daily_stats (date, total_requests, updated_at)
            VALUES (\${today}, 1, now())
            ON CONFLICT (date) 
            DO UPDATE SET 
                total_requests = daily_stats.total_requests + 1,
                updated_at = now()
        \`;

        return { success: true };
    } catch (e: any) { return { success: false }; }
}
`;

fs.appendFileSync(actionsPath, analyticsCode);
console.log('Appended analytics actions to actions.ts');
