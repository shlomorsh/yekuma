-- SQL Script to insert initial chapters for Yekumot
-- Run this in Supabase SQL Editor after running setup-chapters-system.sql

-- Insert all chapters
INSERT INTO chapters (title, description, video_url, order_index)
VALUES 
  ('פרק 1', 'פרק ראשון של יקומות', 'https://www.youtube.com/watch?v=yaY-3H2JN_c', 0),
  ('פרק 2', 'פרק שני של יקומות', 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', 1),
  ('פרק 3', 'פרק שלישי של יקומות', 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', 2),
  ('פרק 4', 'פרק רביעי של יקומות', 'https://www.youtube.com/watch?v=N_PsQc4JMpg', 3),
  ('פרק 5', 'פרק חמישי של יקומות', 'https://www.youtube.com/watch?v=oYljFReoQbc', 4),
  ('פרק 6', 'פרק שישי של יקומות', 'https://www.youtube.com/watch?v=UmOapfxyEZ0', 5)
ON CONFLICT DO NOTHING;

