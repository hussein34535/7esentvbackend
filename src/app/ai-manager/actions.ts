'use server';

import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface StreamItem {
    name: string;
    url: string;
    is_premium: boolean;
}

export interface AIOperation {
    type: 'CREATE_CATEGORY' | 'CREATE_CHANNEL' | 'UPDATE_CHANNEL_STREAMS' | 'DELETE_CHANNEL' | 'ADD_CHANNEL_TO_CATEGORY' | 'REMOVE_CHANNEL_FROM_CATEGORY' | 'REPLACE_CATEGORY_CHANNELS';
    categoryName?: string;
    isPremiumCategory?: boolean;
    channelName?: string;
    streams?: { name: string; url: string; isPremiumStream?: boolean }[];
    categoryNames?: string[];
    replace?: boolean;
    channels?: {
        name: string;
        stream_link: { name: string; url: string; isPremiumStream?: boolean }[];
    }[];
}

// Fetch current channels and categories to supply context to Gemini
async function getDatabaseContext() {
    try {
        const categories = await sql`SELECT id, name, is_premium FROM channel_categories ORDER BY name ASC`;
        const channels = await sql`
            SELECT c.id, c.name, 
            COALESCE(
                json_agg(cc.name) FILTER (WHERE cc.name IS NOT NULL),
                '[]'
            ) as categories
            FROM channels c
            LEFT JOIN _rel_channels_categories rcc ON c.id = rcc.channel_id
            LEFT JOIN channel_categories cc ON rcc.category_id = cc.id
            GROUP BY c.id
            ORDER BY c.name ASC
        `;
        return { categories, channels };
    } catch (error) {
        console.error('Error fetching db context for AI:', error);
        return { categories: [], channels: [] };
    }
}

export async function analyzeAIInput(prompt: string, textData: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: 'لم يتم العثور على مفتاح GEMINI_API_KEY في ملفات البيئة للطرف الخلفي. يرجى إضافته في ملف .env.local لبدء الاستخدام.'
        };
    }

    try {
        const { categories, channels } = await getDatabaseContext();

        const systemInstruction = `You are a data parsing assistant for 7esen Admin Panel. Your task is to process natural language instructions and user-uploaded text data (which can be lists of channels, raw M3U streams, or JSON blocks) and translate them into a structured sequence of database modification operations.

You have access to the current database state:
- Categories currently in DB: ${JSON.stringify(categories)}
- Channels currently in DB: ${JSON.stringify(channels.map((c: any) => ({ name: c.name, categories: c.categories })))}

You MUST output a JSON response matching the schema details exactly.
Available operation types you can output:
1. CREATE_CATEGORY: Create a new category.
2. CREATE_CHANNEL: Create a new channel. Provide stream_link array of objects (containing 'name' and 'url' and optionally 'isPremiumStream' boolean) and the categoryNames (array of strings) it belongs to.
3. UPDATE_CHANNEL_STREAMS: Update/add streams to an existing channel. If 'replace' is true, replace all existing streams; if false, append.
4. DELETE_CHANNEL: Delete a channel by name.
5. ADD_CHANNEL_TO_CATEGORY: Link an existing channel to an existing or new category.
6. REMOVE_CHANNEL_FROM_CATEGORY: Unlink an existing channel from a category.
7. REPLACE_CATEGORY_CHANNELS: Replace all channels inside a category with a new list of channels (and their streams). This deletes the category's current channel links and links it only to these channels.

Make sure you map target channel/category names to the ones already existing in the database context if there are slight spelling variations.`;

        const responseSchema = {
            type: "OBJECT",
            properties: {
                actions: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            type: {
                                type: "STRING",
                                enum: ["CREATE_CATEGORY", "CREATE_CHANNEL", "UPDATE_CHANNEL_STREAMS", "DELETE_CHANNEL", "ADD_CHANNEL_TO_CATEGORY", "REMOVE_CHANNEL_FROM_CATEGORY", "REPLACE_CATEGORY_CHANNELS"]
                            },
                            categoryName: { type: "STRING" },
                            isPremiumCategory: { type: "BOOLEAN" },
                            channelName: { type: "STRING" },
                            replace: { type: "BOOLEAN", description: "For UPDATE_CHANNEL_STREAMS. If true, overwrite existing streams. If false, append." },
                            streams: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        name: { type: "STRING" },
                                        url: { type: "STRING" },
                                        isPremiumStream: { type: "BOOLEAN" }
                                    },
                                    required: ["name", "url"]
                                }
                            },
                            categoryNames: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            channels: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        name: { type: "STRING" },
                                        stream_link: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    name: { type: "STRING" },
                                                    url: { type: "STRING" },
                                                    isPremiumStream: { type: "BOOLEAN" }
                                                },
                                                required: ["name", "url"]
                                            }
                                        }
                                    },
                                    required: ["name", "stream_link"]
                                }
                            }
                        },
                        required: ["type"]
                    }
                }
            },
            required: ["actions"]
        };

        const userPrompt = `Instructions: ${prompt}\n\nInput Data / Files:\n${textData}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemInstruction },
                        { text: userPrompt }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errBody}`);
        }

        const resData = await response.json();
        const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('لم يقم النموذج بإرجاع استجابة صالحة.');
        }

        const parsed = JSON.parse(responseText);
        return {
            success: true,
            actions: parsed.actions as AIOperation[]
        };

    } catch (error: any) {
        console.error('Error during AI analysis:', error);
        return {
            success: false,
            error: error.message || 'حدث خطأ غير متوقع أثناء تحليل البيانات.'
        };
    }
}

export async function executeAIActions(actions: AIOperation[]) {
    try {
        await sql.begin(async (tx) => {
            const t: any = tx;
            for (const action of actions) {
                if (action.type === 'CREATE_CATEGORY' && action.categoryName) {
                    const existing = await t`SELECT id FROM channel_categories WHERE name = ${action.categoryName}`;
                    if (existing.length === 0) {
                        await t`INSERT INTO channel_categories (name, is_premium, sort_order, created_at, updated_at) VALUES (${action.categoryName}, ${action.isPremiumCategory || false}, 0, now(), now())`;
                    }
                } 
                
                else if (action.type === 'CREATE_CHANNEL' && action.channelName) {
                    const streams = (action.streams || []).map((s: any) => ({
                        name: s.name,
                        url: s.url,
                        is_premium: s.isPremiumStream || false
                    }));
                    const res = await t`INSERT INTO channels (name, stream_link, created_at, updated_at) VALUES (${action.channelName}, ${JSON.stringify(streams)}::jsonb, now(), now()) RETURNING id`;
                    const channelId = res[0].id;

                    if (action.categoryNames && action.categoryNames.length > 0) {
                        for (const catName of action.categoryNames) {
                            let catRes = await t`SELECT id FROM channel_categories WHERE name = ${catName}`;
                            let catId;
                            if (catRes.length === 0) {
                                const newCat = await t`INSERT INTO channel_categories (name, is_premium, created_at, updated_at) VALUES (${catName}, false, now(), now()) RETURNING id`;
                                catId = newCat[0].id;
                            } else {
                                catId = catRes[0].id;
                            }
                            await t`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${channelId}, ${catId}) ON CONFLICT DO NOTHING`;
                        }
                    }
                } 
                
                else if (action.type === 'UPDATE_CHANNEL_STREAMS' && action.channelName) {
                    const chRes = await t`SELECT id, stream_link FROM channels WHERE name = ${action.channelName}`;
                    if (chRes.length > 0) {
                        const channelId = chRes[0].id;
                        const newStreams = (action.streams || []).map((s: any) => ({
                            name: s.name,
                            url: s.url,
                            is_premium: s.isPremiumStream || false
                        }));

                        let streamsToSave = newStreams;
                        if (!action.replace) {
                            let existingStreams = [];
                            try {
                                existingStreams = Array.isArray(chRes[0].stream_link) ? chRes[0].stream_link : JSON.parse(chRes[0].stream_link || '[]');
                            } catch (e) {
                                existingStreams = [];
                            }
                            streamsToSave = [...existingStreams, ...newStreams];
                        }
                        await t`UPDATE channels SET stream_link = ${JSON.stringify(streamsToSave)}::jsonb, updated_at = now() WHERE id = ${channelId}`;
                    }
                } 
                
                else if (action.type === 'DELETE_CHANNEL' && action.channelName) {
                    const chRes = await t`SELECT id FROM channels WHERE name = ${action.channelName}`;
                    if (chRes.length > 0) {
                        const channelId = chRes[0].id;
                        await t`DELETE FROM _rel_channels_categories WHERE channel_id = ${channelId}`;
                        await t`DELETE FROM channels WHERE id = ${channelId}`;
                    }
                } 
                
                else if (action.type === 'ADD_CHANNEL_TO_CATEGORY' && action.channelName && action.categoryName) {
                    let catRes = await t`SELECT id FROM channel_categories WHERE name = ${action.categoryName}`;
                    let catId;
                    if (catRes.length === 0) {
                        const newCat = await t`INSERT INTO channel_categories (name, is_premium, created_at, updated_at) VALUES (${action.categoryName}, false, now(), now()) RETURNING id`;
                        catId = newCat[0].id;
                    } else {
                        catId = catRes[0].id;
                    }

                    const chRes = await t`SELECT id FROM channels WHERE name = ${action.channelName}`;
                    if (chRes.length > 0) {
                        const channelId = chRes[0].id;
                        await t`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${channelId}, ${catId}) ON CONFLICT DO NOTHING`;
                    }
                } 
                
                else if (action.type === 'REMOVE_CHANNEL_FROM_CATEGORY' && action.channelName && action.categoryName) {
                    const catRes = await t`SELECT id FROM channel_categories WHERE name = ${action.categoryName}`;
                    const chRes = await t`SELECT id FROM channels WHERE name = ${action.channelName}`;
                    if (catRes.length > 0 && chRes.length > 0) {
                        await t`DELETE FROM _rel_channels_categories WHERE channel_id = ${chRes[0].id} AND category_id = ${catRes[0].id}`;
                    }
                } 
                
                else if (action.type === 'REPLACE_CATEGORY_CHANNELS' && action.categoryName) {
                    let catRes = await t`SELECT id FROM channel_categories WHERE name = ${action.categoryName}`;
                    let catId;
                    if (catRes.length === 0) {
                        const newCat = await t`INSERT INTO channel_categories (name, is_premium, created_at, updated_at) VALUES (${action.categoryName}, false, now(), now()) RETURNING id`;
                        catId = newCat[0].id;
                    } else {
                        catId = catRes[0].id;
                    }

                    // Delete current links for this category
                    await t`DELETE FROM _rel_channels_categories WHERE category_id = ${catId}`;

                    if (action.channels && action.channels.length > 0) {
                        for (const ch of action.channels) {
                            const streams = ch.stream_link.map((s: any) => ({
                                name: s.name,
                                url: s.url,
                                is_premium: s.isPremiumStream || false
                            }));

                            let chRes = await t`SELECT id FROM channels WHERE name = ${ch.name}`;
                            let channelId;
                            if (chRes.length > 0) {
                                channelId = chRes[0].id;
                                await t`UPDATE channels SET stream_link = ${JSON.stringify(streams)}::jsonb, updated_at = now() WHERE id = ${channelId}`;
                            } else {
                                const newCh = await t`INSERT INTO channels (name, stream_link, created_at, updated_at) VALUES (${ch.name}, ${JSON.stringify(streams)}::jsonb, now(), now()) RETURNING id`;
                                channelId = newCh[0].id;
                            }

                            await t`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${channelId}, ${catId}) ON CONFLICT DO NOTHING`;
                        }
                    }
                }
            }
        });

        // Revalidate Paths to update layout across dashboard
        revalidatePath('/channels');
        revalidatePath('/categories');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Error executing transactions:', error);
        return { success: false, error: error.message || 'حدث خطأ أثناء حفظ التغييرات في قاعدة البيانات.' };
    }
}
