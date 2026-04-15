import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * manageStaffAccount
 * Handles 3 actions triggered from the Staff Directory admin UI:
 *   - "provision": create or update an auth account linked to a staff profile
 *   - "deactivate": disable the auth account when staff goes Inactive
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { action, staffId, loginMobile, loginPassword, role } = await req.json();

    if (!staffId) {
      return Response.json({ error: 'staffId is required' }, { status: 400 });
    }

    // Fetch the staff record
    const staffRecord = await base44.asServiceRole.entities.Staff.get(staffId);
    if (!staffRecord) {
      return Response.json({ error: 'Staff record not found' }, { status: 404 });
    }

    // === DEACTIVATE: staff went Inactive ===
    if (action === 'deactivate') {
      const linkedEmail = staffRecord.linked_user_email;
      if (linkedEmail) {
        const allUsers = await base44.asServiceRole.entities.User.list('email', 1000);
        const matched = allUsers.find(u => u.email === linkedEmail);
        if (matched) {
          await base44.asServiceRole.entities.User.update(matched.id, {
            account_status: 'Inactive',
          });
        }
      }
      return Response.json({ success: true, action: 'deactivated' });
    }

    // === PROVISION: create or update auth account ===
    if (action === 'provision') {
      if (!loginMobile || !loginPassword) {
        return Response.json({ error: 'loginMobile and loginPassword are required' }, { status: 400 });
      }

      // Build the login email from mobile (used as identifier in base44 auth)
      // Convention: <mobile>@mobile.local  — a unique placeholder email per mobile number
      const mobileEmail = `${loginMobile.replace(/\s+/g, '')}@mobile.local`;

      const allUsers = await base44.asServiceRole.entities.User.list('email', 1000);
      const existingUser = allUsers.find(u => u.email === mobileEmail);

      if (!existingUser) {
        // Invite / create the auth user with the mobile-as-email identifier
        await base44.users.inviteUser(mobileEmail, role || 'user');
        // Wait briefly for the record to be created
        await new Promise(r => setTimeout(r, 1500));
      }

      // Fetch again after potential creation
      const allUsersAfter = await base44.asServiceRole.entities.User.list('email', 1000);
      const userRecord = allUsersAfter.find(u => u.email === mobileEmail);

      if (userRecord) {
        await base44.asServiceRole.entities.User.update(userRecord.id, {
          account_status: 'Active',
          linked_staff_id: staffId,
          password_hint: loginPassword,
        });
      }

      // Link back on the Staff record
      await base44.asServiceRole.entities.Staff.update(staffId, {
        linked_user_email: mobileEmail,
        login_mobile: loginMobile,
        login_password: loginPassword,
      });

      return Response.json({ success: true, mobileEmail, action: existingUser ? 'updated' : 'created' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageStaffAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});