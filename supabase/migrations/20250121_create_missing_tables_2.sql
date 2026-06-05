CREATE TABLE IF NOT EXISTS course_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_arrangement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  course_id UUID,
  student_email TEXT,
  student_name TEXT,
  exam_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT DEFAULT '未開始',
  score NUMERIC,
  pass_score NUMERIC,
  notes TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  category TEXT,
  author_email TEXT,
  author_name TEXT,
  status TEXT DEFAULT 'draft',
  review_status TEXT,
  reviewer_email TEXT,
  reviewed_at TIMESTAMPTZ,
  tags TEXT[],
  region TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
