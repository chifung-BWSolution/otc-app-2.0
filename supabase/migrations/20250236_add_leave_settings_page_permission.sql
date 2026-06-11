-- Add leave settings page permission for admin role
INSERT INTO page_permissions (page_path, role, allowed)
VALUES ('/settings/leave', 'admin', true)
ON CONFLICT DO NOTHING;
