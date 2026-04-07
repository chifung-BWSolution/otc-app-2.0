import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled automation (no user auth needed for cron)
  const apps = await base44.asServiceRole.entities.CompanyApp.list();
  const users = await base44.asServiceRole.entities.User.list();

  const adminEmails = users.filter(u => u.role === 'admin').map(u => u.email);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;

  for (const app of apps) {
    if (!app.expiry_date || app.status === '已取消') continue;

    const expiry = new Date(app.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiry - today) / 86400000);

    if (daysLeft !== 14 && daysLeft !== 7) continue;

    // Collect recipients: contact person + all admins
    const recipientEmails = new Set(adminEmails);
    if (app.contact_person) {
      // Find user by name match
      const match = users.find(u => u.full_name === app.contact_person);
      if (match) recipientEmails.add(match.email);
    }

    for (const email of recipientEmails) {
      // Check if notification already sent for this app/day combo
      const existing = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: email,
        ref_id: app.id,
        days_remaining: daysLeft,
      });
      if (existing.length > 0) continue;

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: email,
        title: `⚠️ ${app.name} 訂閱即將到期`,
        message: `${app.name} 的訂閱將於 ${daysLeft} 天後（${app.expiry_date}）到期，請確認是否需要續訂。`,
        type: 'app_expiry',
        ref_id: app.id,
        ref_name: app.name,
        days_remaining: daysLeft,
        is_read: false,
        action_taken: 'pending',
      });
      created++;
    }
  }

  return Response.json({ success: true, notifications_created: created });
});