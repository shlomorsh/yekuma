-- SQL Script to insert initial data for Yekumot Universe
-- Run this in Supabase SQL Editor after running setup-chapters-system.sql and setup-wiki-system.sql
-- This script inserts: Chapters, Characters, and all other universe items (Programs, Advertisements, Concepts)

-- ============================================================================
-- PART 1: INSERT CHAPTERS (רשימת פרקים)
-- ============================================================================

-- Insert all chapters (skip if video_url already exists)
-- Note: If you get an error about duplicate video_url, it means chapters already exist - that's OK!
INSERT INTO chapters (title, description, video_url, order_index)
VALUES 
  ('פרק 1', 'פרק ראשון של יקומות', 'https://www.youtube.com/watch?v=yaY-3H2JN_c', 0),
  ('פרק 2', 'פרק שני של יקומות', 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', 1),
  ('פרק 3', 'פרק שלישי של יקומות', 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', 2),
  ('פרק 4', 'פרק רביעי של יקומות', 'https://www.youtube.com/watch?v=N_PsQc4JMpg', 3),
  ('פרק 5', 'פרק חמישי של יקומות', 'https://www.youtube.com/watch?v=oYljFReoQbc', 4),
  ('פרק 6', 'פרק שישי של יקומות', 'https://www.youtube.com/watch?v=UmOapfxyEZ0', 5)
ON CONFLICT ON CONSTRAINT chapters_video_url_key DO NOTHING;

-- ============================================================================
-- PART 2: INSERT CHARACTERS (רשימת דמויות)
-- ============================================================================

-- Insert שמונה שכטר
INSERT INTO characters (title, description, content, verified)
VALUES (
  'שמונה שכטר',
  'מנחה תוכנית האירוח "שבע עם שמונה שכטר"',
  E'# שמונה שכטר

## תפקיד
מנחה תוכנית האירוח "שבע עם שמונה שכטר"

## על הדמות והתוכנית
שכטר הוא מנחה טלוויזיה המגיש תוכנית אירוח לילית כאוטית. הכניסה שלו לאולפן מלווה במוזיקה קצבית ומחיאות כפיים סוערות שמונעות ממנו להתחיל לדבר, עד שהוא נאלץ לבקש מהקהל להפסיק ("די, תודה... אני רואה שהוא חייב להתחיל").

## מאפיינים בולטים

### בלבול וחוסר אוריינטציה
במהלך השידור, שכטר נראה לעיתים קרובות אבוד. הוא שואל את עצמו "מה זה? מה אני עושה?" תוך כדי השידור, ומודה שהוא "לא מבין מה קורה".

### לא יודע לעשות הליכת ירח
שכטר אינו יודע לבצע הליכת ירח - מאפיין ייחודי שלו.

## אורחים בתוכנית
באחת התוכניות אירח את רועי כפרי וביקש ממנו לומר במילה אחת מה הוא עושה כאן.

רועי בחר להציג שחקנים שנמצאים בסדרה ונקב בשמותיהם של נעה קולר ואסי כהן.
',
  false
)
ON CONFLICT (title) DO UPDATE 
SET description = EXCLUDED.description,
    content = EXCLUDED.content;

-- ============================================================================
-- PART 3: INSERT OTHER UNIVERSE ITEMS (תכניות, פרסומות, מושגים)
-- ============================================================================

-- Insert טבעוניצל (Advertisement/מותג מזון)
INSERT INTO advertisements (title, description, content, verified)
VALUES (
  'טבעוניצל',
  'מותג של שניצל טבעוני המופיע ביקום הסדרה',
  E'# טבעוניצל

## סוג
מותג מזון / פרסומת סאטירית

## סלוגן
"נאבקים להבין אתכם"

## תיאור המוצר
"טבעוניצל" הוא מותג של שניצל טבעוני המופיע ביקום הסדרה. ההבטחה השיווקית המרכזית של המוצר היא ש"לא תרגישו בהבדל".

## המבצע המיוחד
המותג מציע מבצע שיווקי אבסורדי ואירוני, העומד בסתירה מוחלטת לרעיון הטבעונות:

**"על כל שניצל טבעוני תקבלו איזה 15 שניצל בשר רגיל באותה אריזה"**

המבצע הזה מהווה פרפרזה סאטירית על קמפיינים שיווקיים ומהווה חלק מהומור ה"אלגנס" האופייני ליקום הסדרה.
',
  false
)
ON CONFLICT (title) DO UPDATE 
SET description = EXCLUDED.description,
    content = EXCLUDED.content;

-- ============================================================================
-- NOTE: Add more items here as needed
-- ============================================================================
-- To add more characters:
-- INSERT INTO characters (title, description, content) VALUES (...);
--
-- To add more advertisements:
-- INSERT INTO advertisements (title, description, content) VALUES (...);
--
-- To add more programs:
-- INSERT INTO programs (title, description, content) VALUES (...);
--
-- To add more concepts:
-- INSERT INTO concepts (title, description, content) VALUES (...);
-- ============================================================================

