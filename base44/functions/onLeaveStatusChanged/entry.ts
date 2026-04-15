import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, event } = body;

    if (!data || !old_data) {
      console.log("No data/old_data, skipping");
      return Response.json({ skipped: true });
    }

    // Only trigger on status change to approved or rejected
    if (old_data.status === data.status) {
      console.log("Status unchanged, skipping");
      return Response.json({ skipped: true, reason: "status_unchanged" });
    }

    if (data.status !== "已批核" && data.status !== "不批核") {
      console.log(`Status changed to ${data.status}, not a final status, skipping`);
      return Response.json({ skipped: true, reason: "not_final_status" });
    }

    console.log(`Leave status changed: ${old_data.status} -> ${data.status} for ${data.user_name}`);

    // Call the notification function
    const result = await base44.asServiceRole.functions.invoke("leaveNotification", {
      action: "status_update",
      leaveRequest: data,
    });

    console.log(`Status notification sent:`, result.data);
    return Response.json({ success: true, notification: result.data });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});