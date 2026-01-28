
export interface StreamItem {
    name: string;
    url: string;
    is_premium: boolean;
}

// Recursive helper to find links in ANY structure (Rich Text, nested arrays, etc)
export const extractStreamsFromData = (data: any): StreamItem[] => {
    const found: StreamItem[] = [];

    const findLinks = (node: any) => {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(findLinks);
            return;
        }

        if (typeof node === 'object') {
            // Check if this node is a link (Strapi Rich Text style)
            if (node.type === 'link' && node.url) {
                let name = 'Stream';
                // Try to extract text from children
                if (node.children && Array.isArray(node.children)) {
                    const textNode = node.children.find((c: any) => c.text && c.text.trim() !== '');
                    if (textNode) {
                        name = textNode.text;
                    } else if (node.children[0] && node.children[0].text) {
                        name = node.children[0].text;
                    }
                }
                found.push({ name: name, url: node.url, is_premium: false });
            }
            // Check if it's already a clean StreamItem (from our own saves)
            else if (node.url && !node.type) {
                // Careful not to double count if we traversing mixed tree, but usually flat array.
                // We'll trust that 'url' without 'type' is our format.
                found.push({
                    name: node.name || 'Stream',
                    url: node.url,
                    is_premium: node.is_premium || false
                });
            }

            // Recurse into children
            if (node.children && Array.isArray(node.children)) {
                findLinks(node.children);
            }
        }
    };

    findLinks(data);
    return found;
};

export type StreamAccessLevel = 'public' | 'user' | 'premium';

// Central processing for all streams based on access level
export const processStreams = (data: any, accessLevel: StreamAccessLevel): { name: string; url?: string | null; is_premium: boolean }[] => {
    // 1. Extract raw streams from whatever messy format (Strapi/JSON)
    const rawStreams = extractStreamsFromData(data);

    // 2. Filter and Format based on Access Level
    return rawStreams.map(stream => {
        // PUBLIC: Hide ALL URLs
        if (accessLevel === 'public') {
            return {
                name: stream.name,
                is_premium: stream.is_premium,
                // url omitted
            };
        }

        // USER (Logged in but Free): Hide Premium URLs, Show Free URLs
        if (accessLevel === 'user') {
            if (stream.is_premium) {
                return {
                    name: stream.name,
                    is_premium: true,
                    // url omitted
                };
            } else {
                return {
                    name: stream.name,
                    is_premium: false,
                    url: stream.url
                };
            }
        }

        // PREMIUM: Show Everything
        if (accessLevel === 'premium') {
            return {
                name: stream.name,
                is_premium: stream.is_premium,
                url: stream.url
            };
        }

        return stream; // Should not happen
    });
};
