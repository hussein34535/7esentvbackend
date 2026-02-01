import { Resend } from 'resend';

const getResend = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('RESEND_API_KEY is missing. Emails will not be sent.');
        return null;
    }
    return new Resend(key);
};

export async function sendAdminNotification(data: {
    userName: string;
    packageName: string;
    amount: string;
    paymentIdentifier?: string;
}) {
    try {
        const resend = getResend();
        if (!resend) return;
        await resend.emails.send({
            from: '7eSen TV <payments@7esentv.com>',
            to: ['hussona4635@gmail.com'],
            subject: 'طلب دفع جديد',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <h2 style="color: #10b981;">New Payment Request</h2>
                    <p>A user has submitted a new payment proof.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p><strong>User:</strong> ${data.userName}</p>
                    <p><strong>Package:</strong> ${data.packageName}</p>
                    <p><strong>Amount:</strong> ${data.amount}</p>
                    ${data.paymentIdentifier ? `<p><strong>Sender Info:</strong> ${data.paymentIdentifier}</p>` : ''}
                    <br />
                    <a href="https://7esentvbackend.vercel.app/requests" 
                       style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                        Review in Dashboard
                    </a>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send admin email:', error);
    }
}

export async function sendUserApprovalNotification(userEmail: string, packageName: string) {
    if (!userEmail) return;
    try {
        await getResend()?.emails.send({
            from: '7esen TV <support@7esentv.com>',
            to: [userEmail],
            subject: '✅ Subscription Activated!',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b; direction: rtl; text-align: right;">
                    <h2 style="color: #10b981;">تم تفعيل اشتراكك بنجاح!</h2>
                    <p>أهلاً بك في 7esen TV. تم تفعيل باقة <strong>${packageName}</strong> على حسابك.</p>
                    <p>يمكنك الآن الاستمتاع بكافة المحتويات والمزايا.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 14px; color: #64748b;">إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send user email:', error);
    }
}

export async function sendUserRejectionNotification(userEmail: string, packageName: string) {
    if (!userEmail) return;
    try {
        await getResend()?.emails.send({
            from: '7esen TV <support@7esentv.com>',
            to: [userEmail],
            subject: '⚠️ تواصل بخصوص طلب الاشتراك',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b; direction: rtl; text-align: right;">
                    <h2 style="color: #ef4444;">نعتذر، لم يتم تفعيل الاشتراك</h2>
                    <p>لقد راجعنا طلبك بخصوص باقة <strong>${packageName}</strong> وللأسف لم نتمكن من التأكد من عملية الدفع.</p>
                    <p>يرجى التأكد من رفع صورة الإيصال الصحيحة أو التواصل مع الدعم الفني للمساعدة.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 14px; color: #64748b;">نحن هنا لمساعدتك في أي وقت.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send rejection email:', error);
    }
}
