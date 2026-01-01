"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function ContractPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
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

    if (password !== confirmPassword) {
      setMessage("הסיסמאות לא תואמות");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const email = usernameToEmail(username);

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
            username: username,
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

  return (
    <div className="min-h-screen bg-[#120e0b] text-white relative overflow-hidden" dir="rtl">
      {/* Vintage noise texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Back Button */}
      <div className="absolute top-0 w-full z-20 p-4">
        <Link href="/" className="btn-icon">
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="surface-card p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-right" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
            חוזה התחברות
          </h1>
          <p className="text-right mb-8" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            אקורדים לשיר "בוכה אל הקירות" - דויד ברוזה
          </p>

          {/* Chords Section */}
          <div className="mb-8" style={{ fontFamily: 'var(--font-heebo)', whiteSpace: 'pre', textAlign: 'right', color: '#FFFFFF', fontSize: '1rem', lineHeight: '1.1' }}>
            {/* פתיחה */}
            <div style={{ marginBottom: '1rem' }}>פתיחה:</div>
            <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>Bm A G G A x2</div>

            {/* Verse 1 */}
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A    G     A                      Bm</div>
            <div style={{ marginBottom: '1rem' }}>שמיים של עצב עלי והלילה</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>F#m              A         Bm</div>
            <div style={{ marginBottom: '1rem' }}>נוטף לעתו כמו חלב הנר</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Bm                     Em</div>
            <div style={{ marginBottom: '1rem' }}>חרמש וירח כאן מלמעלה</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>                     A      G             A</div>
            <div style={{ marginBottom: '1rem' }}>אומר לי לך הלאה ואל תשבר</div>

            {/* Verse 2 */}
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A    G     A                     Bm</div>
            <div style={{ marginBottom: '1rem' }}>רכבת הלילה מלאה געגוע</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>F#m             A            Bm</div>
            <div style={{ marginBottom: '1rem' }}>ואני ברציף מחכה כמו לנס</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Bm                            Em</div>
            <div style={{ marginBottom: '1rem' }}>בגיל של בדידות אני קרוע</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>          A      G                   A</div>
            <div style={{ marginBottom: '1rem' }}>אומר לי לנוע ועוד לחפש</div>

            {/* Chorus */}
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}> A                  D</div>
            <div style={{ marginBottom: '1rem' }}>ושוב געגוע פגוע נטוע</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A               G</div>
            <div style={{ marginBottom: '1rem' }}>מרעל זיכרונות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>D</div>
            <div style={{ marginBottom: '1rem' }}>גופי בלי גופך שוב</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}> A      G                A</div>
            <div style={{ marginBottom: '1rem' }}>גווע שוקע שוקע שוקע</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>      A                Bm</div>
            <div style={{ marginBottom: '1rem' }}>כאן לבד בין הקירות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
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
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו וצועק אל הקירות</div>

            {/* Ending */}
            <div style={{ marginBottom: '1rem' }}>שוקע שוקע</div>
            <div style={{ marginBottom: '1rem' }}>כאן לבד בין הקירות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו ובוכה אל הקירות</div>
            <div style={{ marginBottom: '1rem' }}>שוקע גווע</div>
            <div style={{ marginBottom: '1rem' }}>ובוכה אל הקירות</div>
            <div style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>A           G         A       D</div>
            <div style={{ marginBottom: '1rem' }}>איורו איורו וצועק אל הקירות</div>

            {/* סיום */}
            <div style={{ marginBottom: '1rem' }}>סיום:</div>
            <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>Bm A F#m Bm x2</div>
          </div>

          {/* Agreement and Sign Up Form */}
          <div className="surface-card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setMessage("");
                  }}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-[#1e1a17] text-[#ec6d13] focus:ring-[#ec6d13]"
                />
                <label htmlFor="agreement" className="text-sm text-white/90 cursor-pointer">
                  מאשר שקראתי את החוזה והסכמתי לכל הנאמר
                </label>
              </div>

              {/* Username Field */}
              <div className="group">
                <label className="block text-white/90 text-sm font-bold mb-2 pr-1">שם משתמש</label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#ec6d13] transition-colors">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setMessage("");
                    }}
                    placeholder="הכנס שם משתמש"
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
                <label className="block text-white/90 text-sm font-bold mb-2 pr-1">אימות סיסמה</label>
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

              {/* Message */}
              {message && (
                <p className={`text-sm text-center ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-400" : "text-[#ef4444]"}`}>
                  {message}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !agreed}
                className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "נרשם..." : "הרשמה"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-white/50">
                יש לך כבר חשבון?{' '}
                <Link href="/login" className="text-[#ec6d13] hover:underline">
                  התחבר כאן
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
