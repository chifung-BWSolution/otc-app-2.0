-- Add start/end time range to leave_period so each period (e.g. 全日/上午/下午)
-- can define which hours of the day it covers.
ALTER TABLE leave_period ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE leave_period ADD COLUMN IF NOT EXISTS end_time TIME;
