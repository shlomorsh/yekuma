# הגדרת Magic Link ב-Supabase

## בעיה: הקישור מהמייל לא מתחבר

אם הקישור מהמייל לא עובד, צריך לוודא שהגדרות ה-URL redirect ב-Supabase נכונות.

## שלבים לתיקון:

### 1. פתח את Supabase Dashboard
1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך

### 2. הגדר Redirect URLs
1. עבור ל-**Authentication** → **URL Configuration**
2. ב-**Redirect URLs**, הוסף את ה-URLs הבאים:
   - `http://localhost:3000` (לפיתוח מקומי)
   - `http://localhost:3000/` (עם סלאש)
   - `https://yourdomain.com` (לייצור - החלף ב-domain שלך)
   - `https://yourdomain.com/` (עם סלאש)

### 3. ודא שה-Site URL נכון
1. ב-**Site URL**, הגדר:
   - לפיתוח: `http://localhost:3000`
   - לייצור: `https://yourdomain.com`

### 4. בדוק את הגדרות Email
1. עבור ל-**Authentication** → **Email Templates**
2. ודא ש-**Magic Link** template פעיל
3. ודא שה-URL ב-template מכיל: `{{ .ConfirmationURL }}`

## בדיקה:

1. שלח magic link למייל שלך
2. לחץ על הקישור במייל
3. ודא שאתה מועבר ל-`http://localhost:3000` (או ה-domain שלך)
4. בדוק את ה-console בדפדפן - אמור להופיע "Auth state changed: SIGNED_IN"

## פתרון בעיות:

### אם הקישור לא עובד:
1. בדוק שה-URL ב-email matches בדיוק ל-URL ב-Redirect URLs
2. ודא שאין שגיאות ב-console
3. נסה לפתוח את הקישור בחלון פרטי (incognito)
4. בדוק שה-Site URL נכון

### אם יש שגיאת CORS:
1. ודא שה-URL ב-Redirect URLs כולל את ה-protocol (`http://` או `https://`)
2. ודא שאין שגיאות ב-console

## הערות חשובות:

- ה-URL חייב להיות **זהה בדיוק** ל-URL ב-Redirect URLs
- כולל/לא כולל סלאש בסוף זה משנה!
- ב-localhost, ודא שאתה משתמש ב-`http://localhost:3000` ולא `http://127.0.0.1:3000`

