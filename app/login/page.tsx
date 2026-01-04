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
    <div className="min-h-screen bg-[#120e0b] text-white relative overflow-hidden">
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
        <Link 
          href="/" 
          className="btn-icon"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {/* Hero Header with Background */}
      <div className="relative w-full h-[35vh] min-h-[280px] flex flex-col justify-end">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80')` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#120e0b]/30 via-[#120e0b]/60 to-[#120e0b]" />
          <div className="absolute inset-0 bg-[#FFFFFF]/10 mix-blend-overlay" />
        </div>
        
        <div className="relative z-10 px-6 pb-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-2 drop-shadow-lg">יקומות</h1>
          
          {/* Chord decoration */}
          <div className="mt-6 mb-2 flex flex-col items-center justify-center opacity-90">
            <p className="text-[10px] text-[#FFFFFF]/60 tracking-[0.2em] mb-1 font-bold uppercase">שיר פתיחה</p>
            <div className="flex items-baseline gap-6 text-[#FFFFFF] text-xl font-bold tracking-wider relative px-4 py-2 rounded-lg bg-[#1e1a17]/30 border border-white/5 backdrop-blur-sm" style={{ fontFamily: 'var(--font-heebo)' }}>
              <span className="hover:text-white transition-colors cursor-default">Am</span>
              <span className="hover:text-white transition-colors cursor-default">F</span>
              <span className="hover:text-white transition-colors cursor-default">C</span>
              <span className="hover:text-white transition-colors cursor-default">G</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-8 max-w-md mx-auto w-full z-10 relative">
        {/* Tab Switcher */}
        <div className="mb-8">
          <div className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1e1a17] p-1 border border-white/5">
            <button
              onClick={() => setIsSignUp(false)}
              className={`relative flex h-full flex-1 items-center justify-center rounded-lg px-2 text-sm font-bold transition-all ${
                !isSignUp ? 'bg-[#FFFFFF] text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              כניסה
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`relative flex h-full flex-1 items-center justify-center rounded-lg px-2 text-sm font-bold transition-all ${
                isSignUp ? 'bg-[#FFFFFF] text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              הרשמה
            </button>
          </div>
        </div>

        {/* Login/SignUp Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-5">
          {/* Username Field */}
          <div className="group">
            <label className="block text-white/90 text-sm font-bold mb-2 pr-1">שם משתמש</label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#FFFFFF] transition-colors">
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
            <div className="flex justify-between items-center mb-2 pr-1">
              <label className="block text-white/90 text-sm font-bold">סיסמה</label>
              {!isSignUp && (
                <button type="button" className="text-xs text-[#FFFFFF] hover:text-white transition-colors font-medium">
                  שכחת סיסמה?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#FFFFFF] transition-colors">
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
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 6 : undefined}
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

          {/* Confirm Password Field (only for sign up) */}
          {isSignUp && (
            <div className="group">
              <label className="block text-white/90 text-sm font-bold mb-2 pr-1">אימות סיסמה</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-white/40 group-focus-within:text-[#FFFFFF] transition-colors">
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
          )}

          {/* Error Message */}
          {message && (
            <p className={`text-sm text-center ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-400" : "text-[#ef4444]"}`}>
              {message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4 py-4 text-base group"
          >
            <span>{loading ? (isSignUp ? "נרשם..." : "מתחבר...") : (isSignUp ? "הרשמה" : "התחבר ליקום")}</span>
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform rtl:rotate-180">
              arrow_right_alt
            </span>
          </button>
        </form>

        {/* Social Login Divider */}
        <div className="mt-8">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink-0 mx-4 text-white/40 text-xs font-medium">או התחבר באמצעות</span>
            <div className="flex-grow border-t border-white/10" />
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            {/* Google */}
            <button className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1e1a17] border border-white/5 hover:bg-white/5 hover:border-white/20 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Terms */}
        {!isSignUp && (
          <div className="mt-auto pt-8 text-center">
            <p className="text-xs text-white/30">
              אין לך חשבון?{' '}
              <button 
                onClick={() => setIsSignUp(true)}
                className="text-[#FFFFFF] hover:underline transition-colors"
              >
                הרשמה
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
