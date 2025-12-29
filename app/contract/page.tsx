"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "yekumot_credentials";

interface SavedCredentials {
  username: string;
  email: string;
}

export default function ContractPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Helper function to convert username to email
  const usernameToEmail = (username: string) => {
    return `${username.toLowerCase().trim()}@yekumot.local`;
  };

  // Check if already logged in
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

  // Load saved username if exists
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const credentials: SavedCredentials = JSON.parse(saved);
        if (credentials.username) {
          setUsername(credentials.username);
          setRememberMe(true);
        }
      } catch (err) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      setMessage("יש לאשר שקראת את החוזה והסכמת לכל הנאמר");
      return;
    }

    if (!username.trim()) {
      setMessage("אנא הכנס שם משתמש");
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

    if (isSignUp && password !== confirmPassword) {
      setMessage("הסיסמאות לא תואמות");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const email = usernameToEmail(username);

      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          setMessage('שגיאה בהרשמה: ' + error.message);
          return;
        }

        if (data?.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
              id: data.user.id, 
              username: username,
              points: 0 
            }]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

          // Save credentials if remember me is checked
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              username: username,
              email: email,
              password: password,
            }));
          }

          setMessage("ההרשמה הצליחה! מתחבר...");
          // Wait a moment then sign in
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
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          setMessage('שגיאה בהתחברות: ' + error.message);
          return;
        }

        if (data?.session) {
          // Save credentials if remember me is checked
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              username: username,
              email: email,
              password: password,
            }));
          } else {
            // Clear saved credentials if not remembering
            localStorage.removeItem(STORAGE_KEY);
          }

          setMessage("התחברת בהצלחה! מעביר...");
          router.push("/");
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
          ← חזרה לדף הבית
        </Link>

        <div className="wireframe-border p-8 bg-transparent mb-8">
          <h1 className="text-4xl font-bold mb-4 glitch-text text-right" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
            חוזה התחברות
          </h1>
          <p className="text-right mb-8" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            אקורדים לשיר "בוכה אל הקירות" - דויד ברוזה
          </p>

          {/* Chords Section */}
          <div className="mb-8" style={{ fontFamily: 'var(--font-heebo)', whiteSpace: 'pre', textAlign: 'right', color: '#FFFFFF', fontSize: '1rem', lineHeight: '1.1' }}>
            {/* פתיחה */}
            <div style={{ marginBottom: '1rem' }}>פתיחה:</div>
            <div style={{ marginBottom: '1rem' }}>Bm A G G A x2</div>

            {/* Verse 1 */}
            <div style={{ marginBottom: '0.25rem' }}>A    G     A                      Bm</div>
            <div style={{ marginBottom: '1rem' }}>שמיים של עצב עלי והלילה</div>
            <div style={{ marginBottom: '0.25rem' }}>F#m              A         Bm</div>
            <div style={{ marginBottom: '1rem' }}>נוטף לעתו כמו חלב הנר</div>
            <div style={{ marginBottom: '0.25rem' }}>Bm                     Em</div>
            <div style={{ marginBottom: '1rem' }}>חרמש וירח כאן מלמעלה</div>
            <div style={{ marginBottom: '0.25rem' }}>                     A      G             A</div>
            <div style={{ marginBottom: '1rem' }}>אומר לי לך הלאה ואל תשבר</div>

            {/* Verse 2 */}
            <div style={{ marginBottom: '0.25rem' }}>A    G     A                     Bm</div>
            <div style={{ marginBottom: '1rem' }}>רכבת הלילה מלאה געגוע</div>
            <div style={{ marginBottom: '0.25rem' }}>F#m             A            Bm</div>
            <div style={{ marginBottom: '1rem' }}>ואני ברציף מחכה כמו לנס</div>
            <div style={{ marginBottom: '0.25rem' }}>Bm                            Em</div>
            <div style={{ marginBottom: '1rem' }}>בגיל של בדידות אני קרוע</div>
            <div style={{ marginBottom: '0.25rem' }}>          A      G                   A</div>
            <div style={{ marginBottom: '1rem' }}>אומר לי לנוע ועוד לחפש</div>

            {/* Chorus */}
            <div style={{ marginBottom: '0.25rem' }}> A                  D</div>
            <div style={{ marginBottom: '1rem' }}>ושוב געגוע פגוע נטוע</div>
            <div style={{ marginBottom: '0.25rem' }}>A               G</div>
            <div style={{ marginBottom: '1rem' }}>מרעל זיכרונות</div>
            <div style={{ marginBottom: '0.25rem' }}>D</div>
            <div style={{ marginBottom: '1rem' }}>גופי בלי גופך שוב</div>
            <div style={{ marginBottom: '0.25rem' }}> A      G                A</div>
            <div style={{ marginBottom: '1rem' }}>גווע שוקע שוקע שוקע</div>
            <div style={{ marginBottom: '0.25rem' }}>      A                Bm</div>
            <div style={{ marginBottom: '1rem' }}>כאן לבד בין הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו וצועק אל הקירות</div>

            {/* Verse 3 */}
            <div style={{ marginBottom: '1rem' }}>השמש זורחת</div>
            <div style={{ marginBottom: '1rem' }}>בעיר הזרה לי</div>
            <div style={{ marginBottom: '1rem' }}>לא יודע לאן</div>
            <div style={{ marginBottom: '1rem' }}>מוליכים הרחובות</div>
            <div style={{ marginBottom: '1rem' }}>רק זה שאליך הולך</div>
            <div style={{ marginBottom: '1rem' }}>הוא יקרא לי</div>
            <div style={{ marginBottom: '1rem' }}>תראי איך יקרא לי</div>
            <div style={{ marginBottom: '1rem' }}>יגיד לי לבוא</div>

            {/* Verse 4 */}
            <div style={{ marginBottom: '1rem' }}>ללכת שנית לאיבוד בעינייך</div>
            <div style={{ marginBottom: '1rem' }}>לחבק אותך שוב לחבקך שוב אליי</div>
            <div style={{ marginBottom: '1rem' }}>עקבות לא השארת שאליך אחריך</div>
            <div style={{ marginBottom: '1rem' }}>השארת את פניך צרובות בעיניי</div>

            {/* Chorus Repeat */}
            <div style={{ marginBottom: '1rem' }}>ושוב געגוע פגוע</div>
            <div style={{ marginBottom: '1rem' }}>נגוע מרעל זיכרונות</div>
            <div style={{ marginBottom: '1rem' }}>גופי בלי גופך שוב</div>
            <div style={{ marginBottom: '1rem' }}>גווע שוקע שוקע שוקע</div>
            <div style={{ marginBottom: '1rem' }}>כאן לבד בין הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו וצועק אל הקירות</div>

            {/* Ending */}
            <div style={{ marginBottom: '1rem' }}>שוקע שוקע</div>
            <div style={{ marginBottom: '1rem' }}>כאן לבד בין הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '1rem' }}>שוקע גווע</div>
            <div style={{ marginBottom: '1rem' }}>ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו וצועק אל הקירות</div>

            {/* סיום */}
            <div style={{ marginBottom: '1rem' }}>סיום:</div>
            <div style={{ marginBottom: '1rem' }}>Bm A F#m Bm x2</div>
          </div>

          {/* Agreement and Login Form */}
          <div className="wireframe-border p-6 bg-transparent">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-start gap-3 text-right">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setMessage("");
                  }}
                  className="mt-1 w-5 h-5 wireframe-border"
                  style={{ accentColor: '#008C9E' }}
                />
                <label htmlFor="agreement" className="text-sm" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  מאשר שקראתי את החוזה והסכמתי לכל הנאמר
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setMessage("");
                  }}
                  placeholder="הכנס שם משתמש"
                  className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none text-right"
                  style={{ fontFamily: 'var(--font-heebo)' }}
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  סיסמה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="הכנס סיסמה"
                  className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none text-right"
                  style={{ fontFamily: 'var(--font-heebo)' }}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    אימות סיסמה
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setMessage("");
                    }}
                    placeholder="הכנס סיסמה שוב"
                    className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none text-right"
                    style={{ fontFamily: 'var(--font-heebo)' }}
                    required={isSignUp}
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 text-right">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 wireframe-border"
                  style={{ accentColor: '#008C9E' }}
                />
                <label htmlFor="remember" className="text-sm" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  זכור אותי (התחבר אוטומטית בפעם הבאה)
                </label>
              </div>

              {message && (
                <p className={`text-sm text-center text-right ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !agreed}
                className="w-full control-panel-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isSignUp ? "נרשם..." : "מתחבר...") : (isSignUp ? "הרשמה" : "התחבר")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
                className="text-sm transition-colors hover:underline"
                style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}
              >
                {isSignUp ? "יש לך כבר חשבון? התחבר" : "אין לך חשבון? הירשם"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

