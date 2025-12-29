# מדריך מפתח - יקומות

מדריך טכני למפתחים שרוצים להבין את המבנה הפנימי של הפרויקט.

## תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [מבנה מסד הנתונים](#מבנה-מסד-הנתונים)
3. [SQL Scripts](#sql-scripts)
4. [RLS Policies](#rls-policies)
5. [Functions](#functions)
6. [מבנה הקוד](#מבנה-הקוד)
7. [פתרון בעיות טכניות](#פתרון-בעיות-טכניות)

---

## סקירה כללית

**יקומות** הוא אתר ויקי לפרקי הסדרה "יקומות", הכולל:

- **מערכת פרקים** - נגן וידאו עם רפרנסים בנקודות זמן
- **מערכת ויקי** - דמויות, תכניות, פרסומות, מושגים
- **מערכת מוניטין** - נקודות, אימותים, leaderboard
- **מערכת אימות** - Magic Link עם Supabase Auth

### טכנולוגיות

- **Frontend:** Next.js 16, React 19, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS 4
- **Deployment:** Vercel

---

## מבנה מסד הנתונים

### טבלאות עיקריות

#### `chapters`
טבלת הפרקים.

```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT, nullable)
- video_url (TEXT)
- order_index (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `references`
רפרנסים (הערות) על נקודות זמן בפרקים.

```sql
- id (UUID, PK)
- timestamp (INT8) - זמן בשניות
- title (TEXT)
- description (TEXT, nullable)
- image_url (TEXT, nullable)
- user_id (UUID, FK → auth.users)
- chapter_id (UUID, FK → chapters)
- verified (BOOLEAN, default false)
- verification_count (INTEGER, default 0)
- created_at (TIMESTAMPTZ)
```

#### `characters`, `programs`, `advertisements`, `concepts`
טבלאות הויקי (מבנה זהה):

```sql
- id (UUID, PK)
- title (TEXT, UNIQUE)
- description (TEXT, nullable)
- content (TEXT) - תוכן עשיר (Markdown)
- image_url (TEXT, nullable)
- links (JSONB, default '[]')
- created_by (UUID, FK → auth.users)
- updated_by (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- version (INTEGER, default 1)
- view_count (INTEGER, default 0)
- verified (BOOLEAN, default false)
```

#### `profiles`
פרופילי משתמשים.

```sql
- id (UUID, PK, FK → auth.users)
- username (TEXT, nullable)
- points (INTEGER, default 0)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `verifications`
אימותים של רפרנסים.

```sql
- id (UUID, PK)
- reference_id (UUID, FK → references)
- user_id (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
- UNIQUE(reference_id, user_id)
```

#### `reference_links`
קישורים בין רפרנסים.

```sql
- id (UUID, PK)
- source_reference_id (UUID, FK → references)
- target_reference_id (UUID, FK → references)
- created_at (TIMESTAMPTZ)
- UNIQUE(source_reference_id, target_reference_id)
- CHECK (source_reference_id != target_reference_id)
```

#### `reference_connections`
קישורים בין רפרנסים לערכי ויקי.

```sql
- id (UUID, PK)
- reference_id (UUID, FK → references)
- entity_type (TEXT) - 'character' | 'program' | 'advertisement' | 'concept'
- entity_id (UUID)
- created_by (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
- UNIQUE(reference_id, entity_type, entity_id)
```

#### `edit_history`
היסטוריית עריכות.

```sql
- id (UUID, PK)
- entity_type (TEXT)
- entity_id (UUID)
- content (TEXT)
- edited_by (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
```

#### `edit_approvals`
אישורי עריכות (למניעת ספאם).

```sql
- id (UUID, PK)
- entity_type (TEXT)
- entity_id (UUID)
- edit_id (UUID, FK → edit_history)
- approved_by (UUID, FK → auth.users)
- approved_at (TIMESTAMPTZ)
- UNIQUE(edit_id, approved_by)
```

---

## SQL Scripts

### סדר הרצה

**חשוב: הרץ את הסקריפטים בסדר הזה!**

1. `setup-reputation-system.sql` - מערכת המוניטין
2. `setup-chapters-system.sql` - מערכת הפרקים
3. `setup-wiki-system.sql` - מערכת הויקי
4. `insert-initial-data.sql` - נתונים ראשוניים

### מה כל סקריפט עושה

#### `setup-reputation-system.sql`
- יוצר טבלת `profiles`
- יוצר טבלת `verifications`
- מוסיף עמודות ל-`references`: `user_id`, `verified`, `verification_count`
- מגדיר RLS policies
- יוצר פונקציה `increment_points`
- יוצר indexes

#### `setup-chapters-system.sql`
- יוצר טבלת `chapters`
- מוסיף עמודת `chapter_id` ל-`references`
- יוצר טבלת `reference_links`
- מגדיר RLS policies
- יוצר triggers לעדכון `updated_at`
- יוצר indexes

#### `setup-wiki-system.sql`
- יוצר טבלאות: `characters`, `programs`, `advertisements`, `concepts`
- יוצר טבלאות תמיכה: `reference_connections`, `edit_history`, `edit_approvals`
- מגדיר RLS policies לכל הטבלאות
- יוצר triggers לעדכון `updated_at` ו-`version`
- יוצר פונקציות: `increment_view_count`, `award_wiki_points`
- יוצר indexes

#### `insert-initial-data.sql`
- מכניס 6 פרקים
- מכניס דמויות ראשוניות
- מכניס ערכים נוספים (תכניות, פרסומות, מושגים)

---

## RLS Policies

### עקרונות

1. **SELECT:** כולם יכולים לקרוא (public)
2. **INSERT:** רק משתמשים מחוברים (authenticated)
3. **UPDATE:** רק משתמשים מחוברים (authenticated)
4. **DELETE:** רק משתמשים מחוברים (authenticated)

### Policies ספציפיות

#### `references`
- **SELECT:** `USING (true)` - כולם
- **INSERT:** `TO authenticated WITH CHECK (true)` - כל משתמש מחובר
- **UPDATE:** `TO authenticated USING (true) WITH CHECK (true)` - כל משתמש מחובר
- **DELETE:** `TO authenticated USING (true)` - כל משתמש מחובר

**הערה:** בקוד, יש בדיקה נוספת שרק היוצר יכול למחוק/לערוך.

#### `profiles`
- **SELECT:** `USING (true)` - כולם
- **INSERT:** `TO authenticated WITH CHECK (auth.uid() = id)` - רק הפרופיל שלך
- **UPDATE:** `TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` - רק הפרופיל שלך

#### `characters`, `programs`, `advertisements`, `concepts`
- **SELECT:** `USING (true)` - כולם
- **INSERT:** `TO authenticated WITH CHECK (true)` - כל משתמש מחובר
- **UPDATE:** `TO authenticated USING (true) WITH CHECK (true)` - כל משתמש מחובר

**הערה:** בקוד, יש בדיקה נוספת שרק היוצר יכול למחוק.

---

## Functions

### `increment_points(user_id_param UUID, points_to_add INTEGER)`
מעדכן את הנקודות של משתמש.

```sql
UPDATE profiles
SET points = COALESCE(points, 0) + points_to_add,
    updated_at = now()
WHERE id = user_id_param;
```

**שימוש:**
```sql
SELECT increment_points('user-uuid', 10);
```

### `award_wiki_points(user_id_param UUID, points_to_add INTEGER, reason TEXT)`
מעניק נקודות למשתמש (למערכת הויקי).

```sql
UPDATE profiles
SET points = COALESCE(points, 0) + points_to_add,
    updated_at = now()
WHERE id = user_id_param;
```

**שימוש:**
```sql
SELECT award_wiki_points('user-uuid', 10, 'יצירת דמות');
```

### `increment_view_count(entity_type_param TEXT, entity_id_param UUID)`
מגדיל את מספר הצפיות של ערך.

```sql
CASE entity_type_param
    WHEN 'character' THEN
        UPDATE characters SET view_count = view_count + 1 WHERE id = entity_id_param;
    WHEN 'program' THEN
        UPDATE programs SET view_count = view_count + 1 WHERE id = entity_id_param;
    -- וכו'...
END CASE;
```

**שימוש:**
```sql
SELECT increment_view_count('character', 'character-uuid');
```

### Triggers

#### `update_chapters_updated_at`
מעדכן את `updated_at` בטבלת `chapters` לפני UPDATE.

#### `update_wiki_updated_at`
מעדכן את `updated_at` ו-`version` בטבלאות הויקי לפני UPDATE.

#### `update_updated_at_column`
מעדכן את `updated_at` בטבלת `profiles` לפני UPDATE.

---

## מבנה הקוד

### תיקיות עיקריות

```
yekumot-app/
├── app/                    # Next.js App Router
│   ├── page.tsx           # דף הבית
│   ├── chapter/           # דפי פרקים
│   ├── characters/        # דפי דמויות
│   ├── programs/          # דפי תכניות
│   ├── advertisements/    # דפי פרסומות
│   ├── concepts/          # דפי מושגים
│   ├── login/             # דף התחברות
│   └── components/        # קומפוננטות
├── lib/
│   └── supabase.ts        # הגדרת Supabase client
├── scripts/               # SQL scripts
└── public/                # קבצים סטטיים
```

### קבצים חשובים

#### `lib/supabase.ts`
מגדיר את ה-Supabase client.

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### `app/page.tsx`
דף הבית - מציג פרקים, דמויות, וגריד של ערכים.

#### `app/chapter/[chapterId]/page.tsx`
דף פרק - נגן וידאו, רפרנסים, הוספת רפרנסים.

#### `app/characters/[id]/page.tsx`
דף דמות - תוכן, עריכה, קישור לרפרנסים.

---

## פתרון בעיות טכניות

### שגיאת "relation does not exist"
**סיבה:** טבלה לא קיימת או לא הרצת את הסקריפטים SQL.

**פתרון:**
1. בדוק ב-Supabase Dashboard → Table Editor שהטבלה קיימת
2. אם לא קיימת, הרץ את הסקריפט המתאים

### RLS חוסם פעולות
**סיבה:** RLS policy לא מאפשר את הפעולה.

**פתרון:**
1. בדוק את ה-policies ב-SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'table_name';
   ```
2. אם חסר policy, הוסף אותו:
   ```sql
   CREATE POLICY "policy_name" ON table_name
       FOR operation
       TO role
       USING (condition);
   ```

### נקודות לא מתעדכנות
**סיבה:** הפונקציה `increment_points` לא קיימת או לא עובדת.

**פתרון:**
1. בדוק שהפונקציה קיימת:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name = 'increment_points';
   ```
2. אם לא קיימת, הרץ את `setup-reputation-system.sql`

### Verification לא עובד
**סיבה:** טבלת `verifications` לא קיימת או UNIQUE constraint לא עובד.

**פתרון:**
1. בדוק שהטבלה קיימת
2. בדוק שה-UNIQUE constraint קיים:
   ```sql
   SELECT constraint_name FROM information_schema.table_constraints
   WHERE table_name = 'verifications' AND constraint_type = 'UNIQUE';
   ```

### שגיאת Build ב-Vercel
**סיבה:** משתני סביבה לא מוגדרים או שגיאת TypeScript.

**פתרון:**
1. ודא שמשתני הסביבה מוגדרים ב-Vercel
2. בדוק את ה-logs ב-Vercel
3. הרץ `npm run build` מקומית כדי לראות את השגיאות

### Magic Link לא עובד
**סיבה:** Redirect URLs לא מוגדרים נכון.

**פתרון:**
1. בדוק ב-Supabase → Authentication → URL Configuration
2. ודא שה-URLs מוגדרים נכון (כולל/ללא סלאש)
3. ודא שה-Site URL נכון

---

## Indexes

### Indexes קיימים

```sql
-- Chapters
idx_chapters_order ON chapters(order_index)

-- References
idx_references_chapter_id ON references(chapter_id)
idx_references_user_id ON references(user_id)
idx_references_timestamp ON references(timestamp)

-- Reference Links
idx_reference_links_source ON reference_links(source_reference_id)
idx_reference_links_target ON reference_links(target_reference_id)

-- Wiki
idx_characters_title ON characters(title)
idx_programs_title ON programs(title)
idx_advertisements_title ON advertisements(title)
idx_concepts_title ON concepts(title)

-- Reference Connections
idx_reference_connections_ref ON reference_connections(reference_id)
idx_reference_connections_entity ON reference_connections(entity_type, entity_id)

-- Edit History
idx_edit_history_entity ON edit_history(entity_type, entity_id)
idx_edit_history_created ON edit_history(created_at DESC)

-- Verifications
idx_verifications_reference_id ON verifications(reference_id)
idx_verifications_user_id ON verifications(user_id)

-- Profiles
idx_profiles_points ON profiles(points DESC)
```

---

## לוגיקת נקודות

### מתי נקודות מוענקות

1. **יצירת רפרנס:** לא מוענקות נקודות (רק verification)
2. **אימות רפרנס:** +1 נקודה למאמת
3. **רפרנס מאומת (2+ verifications):** +5 נקודות ליוצר
4. **יצירת ערך ויקי:** +10 נקודות
5. **עריכת ערך ויקי:** +2 נקודות

### איך זה עובד

```typescript
// בקוד (דוגמה)
await supabase.rpc('award_wiki_points', {
  user_id_param: user.id,
  points_to_add: 10,
  reason: 'יצירת דמות'
});
```

---

## הערות חשובות

1. **פרופילים נוצרים אוטומטית** - כאשר משתמש מחובר בפעם הראשונה
2. **Username** - אופציונלי, אם לא מוגדר יוצג "Unknown"
3. **3-Second Rule** - מונע יצירת רפרנסים בטווח של +/- 3 שניות (Anti-Spam)
4. **RLS Policies** - כל הטבלאות מוגנות ב-RLS
5. **Cascade Deletes** - מחיקת פרק מוחקת את כל הרפרנסים שלו

---

## בדיקת המבנה

לבדיקת המבנה המלא, הרץ:

```sql
-- רשימת כל הטבלאות
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- רשימת כל ה-Functions
SELECT routine_name, routine_type FROM information_schema.routines
WHERE routine_schema = 'public' ORDER BY routine_name;

-- רשימת כל ה-Policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;
```


