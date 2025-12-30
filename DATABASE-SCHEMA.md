# מבנה מסד הנתונים - Supabase

רשימה מפורטת של כל הטבלאות, השדות, הפונקציות, הטריגרים, והאינדקסים במסד הנתונים.

## 📊 סיכום כללי

- **סה"כ טבלאות:** 11 טבלאות
- **סה"כ פונקציות:** 8 פונקציות
- **סה"כ טריגרים:** 5 טריגרים
- **סה"כ אינדקסים:** 38 אינדקסים
- **סה"כ RLS Policies:** 30 מדיניות

---

## 📋 טבלאות

### 1. `chapters` - פרקים

**תיאור:** טבלה לאחסון פרקי הסדרה עם קישורי וידאו.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הפרק
   - נוצר אוטומטית

2. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של יצירת הפרק
   - מתעדכן אוטומטית

3. **`title`** (text, NOT NULL)
   - כותרת הפרק
   - חובה

4. **`description`** (text, nullable)
   - תיאור הפרק
   - אופציונלי

5. **`video_url`** (text, NOT NULL, UNIQUE)
   - קישור לווידאו של הפרק (YouTube)
   - חובה, ייחודי (לא יכול להיות אותו קישור פעמיים)

6. **`image_url`** (text, nullable)
   - קישור לתמונת כיסוי של הפרק
   - אופציונלי

7. **`order_index`** (integer, nullable, default: 0)
   - סדר הפרק ברשימה
   - משמש למיון הפרקים
   - ברירת מחדל: 0

**אינדקסים:**
- `chapters_pkey` - Primary key על `id`
- `chapters_video_url_key` - Unique index על `video_url`
- `idx_chapters_order` - Index על `order_index` למיון מהיר

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן

**Foreign Keys:**
- אין (טבלה עצמאית)

**Triggers:**
- `update_chapters_updated_at` - לא קיים שדה `updated_at` אבל יש טריגר (ייתכן שזה לא בשימוש) ⚠️

---

### 2. `references` - רפרנסים

**תיאור:** טבלה לאחסון רפרנסים (הפניות) שקשורים לפרקים. כל רפרנס קשור לפרק מסוים ולנקודת זמן בווידאו.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הרפרנס
   - נוצר אוטומטית

2. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של יצירת הרפרנס
   - מתעדכן אוטומטית

3. **`timestamp`** (double precision, NOT NULL)
   - נקודת זמן בווידאו (בשניות) שבה מופיע הרפרנס
   - חובה
   - משמש למיקום הרפרנס על ציר הזמן של הווידאו

4. **`title`** (text, NOT NULL)
   - כותרת הרפרנס
   - חובה

5. **`description`** (text, nullable)
   - תיאור הרפרנס
   - אופציונלי

6. **`image_url`** (text, nullable)
   - קישור לתמונה של הרפרנס
   - אופציונלי

7. **`user_id`** (uuid, nullable, default: auth.uid())
   - מזהה המשתמש שיצר את הרפרנס
   - קישור ל-`auth.users.id`
   - ברירת מחדל: המשתמש המחובר

8. **`status`** (text, nullable, default: 'pending')
   - סטטוס הרפרנס (pending, approved, rejected וכו')
   - ברירת מחדל: 'pending'
   - לא בשימוש כרגע (כל הרפרנסים מאושרים אוטומטית) ⚠️

9. **`created_by_username`** (text, nullable)
   - שם המשתמש שיצר את הרפרנס (לצורך תצוגה מהירה)
   - אופציונלי
   - משמש להצגת שם המשתמש בלי join

10. **`verified`** (boolean, nullable, default: false)
    - האם הרפרנס מאומת (קיבל אימותים ממשתמשים אחרים)
    - ברירת מחדל: false
    - מתעדכן אוטומטית לפי מספר האימותים

11. **`verification_count`** (integer, nullable, default: 0)
    - מספר האימותים שקיבל הרפרנס
    - ברירת מחדל: 0
    - מתעדכן אוטומטית

12. **`chapter_id`** (uuid, nullable)
    - מזהה הפרק שהרפרנס שייך אליו
    - קישור ל-`chapters.id`
    - חובה (אבל nullable - ייתכן שזה bug) ⚠️

**אינדקסים:**
- `references_pkey` - Primary key על `id`
- `idx_references_chapter_id` - Index על `chapter_id` לחיפוש מהיר לפי פרק
- `idx_references_timestamp` - Index על `timestamp` למיון מהיר לפי זמן
- `idx_references_user_id` - Index על `user_id` לחיפוש מהיר לפי משתמש

**RLS Policies:**
- `Allow all to read` / `Allow public read access` - כל אחד יכול לקרוא
- `Allow auth to insert` / `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן
- `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

**Foreign Keys:**
- `references_user_id_fkey` → `auth.users.id`
- `references_chapter_id_fkey` → `chapters.id`

**Triggers:**
- אין

---

### 3. `profiles` - פרופילי משתמשים

**תיאור:** טבלה לאחסון מידע נוסף על משתמשים (מעבר ל-auth.users).

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL)
   - מזהה המשתמש
   - קישור ישיר ל-`auth.users.id`
   - חובה

2. **`username`** (text, nullable)
   - שם המשתמש
   - אופציונלי
   - נוצר אוטומטית מהאימייל בעת הרשמה (עד לפני ה-@)

3. **`points`** (integer, nullable, default: 0)
   - נקודות המשתמש (מערכת ניקוד)
   - ברירת מחדל: 0
   - מתעדכן על ידי פונקציות `increment_points` ו-`award_wiki_points`

4. **`avatar_url`** (text, nullable)
   - קישור לתמונת הפרופיל
   - אופציונלי
   - לא בשימוש כרגע ⚠️

**אינדקסים:**
- `profiles_pkey` - Primary key על `id`
- `idx_profiles_points` - Index על `points DESC` למיון מהיר לפי נקודות (ללוח תורמים)

**RLS Policies:**
- `Allow public read access` / `Public profiles` - כל אחד יכול לקרוא
- `Allow users to insert own profile` - משתמשים יכולים להוסיף רק את הפרופיל שלהם
- `Allow users to update own profile` / `Users can update own profile` - משתמשים יכולים לעדכן רק את הפרופיל שלהם

**Foreign Keys:**
- `profiles_id_fkey` → `auth.users.id`

**Triggers:**
- `update_profiles_updated_at` - לא קיים שדה `updated_at` אבל יש טריגר (ייתכן שזה לא בשימוש) ⚠️

**Triggers ב-auth:**
- `on_auth_user_created` - יוצר פרופיל אוטומטית בעת הרשמה (קורא ל-`handle_new_user()`)

---

### 4. `verifications` - אימותים

**תיאור:** טבלה לאחסון אימותים של רפרנסים. כל משתמש יכול לאמת רפרנס פעם אחת.

**שדות:**
1. **`reference_id`** (uuid, PRIMARY KEY, NOT NULL)
   - מזהה הרפרנס שאומת
   - קישור ל-`references.id`
   - חלק מה-Primary Key

2. **`user_id`** (uuid, PRIMARY KEY, NOT NULL)
   - מזהה המשתמש שאימת
   - קישור ל-`auth.users.id`
   - חלק מה-Primary Key
   - Primary Key מורכב: (`reference_id`, `user_id`) - מונע אימות כפול

3. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של האימות
   - מתעדכן אוטומטית

**אינדקסים:**
- `verifications_pkey` - Primary key מורכב על (`reference_id`, `user_id`)
- `idx_verifications_reference_id` - Index על `reference_id` לחיפוש מהיר לפי רפרנס
- `idx_verifications_user_id` - Index על `user_id` לחיפוש מהיר לפי משתמש

**RLS Policies:**
- `Allow public read access` / `Public verifications` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף (רק את האימות שלהם)
- `Auth verifications` - משתמשים מחוברים יכולים להוסיף

**Foreign Keys:**
- `verifications_reference_id_fkey` → `references.id`
- `verifications_user_id_fkey` → `auth.users.id`

**Triggers:**
- אין

---

### 5. `characters` - דמויות

**תיאור:** טבלה לאחסון דמויות מהיקום. כל דמות יכולה להיות מקושרת לרפרנסים.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הדמות
   - נוצר אוטומטית

2. **`title`** (text, NOT NULL, UNIQUE)
   - שם הדמות
   - חובה, ייחודי (לא יכול להיות אותו שם פעמיים)

3. **`description`** (text, nullable)
   - תיאור קצר של הדמות
   - אופציונלי

4. **`content`** (text, nullable)
   - תוכן מלא של הדמות (Markdown)
   - אופציונלי
   - משמש לעריכת תוכן מפורט

5. **`image_url`** (text, nullable)
   - קישור לתמונת הדמות
   - אופציונלי

6. **`links`** (jsonb, nullable, default: '[]')
   - קישורים לרפרנסים (JSON array)
   - אופציונלי
   - לא בשימוש כרגע (משתמשים ב-`reference_connections` במקום) ⚠️

7. **`created_by`** (uuid, nullable)
   - מזהה המשתמש שיצר את הדמות
   - קישור ל-`auth.users.id`
   - משמש לבדיקת הרשאות מחיקה

8. **`updated_by`** (uuid, nullable)
   - מזהה המשתמש שעדכן את הדמות לאחרונה
   - קישור ל-`auth.users.id`
   - משמש למעקב אחרי עריכות

9. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של יצירת הדמות
   - מתעדכן אוטומטית

10. **`updated_at`** (timestamptz, nullable, default: now())
    - תאריך ושעה של עדכון אחרון
    - מתעדכן אוטומטית על ידי טריגר

11. **`version`** (integer, nullable, default: 1)
    - מספר גרסה של הדמות
    - ברירת מחדל: 1
    - מתעדכן אוטומטית על ידי טריגר (מוגדל ב-1 בכל עדכון)

12. **`view_count`** (integer, nullable, default: 0)
    - מספר הצפיות בדמות
    - ברירת מחדל: 0
    - מתעדכן על ידי פונקציה `increment_view_count`

13. **`verified`** (boolean, nullable, default: false)
    - האם הדמות מאומתת
    - ברירת מחדל: false
    - לא בשימוש כרגע (לא מעודכן) ⚠️

**אינדקסים:**
- `characters_pkey` - Primary key על `id`
- `characters_title_key` - Unique index על `title`
- `idx_characters_title` - Index על `title` לחיפוש מהיר
- `idx_characters_created_by` - Index על `created_by` לחיפוש מהיר לפי יוצר
- `idx_characters_updated_by` - Index על `updated_by` לחיפוש מהיר לפי מעדכן

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן

**Foreign Keys:**
- `characters_created_by_fkey` → `auth.users.id`
- `characters_updated_by_fkey` → `auth.users.id`

**Triggers:**
- `update_characters_updated_at` - מעדכן `updated_at` ו-`version` אוטומטית

---

### 6. `universe_items` - פריטי יקום

**תיאור:** טבלה מאוחדת לאחסון תכניות, פרסומות ומושגים. כל פריט יכול להיות מסוג אחד משלושה.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הפריט
   - נוצר אוטומטית

2. **`title`** (text, NOT NULL, UNIQUE)
   - שם הפריט
   - חובה, ייחודי (לא יכול להיות אותו שם פעמיים)

3. **`description`** (text, nullable)
   - תיאור קצר של הפריט
   - אופציונלי

4. **`content`** (text, nullable)
   - תוכן מלא של הפריט (Markdown)
   - אופציונלי
   - משמש לעריכת תוכן מפורט

5. **`image_url`** (text, nullable)
   - קישור לתמונת הפריט
   - אופציונלי

6. **`item_type`** (text, NOT NULL, CHECK: 'program' | 'advertisement' | 'concept')
   - סוג הפריט
   - חובה
   - יכול להיות רק אחד משלושה: 'program', 'advertisement', 'concept'

7. **`links`** (jsonb, nullable, default: '[]')
   - קישורים לרפרנסים (JSON array)
   - אופציונלי
   - לא בשימוש כרגע (משתמשים ב-`reference_connections` במקום) ⚠️

8. **`created_by`** (uuid, nullable)
   - מזהה המשתמש שיצר את הפריט
   - קישור ל-`auth.users.id`
   - משמש לבדיקת הרשאות מחיקה

9. **`updated_by`** (uuid, nullable)
   - מזהה המשתמש שעדכן את הפריט לאחרונה
   - קישור ל-`auth.users.id`
   - משמש למעקב אחרי עריכות

10. **`created_at`** (timestamptz, nullable, default: now())
    - תאריך ושעה של יצירת הפריט
    - מתעדכן אוטומטית

11. **`updated_at`** (timestamptz, nullable, default: now())
    - תאריך ושעה של עדכון אחרון
    - מתעדכן אוטומטית על ידי טריגר

12. **`version`** (integer, nullable, default: 1)
    - מספר גרסה של הפריט
    - ברירת מחדל: 1
    - מתעדכן אוטומטית על ידי טריגר (מוגדל ב-1 בכל עדכון)

13. **`view_count`** (integer, nullable, default: 0)
    - מספר הצפיות בפריט
    - ברירת מחדל: 0
    - מתעדכן על ידי פונקציה `increment_view_count`

14. **`verified`** (boolean, nullable, default: false)
    - האם הפריט מאומת
    - ברירת מחדל: false
    - לא בשימוש כרגע (לא מעודכן) ⚠️

**אינדקסים:**
- `universe_items_pkey` - Primary key על `id`
- `universe_items_title_key` - Unique index על `title`
- `idx_universe_items_title` - Index על `title` לחיפוש מהיר
- `idx_universe_items_type` - Index על `item_type` לסינון מהיר לפי סוג
- `idx_universe_items_created_by` - Index על `created_by` לחיפוש מהיר לפי יוצר
- `idx_universe_items_updated_by` - Index על `updated_by` לחיפוש מהיר לפי מעדכן
- `idx_universe_items_view_count` - Index על `view_count DESC` למיון מהיר לפי צפיות
- `idx_universe_items_created` - Index על `created_at DESC` למיון מהיר לפי תאריך יצירה

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן
- `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

**Foreign Keys:**
- `universe_items_created_by_fkey` → `auth.users.id`
- `universe_items_updated_by_fkey` → `auth.users.id`

**Triggers:**
- `update_universe_items_updated_at` - מעדכן `updated_at` ו-`version` אוטומטית

**הערות:**
- טבלה זו מחליפה את הטבלאות הנפרדות `programs`, `advertisements`, `concepts` שהיו קיימות בעבר
- כל הפריטים מאוחדים בטבלה אחת עם שדה `item_type` שמבדיל ביניהם

---

### 7. `reference_links` - קישורים בין רפרנסים

**תיאור:** טבלה לאחסון קישורים בין רפרנסים (רפרנס A מקושר לרפרנס B).

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הקישור
   - נוצר אוטומטית

2. **`source_reference_id`** (uuid, NOT NULL)
   - מזהה הרפרנס המקור (הרפרנס שמקשר)
   - קישור ל-`references.id`
   - חובה

3. **`target_reference_id`** (uuid, NOT NULL)
   - מזהה הרפרנס היעד (הרפרנס שמקושר אליו)
   - קישור ל-`references.id`
   - חובה

4. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של יצירת הקישור
   - מתעדכן אוטומטית

**אינדקסים:**
- `reference_links_pkey` - Primary key על `id`
- `reference_links_source_reference_id_target_reference_id_key` - Unique index על (`source_reference_id`, `target_reference_id`) - מונע קישור כפול
- `idx_reference_links_source` - Index על `source_reference_id` לחיפוש מהיר לפי רפרנס מקור
- `idx_reference_links_target` - Index על `target_reference_id` לחיפוש מהיר לפי רפרנס יעד

**Constraints:**
- `reference_links_check` - CHECK constraint: `source_reference_id <> target_reference_id` - מונע קישור של רפרנס לעצמו

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

**Foreign Keys:**
- `reference_links_source_reference_id_fkey` → `references.id`
- `reference_links_target_reference_id_fkey` → `references.id`

**Triggers:**
- אין

**הערות:**
- לא בשימוש כרגע (משתמשים ב-`reference_connections` במקום) ⚠️

---

### 8. `reference_connections` - קישורים בין רפרנסים לפריטים

**תיאור:** טבלה לאחסון קישורים בין רפרנסים לפריטים (דמויות או פריטי יקום).

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של הקישור
   - נוצר אוטומטית

2. **`reference_id`** (uuid, NOT NULL)
   - מזהה הרפרנס
   - קישור ל-`references.id`
   - חובה

3. **`entity_type`** (text, NOT NULL, CHECK: 'character' | 'universe_item')
   - סוג הפריט שמקושר (דמות או פריט יקום)
   - חובה
   - יכול להיות רק אחד משניים: 'character', 'universe_item'

4. **`entity_id`** (uuid, NOT NULL)
   - מזהה הפריט שמקושר (דמות או פריט יקום)
   - חובה
   - תלוי ב-`entity_type` - אם 'character' אז `characters.id`, אם 'universe_item' אז `universe_items.id`

5. **`created_by`** (uuid, nullable)
   - מזהה המשתמש שיצר את הקישור
   - קישור ל-`auth.users.id`
   - אופציונלי

6. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של יצירת הקישור
   - מתעדכן אוטומטית

**אינדקסים:**
- `reference_connections_pkey` - Primary key על `id`
- `reference_connections_reference_id_entity_type_entity_id_key` - Unique index על (`reference_id`, `entity_type`, `entity_id`) - מונע קישור כפול
- `idx_reference_connections_ref` - Index על `reference_id` לחיפוש מהיר לפי רפרנס
- `idx_reference_connections_entity` - Index על (`entity_type`, `entity_id`) לחיפוש מהיר לפי פריט

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

**Foreign Keys:**
- `reference_connections_reference_id_fkey` → `references.id`
- `reference_connections_created_by_fkey` → `auth.users.id`

**Triggers:**
- אין

---

### 9. `edit_history` - היסטוריית עריכות

**תיאור:** טבלה לאחסון היסטוריית עריכות של דמויות ופריטי יקום. כל עריכה נשמרת כאן.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של העריכה
   - נוצר אוטומטית

2. **`entity_type`** (text, NOT NULL, CHECK: 'character' | 'universe_item')
   - סוג הפריט שעודכן (דמות או פריט יקום)
   - חובה
   - יכול להיות רק אחד משניים: 'character', 'universe_item'

3. **`entity_id`** (uuid, NOT NULL)
   - מזהה הפריט שעודכן (דמות או פריט יקום)
   - חובה
   - תלוי ב-`entity_type` - אם 'character' אז `characters.id`, אם 'universe_item' אז `universe_items.id`

4. **`content`** (text, nullable)
   - התוכן החדש אחרי העריכה (Markdown)
   - אופציונלי
   - משמש לשחזור גרסאות קודמות

5. **`edited_by`** (uuid, nullable)
   - מזהה המשתמש שערך
   - קישור ל-`auth.users.id`
   - אופציונלי

6. **`created_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של העריכה
   - מתעדכן אוטומטית

**אינדקסים:**
- `edit_history_pkey` - Primary key על `id`
- `idx_edit_history_entity` - Index על (`entity_type`, `entity_id`) לחיפוש מהיר לפי פריט
- `idx_edit_history_created` - Index על `created_at DESC` למיון מהיר לפי תאריך

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

**Foreign Keys:**
- `edit_history_edited_by_fkey` → `auth.users.id`

**Triggers:**
- אין

**הערות:**
- לא בשימוש כרגע (לא נשמרות עריכות) ⚠️

---

### 10. `edit_approvals` - אישורי עריכות

**תיאור:** טבלה לאחסון אישורים של עריכות. כל עריכה יכולה לקבל אישורים ממשתמשים שונים.

**שדות:**
1. **`id`** (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
   - מזהה ייחודי של האישור
   - נוצר אוטומטית

2. **`entity_type`** (text, NOT NULL, CHECK: 'character' | 'universe_item')
   - סוג הפריט שעודכן (דמות או פריט יקום)
   - חובה
   - יכול להיות רק אחד משניים: 'character', 'universe_item'

3. **`entity_id`** (uuid, NOT NULL)
   - מזהה הפריט שעודכן (דמות או פריט יקום)
   - חובה
   - תלוי ב-`entity_type` - אם 'character' אז `characters.id`, אם 'universe_item' אז `universe_items.id`

4. **`edit_id`** (uuid, nullable)
   - מזהה העריכה שאושרה
   - קישור ל-`edit_history.id`
   - אופציונלי

5. **`approved_by`** (uuid, nullable)
   - מזהה המשתמש שאישר
   - קישור ל-`auth.users.id`
   - אופציונלי

6. **`approved_at`** (timestamptz, nullable, default: now())
   - תאריך ושעה של האישור
   - מתעדכן אוטומטית

**אינדקסים:**
- `edit_approvals_pkey` - Primary key על `id`
- `edit_approvals_edit_id_approved_by_key` - Unique index על (`edit_id`, `approved_by`) - מונע אישור כפול

**RLS Policies:**
- `Allow public read access` - כל אחד יכול לקרוא
- `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

**Foreign Keys:**
- `edit_approvals_edit_id_fkey` → `edit_history.id`
- `edit_approvals_approved_by_fkey` → `auth.users.id`

**Triggers:**
- אין

**הערות:**
- לא בשימוש כרגע (לא קיימת מערכת אישורים) ⚠️

---

## 🔧 פונקציות (Functions)

### 1. `increment_points(user_id_param uuid, points_to_add integer)`
**תיאור:** מוסיף נקודות למשתמש.
- מעדכן את `profiles.points` ב-`points_to_add`
- מעדכן `updated_at` (אבל אין שדה כזה) ⚠️

**שימוש:** נקרא בעת יצירת/עריכת תוכן.

---

### 2. `award_wiki_points(user_id_param uuid, points_to_add integer, reason text)`
**תיאור:** מוסיף נקודות למשתמש עם סיבה.
- מעדכן את `profiles.points` ב-`points_to_add`
- מעדכן `updated_at` (אבל אין שדה כזה) ⚠️
- יש הערה על יצירת טבלת `points_log` בעתיד (לא קיימת) ⚠️

**שימוש:** נקרא בעת יצירת/עריכת תוכן עם סיבה.

---

### 3. `increment_view_count(entity_type_param text, entity_id_param uuid)`
**תיאור:** מגדיל את מספר הצפיות בפריט.
- אם `entity_type_param = 'character'` → מעדכן `characters.view_count`
- אם `entity_type_param = 'universe_item'` → מעדכן `universe_items.view_count`

**שימוש:** נקרא בעת צפייה בדמות או בפריט יקום.

---

### 4. `update_updated_at_column()`
**תיאור:** פונקציה גנרית לעדכון `updated_at`.
- מעדכן `NEW.updated_at = now()`
- משמש בטריגרים

**שימוש:** נקרא על ידי טריגרים.

---

### 5. `update_chapters_updated_at()`
**תיאור:** פונקציה לעדכון `updated_at` בטבלת `chapters`.
- מעדכן `NEW.updated_at = now()`
- לא בשימוש כי אין שדה `updated_at` בטבלת `chapters` ⚠️

**שימוש:** נקרא על ידי טריגר (אבל לא עובד כי אין שדה).

---

### 6. `update_wiki_updated_at()`
**תיאור:** פונקציה לעדכון `updated_at` ו-`version` בטבלאות wiki.
- מעדכן `NEW.updated_at = now()`
- מעדכן `NEW.version = COALESCE(OLD.version, 0) + 1`

**שימוש:** נקרא על ידי טריגר `update_characters_updated_at`.

---

### 7. `update_universe_items_updated_at()`
**תיאור:** פונקציה לעדכון `updated_at` ו-`version` בטבלת `universe_items`.
- מעדכן `NEW.updated_at = now()`
- מעדכן `NEW.version = COALESCE(OLD.version, 0) + 1`

**שימוש:** נקרא על ידי טריגר `update_universe_items_updated_at`.

---

### 8. `handle_new_user()`
**תיאור:** פונקציה שיוצרת פרופיל אוטומטית בעת הרשמה.
- יוצרת רשומה ב-`profiles` עם `id = new.id` (מהמשתמש החדש)
- `username = split_part(new.email, '@', 1)` - לוקח את החלק לפני ה-@ מהאימייל
- `points = 0`

**שימוש:** נקרא על ידי טריגר `on_auth_user_created` ב-`auth.users`.

---

## ⚡ טריגרים (Triggers)

### 1. `update_chapters_updated_at`
- **טבלה:** `chapters`
- **תזמון:** BEFORE UPDATE
- **פונקציה:** `update_chapters_updated_at()`
- **תיאור:** מנסה לעדכן `updated_at` אבל אין שדה כזה ⚠️

---

### 2. `update_characters_updated_at`
- **טבלה:** `characters`
- **תזמון:** BEFORE UPDATE
- **פונקציה:** `update_wiki_updated_at()`
- **תיאור:** מעדכן `updated_at` ו-`version` אוטומטית

---

### 3. `update_profiles_updated_at`
- **טבלה:** `profiles`
- **תזמון:** BEFORE UPDATE
- **פונקציה:** `update_updated_at_column()`
- **תיאור:** מנסה לעדכן `updated_at` אבל אין שדה כזה ⚠️

---

### 4. `update_universe_items_updated_at`
- **טבלה:** `universe_items`
- **תזמון:** BEFORE UPDATE
- **פונקציה:** `update_universe_items_updated_at()`
- **תיאור:** מעדכן `updated_at` ו-`version` אוטומטית

---

### 5. `on_auth_user_created`
- **טבלה:** `auth.users`
- **תזמון:** AFTER INSERT
- **פונקציה:** `handle_new_user()`
- **תיאור:** יוצר פרופיל אוטומטית בעת הרשמה

---

## 🔒 RLS Policies (Row Level Security)

### `chapters`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- ✅ `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן

### `references`
- ✅ `Allow all to read` / `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow auth to insert` / `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- ✅ `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן
- ✅ `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

### `profiles`
- ✅ `Allow public read access` / `Public profiles` - כל אחד יכול לקרוא
- ✅ `Allow users to insert own profile` - משתמשים יכולים להוסיף רק את הפרופיל שלהם
- ✅ `Allow users to update own profile` / `Users can update own profile` - משתמשים יכולים לעדכן רק את הפרופיל שלהם

### `verifications`
- ✅ `Allow public read access` / `Public verifications` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` / `Auth verifications` - משתמשים מחוברים יכולים להוסיף (רק את האימות שלהם)

### `characters`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- ✅ `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן

### `universe_items`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- ✅ `Allow authenticated update` - משתמשים מחוברים יכולים לעדכן
- ✅ `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

### `reference_links`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף
- ✅ `Allow authenticated delete` - משתמשים מחוברים יכולים למחוק

### `reference_connections`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

### `edit_history`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

### `edit_approvals`
- ✅ `Allow public read access` - כל אחד יכול לקרוא
- ✅ `Allow authenticated insert` - משתמשים מחוברים יכולים להוסיף

---

## ⚠️ בעיות וטבלאות/שדות שלא בשימוש

1. **`chapters.updated_at`** - אין שדה אבל יש טריגר שמנסה לעדכן אותו
2. **`profiles.updated_at`** - אין שדה אבל יש טריגר שמנסה לעדכן אותו
3. **`references.status`** - קיים אבל לא בשימוש (כל הרפרנסים מאושרים אוטומטית)
4. **`references.chapter_id`** - nullable אבל צריך להיות NOT NULL (bug)
5. **`characters.links`** - לא בשימוש (משתמשים ב-`reference_connections` במקום)
6. **`universe_items.links`** - לא בשימוש (משתמשים ב-`reference_connections` במקום)
7. **`characters.verified`** - לא מעודכן
8. **`universe_items.verified`** - לא מעודכן
9. **`reference_links`** - טבלה שלמה שלא בשימוש (משתמשים ב-`reference_connections` במקום)
10. **`edit_history`** - טבלה שלא בשימוש (לא נשמרות עריכות)
11. **`edit_approvals`** - טבלה שלא בשימוש (לא קיימת מערכת אישורים)
12. **`profiles.avatar_url`** - לא בשימוש
13. **`award_wiki_points`** - יש הערה על `points_log` שלא קיים

---

## 📊 סיכום

**סה"כ:**
- **11 טבלאות** (מתוכן 3 לא בשימוש: `reference_links`, `edit_history`, `edit_approvals`)
- **8 פונקציות** (כולן בשימוש)
- **5 טריגרים** (מתוכם 2 לא עובדים: `update_chapters_updated_at`, `update_profiles_updated_at`)
- **38 אינדקסים** (כולם בשימוש)
- **30 RLS Policies** (כולן בשימוש)

**בעיות:**
- 13 בעיות/שדות/טבלאות שלא בשימוש או לא עובדים


