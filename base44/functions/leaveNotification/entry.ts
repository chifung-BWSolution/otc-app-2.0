import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, leaveRequest } = body;

    if (!leaveRequest) {
      return Response.json({ error: "leaveRequest is required" }, { status: 400 });
    }

    if (action === "new_application") {
      // Send notification to: applicant, leaders of dept, management, admin
      const allUsers = await base44.asServiceRole.entities.User.list("email", 500);
      const recipients = new Set();

      // Always notify applicant
      if (leaveRequest.user_email) recipients.add(leaveRequest.user_email);

      // Notify leaders of same department, management, and admin
      for (const u of allUsers) {
        const role = u.role?.toLowerCase();
        if (role === "admin" || role === "management") {
          recipients.add(u.email);
        }
        if (role === "leader" && u.department === leaveRequest.dept) {
          recipients.add(u.email);
        }
      }

      const subject = `[假期申請] ${leaveRequest.user_name} 提交了 ${leaveRequest.leave_type} 申請`;
      const htmlBody = `
        <h2>新假期申請通知</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">申請人</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.user_name || leaveRequest.user_email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">部門</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.dept || "未設定"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">假期類型</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.leave_type}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">日期</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.from_date} 至 ${leaveRequest.to_date}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">時段</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.time_slot || "全日"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">天數</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.days}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">原因</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.reason || "—"}</td></tr>
        </table>
        <p style="color:#666;margin-top:16px;">請登入系統進行審批。</p>
      `;

      let sent = 0;
      for (const email of recipients) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject,
            body: htmlBody,
          });
          sent++;
        } catch (e) {
          console.log(`Failed to send to ${email}: ${e.message}`);
        }
      }

      return Response.json({ success: true, sent, recipients: [...recipients] });
    }

    if (action === "status_update") {
      // Notify applicant of approval/rejection
      const statusText = leaveRequest.status === "已批核" ? "已批核 ✅" : "不批核 ❌";
      const subject = `[假期申請結果] 您的 ${leaveRequest.leave_type} 申請${statusText}`;
      const htmlBody = `
        <h2>假期申請結果通知</h2>
        <p>您的假期申請結果如下：</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">假期類型</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.leave_type}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">日期</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.from_date} 至 ${leaveRequest.to_date}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">天數</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.days}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">結果</td><td style="padding:8px;border:1px solid #eee;font-weight:bold;color:${leaveRequest.status === "已批核" ? "#22c55e" : "#ef4444"}">${statusText}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">審批人</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.approver_name || "—"}</td></tr>
          ${leaveRequest.review_note ? `<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">備注</td><td style="padding:8px;border:1px solid #eee;">${leaveRequest.review_note}</td></tr>` : ""}
        </table>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: leaveRequest.user_email,
        subject,
        body: htmlBody,
      });

      return Response.json({ success: true, sent: 1 });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});