# הוראות העלאה ל-GitHub

## ✅ מה כבר נעשה:
- ✅ כל הקבצים נוספו ל-git
- ✅ נעשה commit ראשוני
- ✅ ה-branch שונה ל-`main`

## 📝 השלבים הבאים:

### 1. צור Repository חדש ב-GitHub:

1. לך ל: https://github.com/new
2. מלא:
   - **Repository name**: `yekumot` (או שם אחר)
   - **Description**: "Yekumot Wiki System - מערכת ויקי לפרקי יקומות"
   - **Public** או **Private** (בחר מה שמתאים)
   - **אל תסמן** "Initialize with README" (כי כבר יש לנו קוד)
3. לחץ על **"Create repository"**

### 2. העלה את הקוד:

לאחר יצירת ה-repository, GitHub יציג לך הוראות. הפעל את הפקודות הבאות:

```bash
cd "C:\Users\shlom\OneDrive\שולחן העבודה\APPS\yekumot\yekumot-app"

# הוסף את ה-remote (החלף YOUR_USERNAME בשם המשתמש שלך ב-GitHub)
git remote add origin https://github.com/YOUR_USERNAME/yekumot.git

# העלה את הקוד
git push -u origin main
```

**או אם יש לך SSH מוגדר:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/yekumot.git
git push -u origin main
```

### 3. אם GitHub מבקש אימות:

אם GitHub מבקש username ו-password:
- **Username**: שם המשתמש שלך ב-GitHub
- **Password**: צריך להשתמש ב-**Personal Access Token** (לא סיסמה רגילה)

**איך ליצור Personal Access Token:**
1. לך ל: https://github.com/settings/tokens
2. לחץ על **"Generate new token"** → **"Generate new token (classic)"**
3. תן שם: `yekumot-deploy`
4. בחר הרשאות: `repo` (כל ה-repo permissions)
5. לחץ **"Generate token"**
6. העתק את ה-token (תראה אותו רק פעם אחת!)
7. השתמש ב-token הזה במקום הסיסמה

### 4. בדוק שהכל עבד:

לך ל: `https://github.com/YOUR_USERNAME/yekumot`

אמור לראות את כל הקבצים שם! 🎉

---

## 🚀 השלב הבא - Deploy ל-Vercel:

לאחר שהקוד ב-GitHub, המשך לשלב 2 במדריך `DEPLOYMENT.md`:
1. היכנס ל-Vercel
2. חבר את ה-repository
3. הוסף משתני סביבה
4. Deploy!

---

## 💡 טיפים:

- אם יש שגיאה ב-push, בדוק שה-repository נוצר ב-GitHub
- ודא שה-URL נכון (עם השם הנכון של ה-repository)
- אם יש בעיות, נסה: `git remote remove origin` ואז הוסף שוב

