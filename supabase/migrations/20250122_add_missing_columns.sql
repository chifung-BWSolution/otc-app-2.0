ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS assessment_type TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS bu_name TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS office TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS student_staff_id TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS primary_exam_date DATE;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS primary_exam_score NUMERIC;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE assessment_result ADD COLUMN IF NOT EXISTS pass_score NUMERIC;

ALTER TABLE course_category ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
