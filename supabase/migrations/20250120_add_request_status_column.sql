ALTER TABLE profile_update_request ADD COLUMN IF NOT EXISTS request_status TEXT;
ALTER TABLE profile_update_request ADD COLUMN IF NOT EXISTS requested_by_email TEXT;
ALTER TABLE profile_update_request ADD COLUMN IF NOT EXISTS requested_by_name TEXT;
