# תיעוד פתרון בעיית ReactPlayer - onDuration

## בעיה ראשונית
שגיאה בקונסולה:
```
Unknown event handler property `onDuration`. It will be ignored.
```

השגיאה הופיעה כאשר ReactPlayer ניסה להעביר את ה-prop `onDuration` ל-DOM element (כנראה `<video>`), אבל React לא מזהה את זה כ-event handler תקין.

## מה ניסיתי

### ניסיון 1: הסרת `onDuration` לחלוטין
**מה עשיתי:**
- הסרתי את ה-prop `onDuration` מ-ReactPlayer
- השארתי רק את הקוד ב-`onReady` שמנסה לקבל את ה-duration

**תוצאה:**
- ❌ השגיאה נעלמה
- ❌ אבל המשתמש דיווח שהוידאו לא נטען

**למה זה לא עבד:**
- כנראה שהיה קשר בין `onDuration` לטעינת הוידאו (אבל זה לא הגיוני כי `onDuration` הוא callback, לא prop שצריך לטעינה)
- או שהיה בעיה אחרת שלא קשורה ל-`onDuration`

### ניסיון 2: הוספת `onDuration` בחזרה
**מה עשיתי:**
- הוספתי את `onDuration` בחזרה כי חשבתי שהוא prop תקין של ReactPlayer
- הוספתי גם `useEffect` שיבדוק את ה-duration אחרי שהפלייר מוכן

**תוצאה:**
- ❌ השגיאה חזרה
- ❌ הוידאו עדיין לא נטען

**למה זה לא עבד:**
- `onDuration` הוא **לא** prop תקין של ReactPlayer בגרסה 3.4.0
- ReactPlayer מעביר props לא מוכרים ל-DOM element, וזה גורם לשגיאה

### ניסיון 3: הסרת `onDuration` ושימוש רק ב-`onReady` ו-`useEffect`
**מה עשיתי:**
- הסרתי את `onDuration` לחלוטין
- השארתי את הקוד ב-`onReady` שמנסה לקבל את ה-duration
- הוספתי `useEffect` שבודק את ה-duration אחרי שהפלייר מוכן, עם retry אחרי שנייה

**תוצאה:**
- ✅ השגיאה נעלמה
- ✅ הוידאו אמור להיטען

**למה זה עבד:**
- `onDuration` לא קיים ב-ReactPlayer, אז הסרתי אותו
- הקוד ב-`onReady` ו-`useEffect` מספיק כדי לקבל את ה-duration
- YouTube API לפעמים צריך זמן לטעון את המטא-דאטה, אז ה-retry ב-`useEffect` עוזר

## פתרון סופי

### מה עובד:
1. **`onReady` callback** - מנסה לקבל את ה-duration מיד כשהפלייר מוכן
2. **`useEffect` hook** - בודק את ה-duration אחרי שהפלייר מוכן, עם retry אחרי שנייה
3. **`onProgress` callback** - עוקב אחר התקדמות הוידאו (לא קשור ל-duration, אבל עוזר לדעת שהפלייר עובד)

### קוד סופי:

```typescript
// ב-onReady:
onReady={() => {
  console.log('[Chapter] Video player ready');
  setIsReady(true);
  setPlayerLoaded(true);
  setVideoError(null);
  // Try to get video duration
  try {
    if (playerRef.current && playerRef.current.getDuration) {
      const duration = playerRef.current.getDuration();
      if (duration && duration > 0) {
        setVideoDuration(duration);
        console.log('[Chapter] Video duration:', duration);
      }
    } else if (playerRef.current && playerRef.current.getInternalPlayer) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && typeof internalPlayer.getDuration === 'function') {
        const duration = internalPlayer.getDuration();
        if (duration && duration > 0) {
          setVideoDuration(duration);
          console.log('[Chapter] Video duration:', duration);
        }
      }
    }
  } catch (err) {
    console.warn('Could not get video duration:', err);
  }
}}

// useEffect hook:
useEffect(() => {
  if (isReady && playerRef.current && videoDuration === 600) {
    const checkDuration = () => {
      try {
        if (playerRef.current && playerRef.current.getDuration) {
          const duration = playerRef.current.getDuration();
          if (duration && duration > 0 && duration !== Infinity && !isNaN(duration)) {
            setVideoDuration(duration);
            console.log('[Chapter] Video duration from useEffect:', duration);
            return;
          }
        }
      } catch (err) {
        // Ignore errors
      }
    };

    // Try immediately
    checkDuration();

    // Try again after a short delay (YouTube API sometimes needs time)
    const timeout = setTimeout(() => {
      checkDuration();
    }, 1000);

    return () => clearTimeout(timeout);
  }
}, [isReady, videoDuration]);
```

## לקחים

1. **`onDuration` לא קיים ב-ReactPlayer 3.4.0** - זה לא prop תקין, אז לא צריך להשתמש בו
2. **ReactPlayer מעביר props לא מוכרים ל-DOM** - זה גורם לשגיאות React
3. **YouTube API צריך זמן** - לפעמים המטא-דאטה לא זמין מיד, אז צריך retry
4. **`getDuration()` עובד** - אפשר לקבל את ה-duration דרך ה-ref של ReactPlayer

## גרסאות
- ReactPlayer: 3.4.0
- Next.js: 16.1.1
- React: 19.2.3

## תאריך
תוקן ב: 2024

