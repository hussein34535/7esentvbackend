'use server';

import sql from '@/lib/db';
import { Database } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
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

export async function createCategory(data: { name: string; is_premium: boolean; sort_order?: number; channel_ids?: number[] }) {
    try {
        const result = await sql`INSERT INTO channel_categories (name, is_premium, sort_order, created_at, updated_at) VALUES (${data.name}, ${data.is_premium}, ${data.sort_order || 0}, now(), now()) RETURNING id`;
        const catId = result[0].id;

        if (data.channel_ids && data.channel_ids.length > 0) {
            for (const chId of data.channel_ids) {
                await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${chId}, ${catId})`;
            }
        }
        revalidatePath('/categories'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateCategory(id: number, data: { name: string; is_premium: boolean; sort_order?: number; channel_ids?: number[] }) {
    try {
        await sql`UPDATE channel_categories SET name = ${data.name}, is_premium = ${data.is_premium}, sort_order = ${data.sort_order || 0}, updated_at = now() WHERE id = ${id}`;

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
    try { return await sql<Goal[]>`SELECT * FROM goals ORDER BY id DESC`; } catch (e) { return []; }
}
export async function getGoal(id: number): Promise<Goal | null> {
    try {
        const rows = await sql<Goal[]>`SELECT * FROM goals WHERE id = ${id}`;
        return rows.length > 0 ? rows[0] : null;
    } catch (e) { return null; }
}
export async function createGoal(data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`INSERT INTO goals (title, image, url, is_premium, is_published, time, created_at, updated_at) VALUES (${data.title}, ${data.image}, ${data.url}, ${data.is_premium}, ${data.is_published ?? true}, now(), now(), now())`;
        revalidatePath('/goals'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateGoal(id: number, data: { title: string; image: any; url: any; is_premium: boolean; is_published: boolean }) {
    try {
        await sql`UPDATE goals SET title = ${data.title}, image = ${data.image}, url = ${data.url}, is_premium = ${data.is_premium}, is_published = ${data.is_published}, updated_at = now() WHERE id = ${id}`;
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


