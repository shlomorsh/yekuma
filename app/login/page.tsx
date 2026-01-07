"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage("אנא הכנס שם משתמש");
      return;
    }

    if (!password.trim()) {
      setMessage("אנא הכנס סיסמה");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const email = usernameToEmail(username);

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMessage('שגיאה בהתחברות: ' + error.message);
        return;
      }

      router.push("/");
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    <div className="min-h-screen bg-white text-black relative overflow-auto">
      {/* Back Button */}
      <div className="absolute top-0 w-full z-20 p-4">
        <Link 
          href="/" 
          className="text-black hover:underline"
        >
          ← חזרה
        </Link>
      </div>

      {/* Contract Document */}
      <div className="max-w-2xl mx-auto px-8 py-16" style={{ fontFamily: '"Reisinger-Michal", var(--font-heebo), sans-serif' }}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">יקומה</h1>
          <h2 className="text-xl mb-8">חוזה הרשמה</h2>
        </div>

        {/* Chords Section */}
        <div className="mb-12 border-b border-black pb-8">
          <h3 className="text-lg font-bold mb-4">אקורדים לשיר "בוכה אל הקירות" - דויד ברוזה</h3>
          <div className="space-y-4 text-base leading-relaxed">
            <div className="mb-4">
              <p className="mb-2">Bm A G G A x2</p>
              <p className="mb-2">A    G     A                      Bm</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">F#m              A         Bm</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">Bm                     Em</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">                     A      G             A</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2"> A                  D</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">A               G</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">D</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2"> A      G                A</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">      A                Bm</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">A           G         A       D</p>
              <p className="mb-2">איורו איורו ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">ובוכה אל הקירות</p>
            </div>
            <div className="mb-4">
              <p className="mb-2">Bm A F#m Bm x2</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="mt-8">
          {/* Tab Switcher */}
          <div className="mb-8 border-b border-black">
            <div className="flex">
              <button
                onClick={() => setIsSignUp(false)}
                className={`px-4 py-2 font-medium border-b-2 ${
                  !isSignUp ? 'border-black font-bold' : 'border-transparent'
                }`}
              >
                כניסה
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`px-4 py-2 font-medium border-b-2 ${
                  isSignUp ? 'border-black font-bold' : 'border-transparent'
                }`}
              >
                הרשמה
              </button>
            </div>
          </div>

          {/* Login/SignUp Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-5">
            {/* Username Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setMessage("");
                }}
                placeholder="הכנס שם משתמש"
                className="w-full px-4 py-2 border border-black text-left"
                dir="ltr"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">סיסמה</label>
                {!isSignUp && (
                  <button type="button" className="text-xs underline">
                    שכחת סיסמה?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-black text-left"
                  dir="ltr"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={isSignUp ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-2 text-sm underline"
                >
                  {showPassword ? 'הסתר' : 'הצג'}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (only for sign up) */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setMessage("");
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-black text-left"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-2 top-2 text-sm underline"
                  >
                    {showConfirmPassword ? 'הסתר' : 'הצג'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {message && (
              <p className={`text-sm text-center ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-black text-white font-medium border border-black hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (isSignUp ? "נרשם..." : "מתחבר...") : (isSignUp ? "הרשמה" : "התחבר")}
            </button>
          </form>

          {/* Terms */}
          {!isSignUp && (
            <div className="mt-8 text-center text-sm">
              <p>
                אין לך חשבון?{' '}
                <button 
                  onClick={() => setIsSignUp(true)}
                  className="underline"
                >
                  הרשמה
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
