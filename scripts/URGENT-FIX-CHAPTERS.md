# תיקון דחוף - פרקים לא נטענים

## הבעיה:
ה-query ל-chapters תקוע ולא חוזר. זה כנראה בגלל RLS policy.

## פתרון מהיר:

### שלב 1: הרץ את זה ב-Supabase SQL Editor:

```sql
-- בדוק אם יש policy
SELECT * FROM pg_policies WHERE tablename = 'chapters';

-- מחק את ה-policy הישן
DROP POLICY IF EXISTS "Allow public read access" ON chapters;

-- צור policy חדש שמאפשר גישה לכולם (כולל anonymous)
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);

-- בדוק שהטבלה נגישה
SELECT COUNT(*) FROM chapters;
```

### שלב 2: אם עדיין לא עובד, נסה:

```sql
-- בדוק את ה-RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chapters';

-- אם rowsecurity = true, נסה להשבית זמנית (רק לבדיקה!)
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- בדוק אם זה עובד עכשיו
SELECT * FROM chapters;

-- אם זה עובד, החזר את ה-RLS והגדר policy נכון
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);
```

### שלב 3: בדוק את ה-Console בדפדפן

אחרי שתריץ את הסקריפט, רענן את הדף ובדוק ב-Console:
- אמור להופיע: "Chapters query completed:"
- אם יש error, שלח לי את ה-error message

## אם עדיין לא עובד:

1. בדוק ב-Supabase Dashboard → Table Editor → chapters
   - האם יש פרקים בטבלה?
   - האם הטבלה קיימת?

2. בדוק ב-Supabase Dashboard → Authentication → Policies
   - האם יש policy ל-chapters?
   - מה ה-role של ה-policy? (צריך להיות public או anon)

3. שלח לי:
   - את ה-output מה-SQL Editor
   - את ה-Console logs מהדפדפן

