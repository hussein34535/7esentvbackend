'use server';

import * as cheerio from 'cheerio';
import sql from '@/lib/db';
import { Database } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
import { sendAdminNotification, sendUserApprovalNotification, sendUserRejectionNotification } from '@/lib/email';
import { CloudinaryAsset } from '@/types/cloudinary.types';

type Match = Database['public']['Tables']['matches']['Row'];
type Channel = Database['public']['Tables']['channels']['Row'];
type Category = Database['public']['Tables']['channel_categories']['Row'];
type Goal = Database['public']['Tables']['goals']['Row'];
type News = Database['public']['Tables']['news']['Row'];

// --- MATCHES ---
export async function getMatches(): Promise<Match[]> {
    try {
        return await sql<Match[]>`SELECT * FROM matches ORDER BY match_time DESC`;
    } catch (error) { return []; }
}

export async function getMatch(id: number): Promise<Match | null> {
    try {
        const rows = await sql<Match[]>`SELECT * FROM matches WHERE id = ${id}`;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}

export async function createMatch(data: any) {
    try {
        await sql`
      INSERT INTO matches (team_a, team_b, match_time, channel, commentator, champion, logo_a, logo_b, is_premium, is_published, stream_link, created_at, updated_at)
      VALUES (${data.team_a}, ${data.team_b}, ${data.match_time}, ${data.channel}, ${data.commentator}, ${data.champion}, ${data.logo_a}, ${data.logo_b}, ${data.is_premium || false}, ${data.is_published ?? true}, ${data.stream_link}, now(), now())
    `;
        revalidatePath('/'); revalidatePath('/matches');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateMatch(id: number, data: any) {
    try {
        await sql`
      UPDATE matches SET 
        team_a = ${data.team_a}, 
        team_b = ${data.team_b}, 
        match_time = ${data.match_time}, 
        channel = ${data.channel}, 
        commentator = ${data.commentator}, 
        champion = ${data.champion}, 
        logo_a = ${data.logo_a}, 
        logo_b = ${data.logo_b}, 
        is_premium = ${data.is_premium}, 
        is_published = ${data.is_published}, 
        stream_link = ${data.stream_link}, 
        updated_at = now()
      WHERE id = ${id}
    `;
        revalidatePath('/'); revalidatePath('/matches');
        revalidatePath(`/matches/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteMatch(id: number) {
    try { await sql`DELETE FROM matches WHERE id = ${id}`; revalidatePath('/'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}

// --- CHANNELS ---
export async function getChannels(): Promise<Channel[]> {
    try { return await sql<Channel[]>`SELECT * FROM channels ORDER BY id ASC`; } catch (e) { return []; }
}

export async function getChannel(id: number): Promise<Channel | null> {
    try {
        const rows = await sql<Channel[]>`
            SELECT c.*, 
            COALESCE(
                json_agg(json_build_object('id', cc.id, 'name', cc.name, 'is_premium', cc.is_premium)) FILTER (WHERE cc.id IS NOT NULL),
                '[]'
            ) as categories
            FROM channels c
            LEFT JOIN _rel_channels_categories rcc ON c.id = rcc.channel_id
            LEFT JOIN channel_categories cc ON rcc.category_id = cc.id
            WHERE c.id = ${id}
            GROUP BY c.id
        `;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}

export async function createChannel(data: { name: string; stream_link: any; category_ids: number[] }) {
    try {
        const result = await sql`INSERT INTO channels (name, stream_link, created_at, updated_at) VALUES (${data.name}, ${data.stream_link}, now(), now()) RETURNING id`;
        const channelId = result[0].id;

        if (data.category_ids && data.category_ids.length > 0) {
            for (const catId of data.category_ids) {
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${channelId}, ${catId})`;
            }
        }

        revalidatePath('/channels'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateChannel(id: number, data: { name: string; stream_link: any; category_ids: number[] }) {
    try {
        await sql`UPDATE channels SET name = ${data.name}, stream_link = ${data.stream_link}, updated_at = now() WHERE id = ${id}`;

        // Update relations: Delete all and re-insert (simple approach)
        await sql`DELETE FROM _rel_channels_categories WHERE channel_id = ${id}`;
        if (data.category_ids && data.category_ids.length > 0) {
            for (const catId of data.category_ids) {
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${id}, ${catId})`;
            }
        }

        revalidatePath('/channels');
        revalidatePath(`/channels/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function deleteChannel(id: number) {
    try { await sql`DELETE FROM channels WHERE id = ${id}`; revalidatePath('/channels'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}

// --- CATEGORIES ---
export async function getCategories(): Promise<Category[]> {
    try { return await sql<Category[]>`SELECT * FROM channel_categories ORDER BY sort_order ASC, id ASC`; } catch (e) { return []; }
}

// Added getCategory for fetching single with channels
export async function getCategory(id: number) {
    try {
        const rows = await sql`
            SELECT cc.*, 
            COALESCE(
                json_agg(json_build_object('id', c.id, 'name', c.name)) FILTER (WHERE c.id IS NOT NULL),
                '[]'
            ) as channels
            FROM channel_categories cc
            LEFT JOIN _rel_channels_categories rcc ON cc.id = rcc.category_id
            LEFT JOIN channels c ON rcc.channel_id = c.id
            WHERE cc.id = ${id}
            GROUP BY cc.id
        `;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}

export async function createCategory(data: { name: string; is_premium: boolean; sort_order?: number; channel_ids?: number[]; image?: any }) {
    try {
        const result = await sql`INSERT INTO channel_categories (name, is_premium, sort_order, image, created_at, updated_at) VALUES (${data.name}, ${data.is_premium}, ${data.sort_order || 0}, ${data.image || null}, now(), now()) RETURNING id`;
        const catId = result[0].id;

        if (data.channel_ids && data.channel_ids.length > 0) {
            for (const chId of data.channel_ids) {
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${chId}, ${catId})`;
            }
        }
        revalidatePath('/categories'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateCategory(id: number, data: { name: string; is_premium: boolean; sort_order?: number; channel_ids?: number[]; image?: any }) {
    try {
        await sql`UPDATE channel_categories SET name = ${data.name}, is_premium = ${data.is_premium}, sort_order = ${data.sort_order || 0}, image = ${data.image || null}, updated_at = now() WHERE id = ${id}`;

        // Update relations: Delete entries for this Category and re-insert
        // Note: This removes channels from THIS category, but doesn't delete the channels themselves.
        await sql`DELETE FROM _rel_channels_categories WHERE category_id = ${id}`;

        if (data.channel_ids && data.channel_ids.length > 0) {
            for (const chId of data.channel_ids) {
                // Ensure unique pairs just in case, though app logic shouldn't send dupes
                // Using ON CONFLICT DO NOTHING if constraint existed, but basic Insert loop is fine for now
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${chId}, ${id})`;
            }
        }

        revalidatePath('/categories');
        revalidatePath(`/categories/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function deleteCategory(id: number) {
    try { await sql`DELETE FROM channel_categories WHERE id = ${id}`; revalidatePath('/categories'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}

// --- GOALS ---
export async function getGoals(): Promise<Goal[]> {
    try { return await sql<Goal[]>`SELECT * FROM goals ORDER BY created_at DESC`; } catch (e) { return []; }
}
export async function getGoal(id: number): Promise<Goal | null> {
    try {
        const rows = await sql<Goal[]>`SELECT * FROM goals WHERE id = ${id}`;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}
export async function createGoal(data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`INSERT INTO goals (title, image, url, is_premium, is_published, created_at, updated_at) VALUES (${data.title}, ${data.image}, ${JSON.stringify(data.url)}::jsonb, ${data.is_premium}, ${data.is_published ?? true}, now(), now())`;
        revalidatePath('/goals'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateGoal(id: number, data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`UPDATE goals SET title = ${data.title}, image = ${data.image}, url = ${JSON.stringify(data.url)}::jsonb, is_premium = ${data.is_premium}, is_published = ${data.is_published}, updated_at = now() WHERE id = ${id}`;
        revalidatePath('/goals');
        revalidatePath(`/goals/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteGoal(id: number) {
    try { await sql`DELETE FROM goals WHERE id = ${id}`; revalidatePath('/goals'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}

// --- NEWS ---
export async function getNews(): Promise<News[]> {
    try { return await sql<News[]>`SELECT * FROM news ORDER BY id DESC`; } catch (e) { return []; }
}
export async function getNewsItem(id: number): Promise<News | null> {
    try {
        const rows = await sql<News[]>`SELECT * FROM news WHERE id = ${id}`;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}
export async function createNews(data: { title: string; image: any; link: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`INSERT INTO news (title, image, link, is_premium, is_published, date, created_at, updated_at) VALUES (${data.title}, ${data.image}, ${data.link}, ${data.is_premium}, ${data.is_published ?? true}, now(), now(), now())`;
        revalidatePath('/news'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateNews(id: number, data: { title: string; image: any; link: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`UPDATE news SET title = ${data.title}, image = ${data.image}, link = ${data.link}, is_premium = ${data.is_premium}, is_published = ${data.is_published}, updated_at = now() WHERE id = ${id}`;
        revalidatePath('/news');
        revalidatePath(`/news/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteNews(id: number) {
    try { await sql`DELETE FROM news WHERE id = ${id}`; revalidatePath('/news'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}

// --- BULK DELETE ---
export async function bulkDeleteChannels(ids: number[]) {
    try {
        await sql`DELETE FROM _rel_channels_categories WHERE channel_id = ANY(${ids}::bigint[])`;
        await sql`DELETE FROM channels WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/channels');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function bulkDeleteCategories(ids: number[]) {
    try {
        await sql`DELETE FROM _rel_channels_categories WHERE category_id = ANY(${ids}::bigint[])`;
        await sql`DELETE FROM channel_categories WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/categories');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function bulkDeleteMatches(ids: number[]) {
    try {
        await sql`DELETE FROM matches WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/matches');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function bulkDeleteNews(ids: number[]) {
    try {
        await sql`DELETE FROM news WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/news');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function bulkDeleteGoals(ids: number[]) {
    try {
        await sql`DELETE FROM goals WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/goals');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

// --- DUPLICATE (creates as draft) ---
export async function duplicateMatch(id: number) {
    try {
        const match = await getMatch(id);
        if (!match) return { success: false, error: 'Match not found' };

        const result = await sql`
            INSERT INTO matches (team_a, team_b, match_time, channel, commentator, champion, logo_a, logo_b, is_premium, is_published, stream_link, created_at, updated_at)
            VALUES (
                ${match.team_a + ' (Copy)'}, 
                ${match.team_b}, 
                ${match.match_time}, 
                ${match.channel}, 
                ${match.commentator}, 
                ${match.champion}, 
                ${match.logo_a ? JSON.stringify(match.logo_a) : null}::jsonb, 
                ${match.logo_b ? JSON.stringify(match.logo_b) : null}::jsonb, 
                ${match.is_premium}, 
                false, 
                ${match.stream_link ? JSON.stringify(match.stream_link) : null}::jsonb, 
                now(), 
                now()
            )
            RETURNING id
        `;
        revalidatePath('/');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function duplicateChannel(id: number) {
    try {
        const channel = await getChannel(id);
        if (!channel) return { success: false, error: 'Channel not found' };

        const result = await sql`
            INSERT INTO channels (name, stream_link, created_at, updated_at)
            VALUES (
                ${channel.name + ' (Copy)'}, 
                ${channel.stream_link ? JSON.stringify(channel.stream_link) : null}::jsonb, 
                now(), 
                now()
            )
            RETURNING id
        `;

        // Copy category relations
        const categories = (channel as any).categories || [];
        for (const cat of categories) {
            if (cat.id) {
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${result[0].id}, ${cat.id})`;
            }
        }

        revalidatePath('/channels');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function duplicateCategory(id: number) {
    try {
        const cat = await getCategory(id);
        if (!cat) return { success: false, error: 'Category not found' };

        const result = await sql`
            INSERT INTO channel_categories (name, is_premium, sort_order, created_at, updated_at)
            VALUES (${cat.name + ' (Copy)'}, ${cat.is_premium}, ${cat.sort_order}, now(), now())
            RETURNING id
        `;
        revalidatePath('/categories');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function duplicateNews(id: number) {
    try {
        const news = await getNewsItem(id);
        if (!news) return { success: false, error: 'News not found' };

        const result = await sql`
            INSERT INTO news (title, image, link, is_premium, is_published, date, created_at, updated_at)
            VALUES (
                ${news.title + ' (Copy)'}, 
                ${news.image ? JSON.stringify(news.image) : null}::jsonb, 
                ${news.link ? JSON.stringify(news.link) : null}::jsonb, 
                ${news.is_premium}, 
                false, 
                ${news.date}, 
                now(), 
                now()
            )
            RETURNING id
        `;
        revalidatePath('/news');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function duplicateGoal(id: number) {
    try {
        const goal = await getGoal(id);
        if (!goal) return { success: false, error: 'Goal not found' };

        const result = await sql`
            INSERT INTO goals (title, image, url, is_premium, is_published, time, created_at, updated_at)
            VALUES (
                ${goal.title + ' (Copy)'}, 
                ${goal.image ? JSON.stringify(goal.image) : null}::jsonb, 
                ${goal.url ? JSON.stringify(goal.url) : null}::jsonb, 
                ${goal.is_premium}, 
                false, 
                ${goal.time}, 
                now(), 
                now()
            )
            RETURNING id
        `;
        revalidatePath('/goals');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function duplicateHighlight(id: number) {
    try {
        const highlight = await getHighlight(id);
        if (!highlight) return { success: false, error: 'Highlight not found' };

        const result = await sql`
            INSERT INTO highlights (title, image, url, is_premium, is_published, created_at, updated_at)
            VALUES (
                ${highlight.title + ' (Copy)'}, 
                ${highlight.image ? JSON.stringify(highlight.image) : null}::jsonb, 
                ${highlight.url ? JSON.stringify(highlight.url) : null}::jsonb, 
                ${highlight.is_premium}, 
                false, 
                now(), 
                now()
            )
            RETURNING id
        `;
        revalidatePath('/highlights');
        return { success: true, newId: result[0].id };
    } catch (e: any) { return { success: false, error: e.message }; }
}


export async function deleteAllMatches() {
    try {
        await sql`DELETE FROM matches`;
        revalidatePath('/');
        revalidatePath('/matches');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- PACKAGES ---
export async function getPackages() {
    try { return await sql`SELECT * FROM packages ORDER BY price ASC`; } catch (e) { return []; }
}
export async function createPackage(data: any) {
    try {
        const durationDays = (data.duration_months || 1) * 30;
        await sql`INSERT INTO packages (name, description, price, sale_price, duration_days, duration_months, discount_months, features, is_active) VALUES (${data.name}, ${data.description}, ${data.price}, ${data.sale_price || null}, ${durationDays}, ${data.duration_months || 1}, ${data.discount_months || 0}, ${data.features || '[]'}::jsonb, ${data.is_active ?? true})`;
        revalidatePath('/packages'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updatePackage(id: number, data: any) {
    try {
        const durationDays = (data.duration_months || 1) * 30;
        await sql`UPDATE packages SET name=${data.name}, description=${data.description}, price=${data.price}, sale_price=${data.sale_price || null}, duration_days=${durationDays}, duration_months=${data.duration_months || 1}, discount_months=${data.discount_months || 0}, features=${data.features || '[]'}::jsonb, is_active=${data.is_active}, updated_at=now() WHERE id=${id}`;
        revalidatePath('/packages'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deletePackage(id: number) {
    try { await sql`DELETE FROM packages WHERE id=${id}`; revalidatePath('/packages'); return { success: true }; } catch (e: any) { return { success: false, error: e.message }; }
}

// --- PROMO CODES ---
export async function getPromoCodes() {
    try { return await sql`SELECT * FROM promo_codes ORDER BY created_at DESC`; } catch (e) { return []; }
}
export async function createPromoCode(data: any) {

    try {
        await sql`INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at, is_active) VALUES (${data.code}, ${data.discount_percent}, ${data.max_uses}, ${data.expires_at}, ${data.is_active ?? true})`;
        revalidatePath('/coupons'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updatePromoCode(code: string, data: any) {
    try {
        await sql`UPDATE promo_codes SET discount_percent=${data.discount_percent}, max_uses=${data.max_uses}, expires_at=${data.expires_at}, is_active=${data.is_active} WHERE code=${code}`;
        revalidatePath('/coupons'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deletePromoCode(code: string) {
    try { await sql`DELETE FROM promo_codes WHERE code=${code}`; revalidatePath('/coupons'); return { success: true }; } catch (e: any) { return { success: false, error: e.message }; }
}

// --- PAYMENT METHODS ---
export async function getPaymentMethods() {
    try { return await sql`SELECT * FROM payment_methods ORDER BY id ASC`; } catch (e) { return []; }
}
export async function createPaymentMethod(data: any) {
    try {
        await sql`INSERT INTO payment_methods (name, number, instructions, image, input_label, is_active) VALUES (${data.name}, ${data.number}, ${data.instructions}, ${data.image}, ${data.input_label || 'رقم المحفظة'}, ${data.is_active ?? true})`;
        revalidatePath('/payments'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updatePaymentMethod(id: number, data: any) {
    try {
        await sql`UPDATE payment_methods SET name=${data.name}, number=${data.number}, instructions=${data.instructions}, image=${data.image}, input_label=${data.input_label || 'رقم المحفظة'}, is_active=${data.is_active}, updated_at=now() WHERE id=${id}`;
        revalidatePath('/payments'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deletePaymentMethod(id: number) {
    try { await sql`DELETE FROM payment_methods WHERE id=${id}`; revalidatePath('/payments'); return { success: true }; } catch (e: any) { return { success: false, error: e.message }; }
}

// --- USERS (Enhanced) ---
export async function getUsers() {
    try {
        // Left join with packages to get plan name
        return await sql`
            SELECT u.*, p.name as plan_name 
            FROM users u 
            LEFT JOIN packages p ON u.plan_id = p.id
            ORDER BY u.created_at DESC
        `;
    } catch (e: any) {
        return [];
    }
}

import { auth, firestore } from '@/lib/firebase-admin';

export async function addSubscription(email: string, durationDays: number, planId?: number) {
    try {
        // 1. Find user by email in Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (e) {
            return { success: false, error: 'User not found in Firebase Auth' };
        }

        const uid = userRecord.uid;

        // 2. Calculate new end date (Cumulative)
        const currentUser = await sql`SELECT subscription_end FROM users WHERE id = ${uid}`;
        let baseDate = new Date();
        if (currentUser.length > 0 && currentUser[0].subscription_end) {
            const existingEnd = new Date(currentUser[0].subscription_end);
            if (existingEnd > baseDate) {
                baseDate = existingEnd;
            }
        }

        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + durationDays);

        // 3. Update PostgreSQL
        await sql`
            INSERT INTO users (id, email, subscription_end, plan_id, status, updated_at)
            VALUES (${uid}, ${email}, ${endDate.toISOString()}, ${planId || null}, 'active', now())
            ON CONFLICT (id) 
            DO UPDATE SET 
                subscription_end = ${endDate.toISOString()},
                plan_id = ${planId || null},
                status = 'active',
                updated_at = now()
        `;

        // 4. Sync to Firestore (for mobile app compatibility)
        await firestore.collection('users').doc(uid).set({
            email: email,
            isSubscribed: true,
            subscriptionEnd: endDate.toISOString(),
            status: 'active'
        }, { merge: true });

        // 5. Send Email Notification
        try {
            const pkg = planId ? await sql`SELECT name FROM packages WHERE id = ${planId}` : [];
            await sendUserApprovalNotification(email, pkg[0]?.name || 'Premium');
        } catch (mailErr) {
            console.error('Manual Subscription Email Failed:', mailErr);
        }

        revalidatePath('/users');
        return { success: true, message: `Subscription added until ${endDate.toDateString()}` };
    } catch (e: any) {
        console.error('Add Subscription Error:', e);
        return { success: false, error: e.message };
    }
}

export async function updateUserStatus(uid: string, status: string) {
    try {
        await sql`UPDATE users SET status=${status} WHERE id=${uid}`;

        const isSubscribed = status === 'active';
        await firestore.collection('users').doc(uid).set({
            status: status,
            isSubscribed: isSubscribed
        }, { merge: true });

        revalidatePath('/users');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateUserSubscription(uid: string, subscriptionEnd: string | null, planId: number | null) {
    try {
        let isSubscribed = false;
        let status = 'active';

        if (subscriptionEnd) {
            const endDate = new Date(subscriptionEnd);
            if (endDate > new Date()) {
                isSubscribed = true;
            } else {
                status = 'expired';
            }
        } else {
            status = 'expired';
        }

        // Update Postgres
        await sql`
            UPDATE users SET 
                subscription_end = ${subscriptionEnd}, 
                plan_id = ${planId},
                status = ${status},
                updated_at = now()
            WHERE id = ${uid}
        `;

        // Sync to Firestore
        await firestore.collection('users').doc(uid).set({
            isSubscribed: isSubscribed,
            subscriptionEnd: subscriptionEnd,
            status: status
        }, { merge: true });

        revalidatePath('/users');
        return { success: true };
    } catch (e: any) {
        console.error('updateUserSubscription error:', e);
        return { success: false, error: e.message };
    }
}

// --- ANALYTICS ---
export async function getAnalytics() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Ensure today's record exists
        await sql`
            INSERT INTO daily_stats (date, active_users, new_users, total_requests)
            VALUES (${today}, 0, 0, 0)
            ON CONFLICT (date) DO NOTHING
        `;

        const stats = await sql`
            SELECT * FROM daily_stats 
            ORDER BY date DESC 
            LIMIT 30
        `;

        // Calculate totals
        const totalUsers = await sql`SELECT count(*) as count FROM users`;
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
        await sql`UPDATE users SET last_active_at = now() WHERE id = ${uid}`;

        // 2. Update Daily Stats (Total Requests)
        await sql`
            INSERT INTO daily_stats (date, total_requests, updated_at)
            VALUES (${today}, 1, now())
            ON CONFLICT (date) 
            DO UPDATE SET 
                total_requests = daily_stats.total_requests + 1,
                updated_at = now()
        `;

        return { success: true };
    } catch (e: any) { return { success: false }; }
}

// --- PAYMENT REQUESTS ---
export async function getPaymentRequests() {
    try {
        // Join with packages to get plan name
        return await sql`
            SELECT pr.*, p.name as plan_name, p.duration_days
            FROM payment_requests pr
            LEFT JOIN packages p ON pr.package_id = p.id
            ORDER BY pr.created_at DESC
        `;
    } catch (e: any) { return []; }
}

export async function approvePaymentRequest(id: string, userId: string, durationDays: number, planId: number) {
    try {
        // 1. Activate User Subscription (Cumulative)
        const currentUser = await sql`SELECT subscription_end FROM users WHERE id = ${userId}`;
        let baseDate = new Date();
        if (currentUser.length > 0 && currentUser[0].subscription_end) {
            const existingEnd = new Date(currentUser[0].subscription_end);
            if (existingEnd > baseDate) {
                baseDate = existingEnd;
            }
        }

        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + durationDays);

        await sql`
            INSERT INTO users (id, email, subscription_end, plan_id, status, updated_at)
            VALUES (${userId}, 'user@app.com', ${endDate.toISOString()}, ${planId}, 'active', now())
            ON CONFLICT (id) 
            DO UPDATE SET 
                subscription_end = ${endDate.toISOString()},
                plan_id = ${planId},
                status = 'active',
                updated_at = now()
        `;

        // Sync to Firestore
        await firestore.collection('users').doc(userId).set({
            isSubscribed: true,
            subscriptionEnd: endDate.toISOString(),
            status: 'active'
        }, { merge: true });

        // 2. Update Request Status
        await sql`UPDATE payment_requests SET status = 'approved', updated_at = now() WHERE id = ${id}`;

        // 3. Send Email Notification
        try {
            const pkg = await sql`SELECT name FROM packages WHERE id = ${planId}`;
            const userSnap = await firestore.collection('users').doc(userId).get();
            const userData = userSnap.data();

            if (userData?.email) {
                await sendUserApprovalNotification(userData.email, pkg[0]?.name || 'Premium');
            }
        } catch (mailErr) {
            console.error('Approval Email Failed:', mailErr);
        }

        revalidatePath('/requests');
        revalidatePath('/users');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function rejectPaymentRequest(id: string) {
    try {
        await sql`UPDATE payment_requests SET status = 'rejected', updated_at = now() WHERE id = ${id}`;
        // Send Rejection Email
        try {
            const reqData = await sql`
                SELECT pr.*, p.name as plan_name 
                FROM payment_requests pr 
                LEFT JOIN packages p ON pr.package_id = p.id 
                WHERE pr.id = ${id}
            `;
            const userSnap = await firestore.collection('users').doc(reqData[0].user_id).get();
            const userData = userSnap.data();

            if (userData?.email) {
                await sendUserRejectionNotification(userData.email, reqData[0].plan_name || 'Premium');
            }
        } catch (mailErr) {
            console.error('Rejection Email Failed:', mailErr);
        }

        revalidatePath('/requests');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function submitPaymentRequest(userId: string, packageId: number, receiptImage: any, paymentIdentifier?: string) {
    try {
        await sql`
            INSERT INTO payment_requests (user_id, package_id, receipt_image, status, payment_identifier)
            VALUES (${userId}, ${packageId}, ${receiptImage}, 'pending', ${paymentIdentifier || null})
        `;
        // Send Email to Admin
        try {
            const pkg = await sql`SELECT name, price, sale_price FROM packages WHERE id = ${packageId}`;
            if (pkg.length > 0) {
                await sendAdminNotification({
                    userName: userId,
                    packageName: pkg[0].name,
                    amount: (pkg[0].sale_price && Number(pkg[0].sale_price) < Number(pkg[0].price) && Number(pkg[0].sale_price) > 0) ? pkg[0].sale_price : pkg[0].price,
                    paymentIdentifier
                });
            }
        } catch (mailErr) {
            console.error('Admin Email Failed:', mailErr);
        }

        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

// --- HIGHLIGHTS ---
export async function getHighlights() {
    try { return await sql`SELECT * FROM highlights ORDER BY created_at DESC`; } catch (e) { return []; }
}
export async function getHighlight(id: number) {
    try {
        const rows = await sql`SELECT * FROM highlights WHERE id = ${id}`;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}
export async function createHighlight(data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`INSERT INTO highlights (title, image, url, is_premium, is_published, created_at, updated_at) VALUES (${data.title}, ${data.image}, ${JSON.stringify(data.url)}::jsonb, ${data.is_premium}, ${data.is_published ?? true}, now(), now())`;
        revalidatePath('/highlights'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateHighlight(id: number, data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`UPDATE highlights SET title = ${data.title}, image = ${data.image}, url = ${JSON.stringify(data.url)}::jsonb, is_premium = ${data.is_premium}, is_published = ${data.is_published}, updated_at = now() WHERE id = ${id}`;
        revalidatePath('/highlights');
        revalidatePath(`/highlights/${id}`);
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteHighlight(id: number) {
    try { await sql`DELETE FROM highlights WHERE id = ${id}`; revalidatePath('/highlights'); return { success: true }; }
    catch (e: any) { return { success: false, error: e.message }; }
}
export async function bulkDeleteHighlights(ids: number[]) {
    try {
        await sql`DELETE FROM highlights WHERE id = ANY(${ids}::bigint[])`;
        revalidatePath('/highlights');
        return { success: true, deleted: ids.length };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function fetchEsenlinks(): Promise<{ links: any[]; categories: string[] }> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_ESENLINKS_URL || 'https://7esenlink.vercel.app';
        const res = await fetch(`${baseUrl}/api/links`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch links: ${res.statusText}`);
        }
        const data = await res.json();
        return {
            links: data.links || [],
            categories: data.categories || [],
        };
    } catch (error: any) {
        console.error('Error fetching Esenlinks:', error);
        return { links: [], categories: [] };
    }
}

export async function scrapeMatches() {
    try {
        const MGA4K_URL = 'https://www.mga4k.co/';
        const res = await fetch(MGA4K_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch source website: ${res.statusText}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);
        const fetchedMatches: any[] = [];

        $('.match-container').each((_i, el) => {
            const $el = $(el);

            const team_a = $el.find('.right-team .team-name').text().trim();
            const team_b = $el.find('.left-team .team-name').text().trim();
            const logo_a = $el.find('.right-team .team-logo img').attr('data-src') || '';
            const logo_b = $el.find('.left-team .team-logo img').attr('data-src') || '';
            const rawTime = $el.find('.match-time').text().trim();
            const infoItems: string[] = [];
            $el.find('.match-info li span').each((_j, span) => {
                infoItems.push($(span).text().trim());
            });

            const channel = infoItems[0] || '';
            const commentator = infoItems[1] || '';
            const champion = infoItems[2] || '';

            // Format match_time for postgres
            const match_time = formatMatchTime(rawTime);

            if (team_a && team_b) {
                fetchedMatches.push({
                    team_a,
                    team_b,
                    logo_a,
                    logo_b,
                    match_time,
                    channel,
                    commentator,
                    champion,
                    is_premium: false,
                    is_published: true,
                    stream_link: []
                });
            }
        });

        return { success: true, matches: fetchedMatches };
    } catch (error: any) {
        console.error('scrapeMatches error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchAndPublishMatches() {
    try {
        const scrapeResult = await scrapeMatches();
        if (!scrapeResult.success || !scrapeResult.matches) {
            return { success: false, error: scrapeResult.error || 'Failed to scrape matches' };
        }

        const scraped = scrapeResult.matches;

        // Fetch existing matches from DB
        const existing = await sql<Match[]>`SELECT team_a, team_b, match_time FROM matches`;

        const results: any[] = [];
        const toInsert: any[] = [];

        for (const match of scraped) {
            const isDuplicate = existing.some(ext => 
                ext.team_a.trim().toLowerCase() === match.team_a.trim().toLowerCase() &&
                ext.team_b.trim().toLowerCase() === match.team_b.trim().toLowerCase() &&
                ext.match_time.trim().slice(0, 5) === match.match_time.trim().slice(0, 5)
            );

            if (isDuplicate) {
                results.push({
                    ...match,
                    status: 'already_published'
                });
            } else {
                toInsert.push(match);
                results.push({
                    ...match,
                    status: 'published'
                });
            }
        }

        if (toInsert.length > 0) {
            await createMultipleMatches(toInsert);
        }

        return { success: true, matches: results, newlyAdded: toInsert.length };
    } catch (error: any) {
        console.error('fetchAndPublishMatches error:', error);
        return { success: false, error: error.message };
    }
}

function formatMatchTime(timeString: string): string {
    const parts = timeString.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!parts) return "00:00:00";

    let hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    const period = parts[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:00`;
}

// --- FORMAT MATCH TITLE ---
function formatMatchTitle(rawTitle: string): string {
    if (!rawTitle) return 'المباراة الكاملة';

    // 1. Clean up common noise words and parentheses content
    let cleaned = rawTitle
        .replace(/[\(\[\{].*?[\)\}\]]/g, '') // Remove content in parentheses/brackets
        .replace(/\b(?:hd|fhd|sd|4k|mp4|avi|fever)\b/gi, '') // Remove quality keywords
        .replace(/(?:المباراة|الكاملة|مباراة|كاملة|شاهد|ملخص|أهداف|اهداف|بث مباشر|تحميل|شوط أول|شوط ثاني|الشوط الأول|الشوط الثاني|الأول|الثاني)/g, '')
        .trim();

    // 2. Identify separators: 'ضد', 'vs', ' v ', '-', '–', '—', 'و'
    let teamA = '';
    let teamB = '';

    const separators = [
        /\s+ضد\s+/i,
        /\s+vs\s+/i,
        /\s+v\s+/i,
        /\s*[-–—]\s*/,
        /\s+و\s+/ // Arabic 'and' with spaces
    ];

    let splitResult: string[] = [];
    for (const sep of separators) {
        const parts = cleaned.split(sep);
        if (parts.length >= 2) {
            const p1 = parts[0].trim();
            const p2 = parts.slice(1).join(' ').trim();
            if (p1 && p2) {
                splitResult = [p1, p2];
                break;
            }
        }
    }

    // Clean team names function
    const cleanTeam = (name: string) => {
        return name
            // Remove digits, punctuation and extra spaces from beginning and end
            .replace(/^[\s\d\p{P}]+/gu, '')
            .replace(/[\s\d\p{P}]+$/gu, '')
            .trim();
    };

    if (splitResult.length === 2) {
        teamA = cleanTeam(splitResult[0]);
        teamB = cleanTeam(splitResult[1]);
    }

    if (teamA && teamB) {
        return `المباراة الكاملة ${teamA} ضد ${teamB}`;
    }

    // Fallback: If no separator/teams found, just clean the whole title
    const finalCleaned = cleanTeam(cleaned.replace(/\s+/g, ' '));
    return finalCleaned ? `المباراة الكاملة ${finalCleaned}` : 'المباراة الكاملة';
}

// --- FETCH VIDEO INFO (Dailymotion oEmbed - no beIN needed) ---
export async function fetchVideoInfo(videoUrl: string) {
    try {
        if (!videoUrl) {
            return { success: false, error: 'يرجى إدخال رابط الفيديو' };
        }

        // Extract Dailymotion video ID from URL
        // Supports: dailymotion.com/video/xagaahm  or  dai.ly/xagaahm  or  dailymotion.com/embed/video/xagaahm
        const dmMatch = videoUrl.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/);

        if (dmMatch) {
            const videoId = dmMatch[1];
            const convertedUrl = `https://7esentv-match.vercel.app/api/video?id=${videoId}`;

            // Use Dailymotion oEmbed API to get title + thumbnail
            const oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(`https://www.dailymotion.com/video/${videoId}`)}&format=json`;
            
            try {
                const res = await fetch(oembedUrl, { next: { revalidate: 0 } });
                if (res.ok) {
                    const data = await res.json();
                    return {
                        success: true,
                        data: {
                            title: formatMatchTitle(data.title || 'مباراة كاملة'),
                            thumbnail: data.thumbnail_url || '',
                            videoUrl: convertedUrl,      // ← 7esentv-match format
                            originalUrl: videoUrl,       // ← الرابط الأصلي للعرض فقط
                            videoId,
                        }
                    };
                }
            } catch (_) {}

            // oEmbed failed but we still have the ID → return with empty thumbnail
            return {
                success: true,
                data: {
                    title: 'مباراة كاملة',
                    thumbnail: '',
                    videoUrl: convertedUrl,
                    originalUrl: videoUrl,
                    videoId,
                }
            };
        }

        // Fallback: YouTube oEmbed
        const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
            try {
                const res = await fetch(oembedUrl, { next: { revalidate: 0 } });
                if (res.ok) {
                    const data = await res.json();
                    return {
                        success: true,
                        data: {
                            title: formatMatchTitle(data.title || 'مباراة كاملة'),
                            thumbnail: data.thumbnail_url || '',
                            videoUrl: videoUrl,     // YouTube يُحفظ كما هو
                            originalUrl: videoUrl,
                            videoId: ytMatch[1],
                        }
                    };
                }
            } catch (_) {}
        }

        // Generic fallback
        return {
            success: true,
            data: {
                title: 'مباراة كاملة',
                thumbnail: '',
                videoUrl: videoUrl,
                originalUrl: videoUrl,
                videoId: null,
            }
        };
    } catch (error: any) {
        console.error('fetchVideoInfo error:', error);
        return { success: false, error: error.message };
    }
}

export async function scrapeBeinGoal(pageUrl: string, videoUrl: string) {
    try {
        if (!pageUrl || !videoUrl) {
            return { success: false, error: 'Missing pageUrl or videoUrl' };
        }

        const res = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            return { success: false, error: 'Failed to fetch beIN Sports page' };
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const title = $('title').text().trim() || $('h1').first().text().trim() || 'ملخص مباراة';
        const description = $('meta[name="description"]').attr('content') || '';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        return {
            success: true,
            data: {
                title,
                description,
                thumbnail,
                videoUrl,
                sourceUrl: pageUrl,
            },
        };
    } catch (error: any) {
        console.error('scrapeBeinGoal error:', error);
        return { success: false, error: error.message };
    }
}

export async function createMultipleMatches(matches: any[]) {
    try {
        for (const data of matches) {
            await sql`
              INSERT INTO matches (team_a, team_b, match_time, channel, commentator, champion, logo_a, logo_b, is_premium, is_published, stream_link, created_at, updated_at)
              VALUES (${data.team_a}, ${data.team_b}, ${data.match_time}, ${data.channel}, ${data.commentator}, ${data.champion}, ${data.logo_a}, ${data.logo_b}, ${data.is_premium || false}, ${data.is_published ?? true}, ${data.stream_link ? JSON.stringify(data.stream_link) : '[]'}::jsonb, now(), now())
            `;
        }
        revalidatePath('/'); revalidatePath('/matches');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

