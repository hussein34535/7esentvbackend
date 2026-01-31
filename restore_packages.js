const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, 'src/app/actions.ts');
let content = fs.readFileSync(actionsPath, 'utf8');

const packageActions = `
// --- PACKAGES ---
export async function getPackages() {
    try { return await sql\`SELECT * FROM packages ORDER BY price ASC\`; } catch (e) { return []; }
}
export async function createPackage(data: any) {
    try {
        await sql\`INSERT INTO packages (name, description, price, sale_price, duration_days, features, is_active) VALUES (\${data.name}, \${data.description}, \${data.price}, \${data.sale_price || null}, \${data.duration_days}, \${data.features || '[]'}::jsonb, \${data.is_active ?? true})\`;
        revalidatePath('/packages'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updatePackage(id: number, data: any) {
    try {
        await sql\`UPDATE packages SET name=\${data.name}, description=\${data.description}, price=\${data.price}, sale_price=\${data.sale_price || null}, duration_days=\${data.duration_days}, features=\${data.features || '[]'}::jsonb, is_active=\${data.is_active}, updated_at=now() WHERE id=\${id}\`;
        revalidatePath('/packages'); return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deletePackage(id: number) {
    try { await sql\`DELETE FROM packages WHERE id=\${id}\`; revalidatePath('/packages'); return { success: true }; } catch (e: any) { return { success: false, error: e.message }; }
}

export async function createPromoCode(data: any) {
`;

// Replace the line "export async function createPromoCode(data: any) {" with the block
// But to be safer, I'll search for the unique string around that area
// The view showed:
// 426: }
// 427: export async function createPromoCode(data: any) {

if (content.includes('export async function createPromoCode(data: any) {')) {
    content = content.replace('export async function createPromoCode(data: any) {', packageActions);
    fs.writeFileSync(actionsPath, content);
    console.log('Restored package actions.');
} else {
    console.log('Could not find anchor point.');
}
