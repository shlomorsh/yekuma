"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function parseContent(content: string) {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.replace('## ', '').trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

const contractContent = `## פתיחה
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
Bm A F#m Bm x2`;

export default function ContractPage() {
  const router = useRouter();
  const [nameTag, setNameTag] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameToEmail = (username: string) => {
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      cleanUsername = 'user' + Math.random().toString(36).substring(2, 9);
    }
    return `${cleanUsername}@yekumot.app`;
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        router.push("/");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameTag.trim()) {
      setMessage("אנא הכנס name tag");
      return;
    }

    if (!password.trim()) {
      setMessage("אנא הכנס סיסמה");
      return;
    }

    if (password.length < 6) {
      setMessage("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("הסיסמאות לא תואמות");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const email = usernameToEmail(nameTag);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setMessage('שגיאה בהרשמה: ' + error.message);
        return;
      }

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            username: nameTag,
            points: 0 
          }]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        setMessage("ההרשמה הצליחה! מתחבר...");
        setTimeout(async () => {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (!signInError) {
            router.push("/");
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null;
  }

  const contentSections = parseContent(contractContent);

  return (
    <div className="min-h-screen bg-[#120e0b] text-white relative overflow-x-hidden pb-24" dir="rtl">
      {/* Scanlines overlay */}
      <div className="scanlines fixed inset-0 z-50 opacity-20 pointer-events-none" />
      
      {/* Navigation Bar */}
      <nav className="app-bar flex items-center justify-between">
        <Link href="/" className="btn-icon">
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            <span className="text-[#ec6d13]">יקו</span>מות
          </h1>
        </div>
        <div className="w-12"></div>
      </nav>

      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-2">חוזה</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Chords Section - Same style as Eioro */}
        <section className="surface-card p-8">
          <div style={{ fontFamily: 'var(--font-heebo)', whiteSpace: 'pre', textAlign: 'right', color: '#FFFFFF', fontSize: '1rem', lineHeight: '1.1' }}>
            {Object.entries(contentSections).map(([section, content]) => {
              const lines = content.split('\n').filter(line => line.trim());
              return (
                <div key={section}>
                  {section !== 'פתיחה' && section !== 'סיום אקורדים' && (
                    <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{section}:</div>
                  )}
                  {lines.map((line, i) => {
                    const hasHebrew = /[\u0590-\u05FF]/.test(line);
                    const chordPattern = new RegExp('^[A-Ga-g#mb0-9\\s/x]+$');
                    const isChordLine = !hasHebrew && chordPattern.test(line.trim());
                    
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          marginBottom: isChordLine ? '0.25rem' : '1rem',
                          textAlign: 'right'
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>

        {/* Sign Up Form */}
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold mb-4">חתימה על החוזה</h2>
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            {/* Name Tag Field */}
            <div className="group">
              <label className="block text-white/90 text-sm font-bold mb-2 pr-1">Name Tag</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#ec6d13] transition-colors">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input
                  type="text"
                  value={nameTag}
                  onChange={(e) => {
                    setNameTag(e.target.value);
                    setMessage("");
                  }}
                  placeholder="הכנס name tag"
                  className="input-field pr-12 text-left"
                  dir="ltr"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-white/90 text-sm font-bold mb-2 pr-1">סיסמה</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#ec6d13] transition-colors">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="••••••••"
                  className="input-field pr-12 pl-12 text-left"
                  dir="ltr"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="group">
              <label className="block text-white/90 text-sm font-bold mb-2 pr-1">חזור על סיסמה</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#ec6d13] transition-colors">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="••••••••"
                  className="input-field pr-12 pl-12 text-left"
                  dir="ltr"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Reset Email Field */}
            <div className="group">
              <label className="block text-white/90 text-sm font-bold mb-2 pr-1">מייל לריסט</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#ec6d13] transition-colors">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setMessage("");
                  }}
                  placeholder="your@email.com"
                  className="input-field pr-12 text-left"
                  dir="ltr"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Message */}
            {message && (
              <p className={`text-sm text-center ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-400" : "text-[#ef4444]"}`}>
                {message}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "נרשם..." : "הרשמה"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

