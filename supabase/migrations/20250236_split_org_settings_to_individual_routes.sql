-- Split /admin/org-settings into individual settings routes
-- Clean up old page_path references

-- Remove old org-settings records from page_permissions
DELETE FROM page_permissions WHERE page_path = '/admin/org-settings';

-- Remove old org-settings records from user_page_overrides
DELETE FROM user_page_overrides WHERE page_path = '/admin/org-settings';
