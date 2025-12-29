# תיקון בעיות פריסה ב-Vercel

## הבעיה
הפריסה הראשית (`https://yekuma.vercel.app`) לא עובדת, בעוד שהפריסת Preview (`https://yekuma-m3o57ml3l-shlomorshs-projects.vercel.app`) עובדת.

## סיבות אפשריות ופתרונות

### 1. משתני סביבה לא מוגדרים ל-Production

**הבעיה:**
ב-Vercel, משתני סביבה מוגדרים לכל סביבה בנפרד (Production, Preview, Development). אם המשתנים מוגדרים רק ל-Preview, הם לא יעבדו ב-Production.

**פתרון:**
1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Settings** → **Environment Variables**
3. ודא שלכל משתנה יש סימון ✅ ב-**Production**
4. אם לא, לחץ על המשתנה ובחר ✅ **Production**
5. שמור

**משתנים שצריכים להיות מוגדרים:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. הגדרות Supabase - Redirect URLs

**הבעיה:**
Supabase צריך לדעת לאילו URLs מותר להפנות משתמשים.

**פתרון:**
1. לך ל-Supabase Dashboard → הפרויקט שלך
2. לך ל-**Authentication** → **URL Configuration**
3. ב-**Redirect URLs**, הוסף:
   ```
   https://yekuma.vercel.app
   https://yekuma.vercel.app/
   ```
4. ב-**Site URL**, הגדר:
   ```
   https://yekuma.vercel.app
   ```
5. שמור

### 3. הגדרות Supabase - CORS

**הבעיה:**
Supabase חוסם בקשות מ-domains שלא מוגדרים ב-Allowed Origins.

**פתרון:**
1. לך ל-Supabase Dashboard → הפרויקט שלך
2. לך ל-**Settings** → **API**
3. ב-**Allowed Origins**, הוסף:
   ```
   https://yekuma.vercel.app
   ```
4. שמור

### 4. בדיקת לוגים ב-Vercel

**איך לבדוק:**
1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Deployments**
3. לחץ על ה-deployment הראשי (Production)
4. בדוק את ה-**Build Logs** ו-**Runtime Logs**
5. חפש שגיאות או אזהרות

**שגיאות נפוצות:**
- `Missing Supabase environment variables` - משתני סביבה לא מוגדרים
- `CORS error` - צריך להוסיף את ה-domain ב-Supabase
- `Build failed` - בעיה בבנייה

### 5. Redeploy אחרי תיקון הגדרות

**חשוב:**
אחרי תיקון משתני סביבה או הגדרות Supabase, צריך לרענן את הפריסה:

1. ב-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Deployments**
3. לחץ על ה-3 נקודות (⋯) ליד ה-deployment הראשי
4. בחר **Redeploy**
5. או פשוט עשה push חדש ל-GitHub

### 6. בדיקת Domain Configuration

**איך לבדוק:**
1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Settings** → **Domains**
3. ודא ש-`yekuma.vercel.app` מופיע ברשימה
4. אם לא, הוסף אותו

### 7. בדיקת Build Configuration

**איך לבדוק:**
1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Settings** → **General**
3. בדוק:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (או `next build`)
   - **Output Directory**: `.next` (או ריק)
   - **Install Command**: `npm install` (או ריק)

## בדיקה מהירה

**בדוק בדפדפן:**
1. פתח `https://yekuma.vercel.app` ב-Chrome/Firefox
2. לחץ F12 לפתיחת Developer Tools
3. לך ל-**Console** ובדוק אם יש שגיאות
4. לך ל-**Network** ובדוק אם יש בקשות שנכשלו

**שגיאות נפוצות:**
- `Missing Supabase environment variables` - משתני סביבה
- `CORS error` - הגדרות Supabase
- `404 Not Found` - בעיית routing
- `500 Internal Server Error` - שגיאת שרת

## סיכום - רשימת בדיקות

- [ ] משתני סביבה מוגדרים ל-Production ב-Vercel
- [ ] Redirect URLs מוגדרים ב-Supabase
- [ ] Site URL מוגדר ב-Supabase
- [ ] Allowed Origins מוגדר ב-Supabase
- [ ] Domain מוגדר ב-Vercel
- [ ] Build Configuration תקין
- [ ] Redeploy אחרי תיקונים

## אם עדיין לא עובד

1. השווה את ה-Build Logs בין Preview ל-Production
2. בדוק את ה-Runtime Logs ב-Production
3. בדוק את ה-Console בדפדפן
4. פנה לתמיכה של Vercel עם פרטי הבעיה


