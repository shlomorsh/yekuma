# הגדרת Redirect URLs ב-Supabase

## הבעיה:
הקישור מהמייל לא עובד כי Supabase צריך לדעת לאילו URLs מותר להפנות.

## פתרון - הגדר Redirect URLs:

### שלבים:

1. **לך ל-Supabase Dashboard:**
   - https://app.supabase.com
   - בחר את הפרויקט שלך

2. **עבור ל-Authentication → URL Configuration:**
   - בתפריט השמאלי: **Authentication**
   - לחץ על **URL Configuration**

3. **הוסף את ה-URLs הבאים ל-Redirect URLs:**
   
   **ל-Production (Vercel):**
   ```
   https://yekuma.vercel.app/
   https://yekuma.vercel.app
   ```
   
   **לפיתוח מקומי (אם אתה מפתח מקומית):**
   ```
   http://localhost:3000/
   http://localhost:3000
   ```

4. **הגדר Site URL:**
   - ב-**Site URL**, הגדר:
   ```
   https://yekuma.vercel.app
   ```

5. **שמור:**
   - לחץ על **Save**

## איך זה עובד:

1. המשתמש מזין אימייל ב-`/login`
2. Supabase שולח קישור באימייל
3. המשתמש לוחץ על הקישור
4. Supabase מפנה ל-URL שמוגדר ב-Redirect URLs
5. הקוד בדף הבית מזהה את ה-tokens ב-URL hash
6. הקוד מגדיר את ה-session
7. המשתמש מחובר!

## בדיקה:

1. שלח magic link למייל שלך
2. לחץ על הקישור במייל
3. אמור להיות מועבר ל-`https://yekuma.vercel.app/`
4. בדוק את ה-console - אמור להופיע "Session set successfully"
5. המשתמש אמור להיות מחובר

## פתרון בעיות:

### אם הקישור עדיין לא עובד:
1. ודא שה-URL ב-Redirect URLs **זהה בדיוק** ל-URL בקישור מהמייל
2. ודא שה-Site URL נכון
3. בדוק את ה-console בדפדפן - יש שגיאות?
4. נסה לפתוח את הקישור בחלון פרטי (incognito)

### אם יש שגיאת CORS:
- ודא שה-URL כולל את ה-protocol (`https://`)
- ודא שאין שגיאות ב-console

## הערות חשובות:

- ⚠️ ה-URL חייב להיות **זהה בדיוק** ל-URL ב-Redirect URLs
- ⚠️ כולל/ללא סלאש בסוף זה חשוב - הוסף את שני הגרסאות
- ⚠️ אחרי שינוי ב-Redirect URLs, נסה שוב לשלוח magic link

