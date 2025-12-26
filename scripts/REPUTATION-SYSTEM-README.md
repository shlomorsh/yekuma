# מערכת מוניטין (Reputation System) - הוראות התקנה

## סקירה כללית

מערכת המוניטין כוללת את הפיצ'רים הבאים:

1. **3-Second Rule (Anti-Spam)**: מונע שמירה של references בטווח של +/- 3 שניות
2. **מערכת Verification**: משתמשים יכולים לאמת references של אחרים
3. **מערכת נקודות**: נקודות מוענקות למשתמשים על פעולות שונות
4. **Leaderboard**: דירוג Top 5 Contributors
5. **UI משופר**: הצגת נקודות ומשתמשים ב-UI

## שלבי התקנה

### שלב 1: הרצת SQL Script

1. פתח את Supabase Dashboard
2. עבור ל-SQL Editor
3. העתק את התוכן מ-`setup-reputation-system.sql`
4. הרץ את הסקריפט

הסקריפט יוצר:
- עמודות חדשות בטבלת `references`: `user_id`, `verified`, `verification_count`
- טבלת `profiles` (אם לא קיימת)
- טבלת `verifications` (אם לא קיימת)
- RLS Policies עבור כל הטבלאות
- פונקציה `increment_points` לעדכון נקודות
- Indexes לביצועים טובים יותר

### שלב 2: בדיקת הטבלאות

לאחר הרצת הסקריפט, ודא שהטבלאות נוצרו:

1. עבור ל-Table Editor ב-Supabase
2. ודא שקיימות הטבלאות:
   - `references` (עם העמודות החדשות)
   - `profiles`
   - `verifications`

### שלב 3: הגדרת RLS Policies

הסקריפט מגדיר אוטומטית את ה-RLS Policies, אבל אם יש בעיות:

**profiles:**
- SELECT: כולם יכולים לקרוא
- INSERT: משתמשים יכולים ליצור פרופיל משלהם
- UPDATE: משתמשים יכולים לעדכן רק את הפרופיל שלהם

**verifications:**
- SELECT: כולם יכולים לקרוא
- INSERT: משתמשים מחוברים יכולים להוסיף verifications

**references:**
- צריך לוודא שיש UPDATE policy (כבר קיים ב-setup-supabase.sql)

## מבנה הטבלאות

### profiles
```sql
- id (UUID, Primary Key, References auth.users)
- username (TEXT, nullable)
- points (INTEGER, default 0)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### verifications
```sql
- id (UUID, Primary Key)
- reference_id (UUID, References references)
- user_id (UUID, References auth.users)
- created_at (TIMESTAMPTZ)
- UNIQUE(reference_id, user_id) -- מונע verification כפול
```

### references (עמודות חדשות)
```sql
- user_id (UUID, References auth.users)
- verified (BOOLEAN, default false)
- verification_count (INTEGER, default 0)
```

## לוגיקת הנקודות

1. **+1 נקודה למאמת**: כאשר משתמש מאמת reference של מישהו אחר
2. **+5 נקודות ליוצר**: כאשר reference מגיע ל-2 verifications והופך ל-verified

## פיצ'רים

### 3-Second Rule
- לפני שמירת reference חדש, המערכת בודקת אם קיים reference בטווח של +/- 3 שניות
- אם קיים, השמירה נחסמת עם הודעת שגיאה

### Verification System
- כפתור "Verify" (👍) מופיע ליד כל reference
- משתמשים לא יכולים לאמת את ה-references שלהם
- כל משתמש יכול לאמת reference רק פעם אחת
- כאשר reference מגיע ל-2 verifications, הוא מסומן כ-verified

### UI Updates
- **Reference Card**: מציג "Added by [Username] (Points: X)"
- **Leaderboard**: קומפוננטה חדשה בסיידבר עם Top 5 Contributors
- **Header**: מציג את הנקודות של המשתמש המחובר ליד השם

## פתרון בעיות

### שגיאת "relation does not exist"
- ודא שהרצת את `setup-reputation-system.sql` ב-SQL Editor

### RLS חוסם פעולות
- ודא שה-RLS Policies נוצרו בהצלחה
- בדוק שה-policies מאפשרים את הפעולות הנדרשות

### נקודות לא מתעדכנות
- ודא שהפונקציה `increment_points` נוצרה
- אם הפונקציה לא קיימת, הקוד ישתמש בעדכון ישיר

### Verification לא עובד
- ודא שהטבלה `verifications` קיימת
- בדוק שה-UNIQUE constraint על (reference_id, user_id) קיים

## הערות חשובות

1. **פרופילים נוצרים אוטומטית**: כאשר משתמש מחובר בפעם הראשונה, פרופיל נוצר אוטומטית עם 0 נקודות
2. **Username**: כרגע ה-username הוא אופציונלי. אם לא מוגדר, יוצג "Unknown"
3. **Performance**: ה-indexes שנוצרו משפרים את הביצועים של שאילתות על timestamp ו-points

## בדיקת המערכת

לאחר ההתקנה, בדוק:

1. ✅ יצירת reference חדש (צריך להיות מחובר)
2. ✅ ניסיון ליצור reference בטווח של 3 שניות (צריך להיחסם)
3. ✅ לחיצה על כפתור Verify (צריך לעבוד רק אם לא מאמתים את עצמך)
4. ✅ בדיקה שהנקודות מתעדכנות
5. ✅ בדיקה שה-Leaderboard מציג את Top 5

