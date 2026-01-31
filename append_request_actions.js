const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, 'src/app/actions.ts');

const requestActions = `
// --- PAYMENT REQUESTS ---
export async function getPaymentRequests() {
    try {
        // Join with packages to get plan name
        return await sql\`
            SELECT pr.*, p.name as plan_name, p.duration_days
            FROM payment_requests pr
            LEFT JOIN packages p ON pr.package_id = p.id
            ORDER BY pr.created_at DESC
        \`;
    } catch (e: any) { return []; }
}

export async function approvePaymentRequest(id: string, userId: string, durationDays: number, planId: number) {
    try {
        // 1. Activate User Subscription
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        await sql\`
            INSERT INTO users (id, email, subscription_end, plan_id, status, updated_at)
            VALUES (\${userId}, 'user@app.com', \${endDate.toISOString()}, \${planId}, 'active', now())
            ON CONFLICT (id) 
            DO UPDATE SET 
                subscription_end = \${endDate.toISOString()},
                plan_id = \${planId},
                status = 'active',
                updated_at = now()
        \`;

        // Sync to Firestore
        await firestore.collection('users').doc(userId).set({
            isSubscribed: true,
            subscriptionEnd: endDate.toISOString(),
            status: 'active'
        }, { merge: true });

        // 2. Update Request Status
        await sql\`UPDATE payment_requests SET status = 'approved', updated_at = now() WHERE id = \${id}\`;
        
        revalidatePath('/requests');
        revalidatePath('/users');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function rejectPaymentRequest(id: string) {
    try {
        await sql\`UPDATE payment_requests SET status = 'rejected', updated_at = now() WHERE id = \${id}\`;
        revalidatePath('/requests');
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function submitPaymentRequest(userId: string, packageId: number, receiptImage: any) {
    try {
        await sql\`
            INSERT INTO payment_requests (user_id, package_id, receipt_image, status)
            VALUES (\${userId}, \${packageId}, \${receiptImage}, 'pending')
        \`;
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}
`;

fs.appendFileSync(actionsPath, requestActions);
console.log('Appended payment request actions.');
