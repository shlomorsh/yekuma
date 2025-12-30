# מדריך משתמש - יקומות

מדריך זה מיועד למשתמשים שרוצים להריץ ולהשתמש באתר יקומות.

## תוכן עניינים

1. [הפעלת האתר מקומית](#הפעלת-האתר-מקומית)
2. [הגדרת Supabase](#הגדרת-supabase)
3. [הכנסת נתונים ראשוניים](#הכנסת-נתונים-ראשוניים)
4. [הגדרת Magic Link](#הגדרת-magic-link)
5. [פרסום האתר](#פרסום-האתר)
6. [שימוש באתר](#שימוש-באתר)

---

## הפעלת האתר מקומית

### דרישות מוקדמות
- Node.js (גרסה 18 ומעלה)
- npm או yarn

### שלבים

1. **פתח טרמינל בתיקיית הפרויקט:**
   ```bash
   cd yekumot-app
   ```

2. **התקן תלויות:**
   ```bash
   npm install
   ```

3. **צור קובץ `.env.local` בתיקיית הפרויקט:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **הרץ את השרת:**
   ```bash
   npm run dev
   ```

5. **פתח בדפדפן:**
   ```
   http://localhost:3000
   ```

---

## הגדרת Supabase

### שלב 1: יצירת פרויקט Supabase

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. לחץ על "New Project"
3. מלא את הפרטים:
   - שם הפרויקט
   - סיסמת מסד הנתונים
   - אזור (Region)
4. לחץ על "Create new project"

### שלב 2: קבלת מפתחות API

1. בפרויקט שלך, לך ל-**Settings** → **API**
2. העתק את:
   - **Project URL** → זה ה-`NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → זה ה-`NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. הוסף אותם לקובץ `.env.local`

### שלב 3: הרצת סקריפטי SQL

**חשוב: הרץ את הסקריפטים בסדר הזה!**

1. פתח את **SQL Editor** ב-Supabase Dashboard
2. הרץ את הסקריפטים הבאים בסדר:

#### א. מערכת המוניטין
```sql
-- העתק את התוכן מ: scripts/setup-reputation-system.sql
-- והרץ ב-SQL Editor
```

#### ב. מערכת הפרקים
```sql
-- העתק את התוכן מ: scripts/setup-chapters-system.sql
-- והרץ ב-SQL Editor
```

#### ג. מערכת הויקי
```sql
-- העתק את התוכן מ: scripts/setup-wiki-system.sql
-- והרץ ב-SQL Editor
```

#### ד. נתונים ראשוניים
```sql
-- העתק את התוכן מ: scripts/insert-initial-data.sql
-- והרץ ב-SQL Editor
```

### שלב 4: בדיקה

לאחר הרצת הסקריפטים, בדוק ב-**Table Editor**:
- ✅ `chapters` - צריך לראות 6 פרקים
- ✅ `characters` - צריך לראות דמויות
- ✅ `profiles` - טבלה קיימת
- ✅ `references` - טבלה קיימת

---

## הכנסת נתונים ראשוניים

### מה הקובץ `insert-initial-data.sql` עושה:

1. **רשימת פרקים** - 6 פרקים עם קישורים ליוטיוב
2. **רשימת דמויות** - דמויות מהיקום
3. **ערכים נוספים** - תכניות, פרסומות, מושגים

### איך להריץ:

1. פתח את **SQL Editor** ב-Supabase
2. העתק את התוכן מ-`scripts/insert-initial-data.sql`
3. לחץ על **Run** (או Ctrl+Enter)

### הוספת עוד ערכים:

אם רוצה להוסיף עוד דמויות, פרסומות, תכניות או מושגים:

```sql
-- הוספת דמות חדשה
INSERT INTO characters (title, description, content, image_url)
VALUES (
  'שם הדמות',
  'תיאור קצר',
  E'# שם הדמות\n\n## פרטים נוספים\nתוכן עשיר כאן...',
  'https://example.com/image.jpg'
)
ON CONFLICT (title) DO UPDATE 
SET description = EXCLUDED.description,
    content = EXCLUDED.content,
    image_url = EXCLUDED.image_url;
```

**הערות חשובות:**
- `ON CONFLICT` - אם הערך כבר קיים, הקוד יעדכן אותו במקום ליצור כפילות
- `E'...'` - מאפשר שימוש ב-newlines בתוכן (Markdown)
- `image_url` - **חובה** לדמויות חדשות!

---

## הגדרת Magic Link

### הבעיה:
הקישור מהמייל לא עובד כי Supabase צריך לדעת לאילו URLs מותר להפנות.

### פתרון:

1. **לך ל-Supabase Dashboard:**
   - בחר את הפרויקט שלך
   - עבור ל-**Authentication** → **URL Configuration**

2. **הוסף את ה-URLs הבאים ל-Redirect URLs:**
   
   **ל-Production (Vercel):**
   ```
   https://yekuma.vercel.app/
   https://yekuma.vercel.app
   ```
   
   **לפיתוח מקומי:**
   ```
   http://localhost:3000/
   http://localhost:3000
   ```

3. **הגדר Site URL:**
   - ב-**Site URL**, הגדר:
   ```
   https://yekuma.vercel.app
   ```
   (או `http://localhost:3000` לפיתוח)

4. **שמור**

### בדיקה:

1. שלח magic link למייל שלך
2. לחץ על הקישור במייל
3. אמור להיות מועבר לאתר
4. בדוק את ה-console - אמור להופיע "Session set successfully"

### פתרון בעיות:

- **אם הקישור לא עובד:**
  - ודא שה-URL ב-Redirect URLs **זהה בדיוק** ל-URL בקישור מהמייל
  - כולל/ללא סלאש בסוף זה חשוב - הוסף את שני הגרסאות
  - נסה לפתוח את הקישור בחלון פרטי (incognito)

---

## פרסום האתר

### Vercel (מומלץ ביותר) ⭐

**יתרונות:**
- חינם לחלוטין
- תמיכה מעולה ב-Next.js
- Deploy אוטומטי מ-GitHub
- SSL אוטומטי

**שלבים:**

1. **העלה את הקוד ל-GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/yekumot.git
   git push -u origin main
   ```

2. **הירשם ל-Vercel:**
   - לך ל: https://vercel.com
   - היכנס עם GitHub

3. **צור פרויקט חדש:**
   - לחץ על "Add New Project"
   - בחר את ה-repository שלך
   - Vercel יזהה אוטומטית שזה Next.js

4. **הגדר משתני סביבה:**
   - ב-Vercel, בחר את הפרויקט
   - לך ל-**Settings** → **Environment Variables**
   - הוסף:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Deploy:**
   - לחץ על "Deploy"
   - Vercel יבנה ויפרסם את האתר אוטומטית
   - תקבל URL כמו: `yekumot.vercel.app`

**עדכונים עתידיים:**
- כל push ל-GitHub יגרום ל-deploy אוטומטי חדש

### לפני הפרסום - בדיקות חשובות:

1. **בדוק שהכל עובד מקומית:**
   ```bash
   npm run build
   npm start
   ```

2. **ודא שמשתני הסביבה מוגדרים** ב-Vercel

3. **ודא ש-Supabase מוכן:**
   - הרץ את כל הסקריפטים SQL
   - בדוק שהטבלאות קיימות
   - בדוק את ה-RLS policies

4. **הגדר CORS ב-Supabase:**
   - ב-Supabase Dashboard → **Settings** → **API**
   - הוסף את ה-URL של האתר ל-**Allowed Origins**

---

## שימוש באתר

### דף הבית
- מציג את כל הפרקים
- מציג דמויות (12 הראשונות)
- מציג גריד של תכניות/פרסומות/מושגים

### דפי פרקים
- נגן וידאו של הפרק
- רשימת רפרנסים של הפרק
- **הוספת רפרנסים:** לחץ על "הוסף רפרנס", ואז לחץ על הווידאו בנקודת הזמן הרצויה
- **אימות רפרנסים:** לחץ על "אמת" ליד רפרנס של משתמש אחר
- **קישור רפרנסים:** קשר רפרנסים לרפרנסים אחרים

### דמויות
- **צפייה:** לחץ על דמות כדי לראות את הפרטים
- **הוספה:** לחץ על "הוסף דמות חדשה" (חובה להוסיף תמונה!)
- **עריכה:** לחץ על "ערוך" בדף הדמות (רק אם מחובר)

### תכניות/פרסומות/מושגים
- **צפייה:** לחץ על ערך כדי לראות את הפרטים
- **הוספה:** לחץ על "הוסף חדש" בקטגוריה המתאימה
- **עריכה:** לחץ על "ערוך" בדף הערך

### מערכת נקודות
- **יצירת ערך חדש:** 10 נקודות
- **עריכת ערך:** 2 נקודות
- **אימות רפרנס:** 1 נקודה למאמת, 5 נקודות ליוצר (הרפרנס מאומת)

---

## פתרון בעיות נפוצות

### שגיאת Build:
- בדוק את ה-console ב-Vercel
- ודא שכל ה-dependencies מותקנות
- בדוק שאין שגיאות TypeScript

### משתני סביבה לא עובדים:
- ודא שה-prefix `NEXT_PUBLIC_` קיים
- ודא שה-restart אחרי הוספת משתנים

### Supabase לא עובד:
- בדוק את ה-CORS settings
- ודא שה-URL וה-Key נכונים
- בדוק את ה-RLS policies

### Magic Link לא עובד:
- בדוק שה-Redirect URLs מוגדרים נכון
- ודא שה-Site URL נכון
- נסה בחלון פרטי

---

## קישורים שימושיים

- Vercel: https://vercel.com
- Supabase Dashboard: https://app.supabase.com
- Next.js Docs: https://nextjs.org/docs
- GitHub: https://github.com

---

## סיכום - השלבים המהירים

1. ✅ התקן Node.js
2. ✅ צור פרויקט Supabase
3. ✅ הרץ את הסקריפטים SQL בסדר
4. ✅ הגדר משתני סביבה
5. ✅ הרץ `npm run dev`
6. ✅ בדוק שהכל עובד
7. ✅ העלה ל-GitHub
8. ✅ Deploy ב-Vercel
9. ✅ הגדר Magic Link ב-Supabase

**זמן משוער: 30-45 דקות** ⚡




