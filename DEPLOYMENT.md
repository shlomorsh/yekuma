# מדריך פרסום האתר - יקומות

## אפשרויות פרסום

### 1. Vercel (מומלץ ביותר) ⭐

**יתרונות:**
- חינם לחלוטין (עם מגבלות סבירות)
- תמיכה מעולה ב-Next.js
- Deploy אוטומטי מ-GitHub
- SSL אוטומטי
- CDN גלובלי
- מהיר מאוד

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
   - לך ל-Settings → Environment Variables
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

---

### 2. Netlify

**שלבים:**

1. העלה ל-GitHub (כמו ב-Vercel)
2. הירשם ל-Netlify: https://netlify.com
3. צור פרויקט חדש מ-GitHub
4. הגדר:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - הוסף משתני סביבה (כמו ב-Vercel)

---

### 3. Railway

**שלבים:**

1. הירשם ל-Railway: https://railway.app
2. צור פרויקט חדש
3. בחר "Deploy from GitHub repo"
4. הגדר משתני סביבה
5. Railway יבנה ויפרסם אוטומטית

---

## לפני הפרסום - בדיקות חשובות

### 1. בדוק שהכל עובד מקומית:
```bash
npm run build
npm start
```

### 2. ודא שמשתני הסביבה מוגדרים:
צור קובץ `.env.local` (לא להעלות ל-GitHub!):
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. ודא ש-Supabase מוכן:
- הרץ את כל הסקריפטים SQL
- בדוק שהטבלאות קיימות
- בדוק את ה-RLS policies

### 4. בדוק את `next.config.ts`:
```typescript
// ודא שאין בעיות
```

---

## הגדרות Supabase ל-Production

### 1. CORS Settings:
- ב-Supabase Dashboard → Settings → API
- הוסף את ה-URL של האתר ל-Allowed Origins

### 2. RLS Policies:
- ודא שה-policies מוגדרות נכון
- בדוק שהמשתמשים יכולים לקרוא/לכתוב

### 3. Database:
- ודא שכל הטבלאות קיימות
- הרץ את כל הסקריפטים SQL

---

## .gitignore

ודא שיש לך `.gitignore` עם:
```
.env
.env.local
.env*.local
.next
node_modules
```

---

## דומיין מותאם אישית

### ב-Vercel:
1. Settings → Domains
2. הוסף את הדומיין שלך
3. עקוב אחר ההוראות ל-DNS

---

## טיפים

1. **בדוק את ה-build מקומית לפני deploy:**
   ```bash
   npm run build
   ```

2. **השתמש ב-Preview Deployments:**
   - Vercel יוצר preview לכל PR
   - זה מאפשר לבדוק לפני merge

3. **Monitor את האתר:**
   - Vercel מספק analytics חינם
   - Supabase Dashboard מציג usage

4. **Backup:**
   - ודא שיש לך backup של ה-Supabase database
   - Vercel שומר היסטוריית deployments

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

---

## עלויות

### Vercel (Free Tier):
- ✅ חינם לחלוטין
- ✅ 100GB bandwidth
- ✅ Deployments ללא הגבלה
- ✅ SSL חינם

### Supabase (Free Tier):
- ✅ 500MB database
- ✅ 1GB storage
- ✅ 2GB bandwidth
- ✅ משתמשים ללא הגבלה

**סה"כ: חינם לחלוטין! 🎉**

---

## קישורים שימושיים

- Vercel: https://vercel.com
- Supabase Dashboard: https://app.supabase.com
- Next.js Docs: https://nextjs.org/docs
- GitHub: https://github.com

---

## סיכום - השלבים המהירים

1. ✅ העלה ל-GitHub
2. ✅ הירשם ל-Vercel
3. ✅ חבר את ה-repo
4. ✅ הוסף משתני סביבה
5. ✅ Deploy!
6. ✅ בדוק שהכל עובד
7. ✅ הוסף דומיין (אופציונלי)

**זמן משוער: 10-15 דקות** ⚡

