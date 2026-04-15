import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    if (!data || !data.user_email) {
      console.log("No data or user_email, skipping");
      return Response.json({ skipped: true });
    }

    console.log(`New leave application from ${data.user_name}: ${data.leave_type}`);

    // Call the notification function
    const result = await base44.asServiceRole.functions.invoke("leaveNotification", {
      action: "new_application",
      leaveRequest: data,
    });

    console.log(`Notification sent:`, result.data);
    return Response.json({ success: true, notification: result.data });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});