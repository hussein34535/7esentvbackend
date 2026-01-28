import { CloudinaryAsset } from './cloudinary.types';

export interface Database {
    public: {
        Tables: {
            channel_categories: {
                Row: {
                    id: number;
                    name: string;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    name: string;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    name?: string;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            channels: {
                Row: {
                    id: number;
                    name: string;
                    stream_link: BlockContent[] | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    name: string;
                    stream_link?: BlockContent[] | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    name?: string;
                    stream_link?: BlockContent[] | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            matches: {
                Row: {
                    id: number;
                    team_a: string;
                    team_b: string;
                    logo_a: CloudinaryAsset | null;
                    logo_b: CloudinaryAsset | null;
                    match_time: string;
                    commentator: string | null;
                    channel: string | null;
                    champion: string | null;
                    stream_link: BlockContent[] | null;
                    is_premium: boolean;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    team_a: string;
                    team_b: string;
                    logo_a?: CloudinaryAsset | null;
                    logo_b?: CloudinaryAsset | null;
                    match_time: string;
                    commentator?: string | null;
                    channel?: string | null;
                    champion?: string | null;
                    stream_link?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    team_a?: string;
                    team_b?: string;
                    logo_a?: CloudinaryAsset | null;
                    logo_b?: CloudinaryAsset | null;
                    match_time?: string;
                    commentator?: string | null;
                    channel?: string | null;
                    champion?: string | null;
                    stream_link?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            goals: {
                Row: {
                    id: number;
                    title: string | null;
                    image: CloudinaryAsset[] | null;
                    time: string | null;
                    url: BlockContent[] | null;
                    is_premium: boolean;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    title?: string | null;
                    image?: CloudinaryAsset[] | null;
                    time?: string | null;
                    url?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    title?: string | null;
                    image?: CloudinaryAsset[] | null;
                    time?: string | null;
                    url?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            news: {
                Row: {
                    id: number;
                    title: string | null;
                    image: CloudinaryAsset[] | null;
                    date: string | null;
                    link: BlockContent[] | null;
                    is_premium: boolean;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    title?: string | null;
                    image?: CloudinaryAsset[] | null;
                    date?: string | null;
                    link?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    title?: string | null;
                    image?: CloudinaryAsset[] | null;
                    date?: string | null;
                    link?: BlockContent[] | null;
                    is_premium?: boolean;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
}

// Helper Type for Blocks/Rich Text
export interface BlockContent {
    type: string;
    children: {
        type: string;
        text: string;
        [key: string]: any;
    }[];
    [key: string]: any;
}
