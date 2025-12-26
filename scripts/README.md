# Supabase Setup Scripts

## check-supabase.js

סקריפט לבדיקת חיבור ל-Supabase ומבנה הטבלה.

**הרצה:**
```bash
npm run check-supabase
```

הסקריפט בודק:
- ✅ חיבור ל-Supabase
- ✅ קיום הטבלה `references`
- ✅ מבנה הטבלה
- ✅ מספר שורות
- ✅ בדיקת INSERT (RLS)

## setup-supabase.sql

סקריפט SQL להגדרת הטבלה ו-RLS Policies.

**הרצה:**
1. פתח את Supabase Dashboard
2. עבור ל-SQL Editor
3. העתק את התוכן מ-`setup-supabase.sql`
4. הרץ את הסקריפט

**מה הסקריפט עושה:**
- ✅ מוסיף עמודת `id` (UUID) אם חסרה
- ✅ מגדיר RLS (Row Level Security)
- ✅ יוצר Policies:
  - SELECT: כולם יכולים לקרוא
  - INSERT: משתמשים מחוברים יכולים להוסיף
  - UPDATE: משתמשים מחוברים יכולים לעדכן
  - DELETE: משתמשים מחוברים יכולים למחוק

## פתרון בעיות

### אם הטבלה לא קיימת:
1. פתח Supabase Dashboard → Table Editor
2. לחץ על "New Table"
3. שם הטבלה: `references`
4. הוסף עמודות:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `timestamp` (int8)
   - `title` (text)
   - `description` (text, nullable)
   - `image_url` (text, nullable)
   - `created_at` (timestamptz, default: `now()`)

### אם RLS חוסם גישה:
הרץ את `setup-supabase.sql` ב-SQL Editor של Supabase.

