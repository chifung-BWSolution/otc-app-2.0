-- Add unique constraint on bubble_id for all bubble sync tables that may be missing it
-- Using IF NOT EXISTS pattern: create unique index which won't fail if already exists

CREATE UNIQUE INDEX IF NOT EXISTS bubble_clockin_bubble_id_key ON bubble_clockin(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_ot_bubble_id_key ON bubble_ot(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_leave_bubble_id_key ON bubble_leave(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_man_hour_date_bubble_id_key ON bubble_man_hour_date(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_man_hour_task_bubble_id_key ON bubble_man_hour_task(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_project_bubble_id_key ON bubble_project(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_staff_kpi_bubble_id_key ON bubble_staff_kpi(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS bubble_staff_kpimonth_bubble_id_key ON bubble_staff_kpimonth(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS staff_bubble_id_key ON staff(bubble_id);
CREATE UNIQUE INDEX IF NOT EXISTS staff_information_bubble_id_key ON staff_information(bubble_id);
