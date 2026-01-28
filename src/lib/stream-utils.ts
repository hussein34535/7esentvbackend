
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
