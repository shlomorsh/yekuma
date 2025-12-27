"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);

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
    
    if (!email.trim()) {
      setMessage("אנא הכנס כתובת אימייל");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Always use production URL for magic link redirect
      // This ensures the link works even if sent from localhost
      const redirectUrl = 'https://yekuma.vercel.app/';

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setMessage('שגיאה בשליחת קישור: ' + error.message);
        return;
      }

      setMessage("בדוק את האימייל שלך לקבלת קישור ההתחברות!");
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
                כתובת אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage("");
                }}
                placeholder="הכנס את כתובת האימייל שלך"
                className="w-full bg-black wireframe-border px-4 py-3 text-white focus:outline-none"
                style={{ fontFamily: 'var(--font-heebo)' }}
                required
              />
            </div>

            {message && (
              <p className={`text-sm text-center ${message.includes("בדוק") ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full control-panel-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "שולח..." : "שלח קישור התחברות"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            <p>נשלח לך קישור התחברות באימייל</p>
            <p className="mt-2">לחץ על הקישור כדי להתחבר</p>
          </div>
        </div>
      </div>
    </div>
  );
}
