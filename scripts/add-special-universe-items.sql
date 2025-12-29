-- SQL Script to add special universe items and update existing ones
-- Run this in Supabase SQL Editor

-- Step 1: Update existing Tivonizel item with new image
UPDATE universe_items
SET image_url = '/yekum/TIVONIZEL.png',
    updated_at = now()
WHERE title ILIKE '%טבעוניצל%' OR title ILIKE '%tivonizel%';

-- Step 2: Add Eioro Chords item
INSERT INTO universe_items (
    title,
    description,
    content,
    image_url,
    item_type,
    verified
)
VALUES (
    'אקורדים איורו',
    'אקורדים לשיר "בוכה אל הקירות" - דויד ברוזה',
    '## פתיחה
Bm A G G A x2

## בית 1
A    G     A                      Bm
שמיים של עצב עלי והלילה
F#m              A         Bm
נוטף לעתו כמו חלב הנר
Bm                     Em
חרמש וירח כאן מלמעלה
                     A      G             A
אומר לי לך הלאה ואל תשבר

## בית 2
A    G     A                     Bm
רכבת הלילה מלאה געגוע
F#m             A            Bm
ואני ברציף מחכה כמו לנס
Bm                            Em
בגיל של בדידות אני קרוע
          A      G                   A
אומר לי לנוע ועוד לחפש

## פזמון
 A                  D
ושוב געגוע פגוע נטוע
A               G
מרעל זיכרונות
D
גופי בלי גופך שוב
 A      G                A
גווע שוקע שוקע שוקע
      A                Bm
כאן לבד בין הקירות
A           G         A       D
איורו איורו ובוכה אל הקירות
A           G         A       D
איורו איורו וצועק אל הקירות

## בית 3
השמש זורחת
בעיר הזרה לי
לא יודע לאן
מוליכים הרחובות
רק זה שאליך הולך
הוא יקרא לי
תראי איך יקרא לי
יגיד לי לבוא

## בית 4
ללכת שנית לאיבוד בעינייך
לחבק אותך שוב לחבקך שוב אליי
עקבות לא השארת שאליך אחריך
השארת את פניך צרובות בעיניי

## פזמון חוזר
ושוב געגוע פגוע
נגוע מרעל זיכרונות
גופי בלי גופך שוב
גווע שוקע שוקע שוקע
כאן לבד בין הקירות
A           G         A       D
איורו איורו ובוכה אל הקירות
A           G         A       D
איורו איורו וצועק אל הקירות

## סיום
שוקע שוקע
כאן לבד בין הקירות
A           G         A       D
איורו איורו ובוכה אל הקירות
שוקע גווע
ובוכה אל הקירות
A           G         A       D
איורו איורו וצועק אל הקירות

## סיום אקורדים
Bm A F#m Bm x2',
    '/yekum/EIORO.png',
    'concept',
    true
)
ON CONFLICT (title) DO UPDATE
SET image_url = EXCLUDED.image_url,
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();

-- Step 3: Add Italian Learning item
INSERT INTO universe_items (
    title,
    description,
    content,
    image_url,
    item_type,
    verified
)
VALUES (
    'לימוד איטלקית',
    'דף לימוד איטלקית - מילה אחת',
    '## מילה
POKITO = פוקיטו',
    '/yekum/limud italkit.png',
    'concept',
    true
)
ON CONFLICT (title) DO UPDATE
SET image_url = EXCLUDED.image_url,
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();

-- Step 4: Verify the updates
SELECT id, title, item_type, image_url, verified
FROM universe_items
WHERE title IN ('אקורדים איורו', 'לימוד איטלקית')
   OR title ILIKE '%טבעוניצל%' OR title ILIKE '%tivonizel%'
ORDER BY title;

