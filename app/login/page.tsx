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

  // Helper function to convert username to email (same as in contract page)
  const usernameToEmail = (username: string) => {
    // Clean username: remove spaces, special chars, and convert to lowercase
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    // Ensure username is not empty after cleaning
    if (!cleanUsername) {
      cleanUsername = 'user' + Math.random().toString(36).substring(2, 9);
    }
    // Use a valid domain format
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

      // Success - will redirect via useEffect
      router.push("/");
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
          <div className="text-center mb-8">
            <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-4xl font-bold mb-2 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
              התחברות
            </h1>
            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
              התחבר כדי להוסיף תוכן ולצבור נקודות
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                שם משתמש
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setMessage("");
                }}
                placeholder="הכנס את שם המשתמש שלך"
                className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none"
                style={{ fontFamily: 'var(--font-heebo)' }}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage("");
                }}
                placeholder="הכנס את הסיסמה שלך"
                className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none"
                style={{ fontFamily: 'var(--font-heebo)' }}
                required
                autoComplete="current-password"
              />
            </div>

            {message && (
              <p className={`text-sm text-center ${message.includes("הצלח") ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: 'var(--font-mono)' }}>
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

          <div className="mt-6 text-center text-sm" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            <p>אין לך חשבון?</p>
            <Link href="/contract" className="text-blue-400 hover:text-blue-300 underline">
              הרשמה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
