"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);

  // Helper function to convert username to email
  const usernameToEmail = (username: string) => {
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      cleanUsername = 'user' + Math.random().toString(36).substring(2, 9);
    }
    return `${cleanUsername}@yekumot.app`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage("אנא הכנס שם משתמש");
      return;
    }

    if (!password.trim()) {
      setMessage("אנא הכנס סיסמה");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const email = usernameToEmail(username);
      
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
        setMessage("התחברת בהצלחה! מעביר...");
        router.push("/");
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="wireframe-border p-8 bg-transparent">
          <div className="mb-6 text-center">
            <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-3xl font-bold mb-2 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
              התחברות
            </h1>
            <p className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-mono)' }}>
              אין לך חשבון? <Link href="/contract" className="underline" style={{ color: '#008C9E' }}>הירשם כאן</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
                minLength={6}
              />
            </div>

            {message && (
              <p className={`text-sm text-center text-right ${message.includes("הצלח") || message.includes("מתחבר") ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full control-panel-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "מתחבר..." : "התחבר"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
