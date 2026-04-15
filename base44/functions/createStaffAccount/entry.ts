import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { staffId, loginEmail, tempPassword, staffName, role } = await req.json();

    if (!staffId || !loginEmail || !tempPassword) {
      return Response.json({ error: 'staffId, loginEmail, and tempPassword are required' }, { status: 400 });
    }

    // Step 1: Invite the user via Base44 (creates auth account)
    await base44.users.inviteUser(loginEmail, role || 'user');

    // Step 2: Link the staff profile to the new auth user email
    await base44.asServiceRole.entities.Staff.update(staffId, {
      linked_user_email: loginEmail,
    });

    // Step 3: Send welcome email with credentials
    const loginUrl = window?.location?.origin || 'https://app.base44.com';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">歡迎加入系統 🎉</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">您的帳戶已成功建立</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="color: #374151;">親愛的 <strong>${staffName || loginEmail}</strong>，</p>
          <p style="color: #374151;">行政部門已為您建立系統登入帳戶，以下是您的登入資料：</p>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 14px; width: 40%;">登入電郵</td>
                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e40af;">${loginEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #6b7280; font-size: 14px;">臨時密碼</td>
                <td style="padding: 10px; font-weight: bold; font-family: monospace; font-size: 16px; background: #fef3c7; border-radius: 4px; color: #92400e;">${tempPassword}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 16px 0;">
            <p style="color: #dc2626; margin: 0; font-size: 14px;">⚠️ 請於首次登入後立即更改密碼，以確保帳戶安全。</p>
          </div>

          <p style="color: #374151; font-size: 14px;">如有任何疑問，請聯絡行政部門。</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">此電郵由系統自動發送，請勿回覆。</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: loginEmail,
      subject: `【系統帳戶建立通知】歡迎 ${staffName || ''} 加入`,
      body: emailBody,
    });

    return Response.json({ success: true, email: loginEmail });
  } catch (error) {
    console.error('createStaffAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});