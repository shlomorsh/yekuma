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
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="fixed w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" style={{ left: '50%', top: '20%', transform: 'translate(-50%, -50%)' }} />
      <div className="fixed w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" style={{ left: '30%', top: '70%', transform: 'translate(-50%, -50%)' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 shadow-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              התחברות
            </h1>
            <p className="text-zinc-400">התחבר כדי להוסיף תוכן ולצבור נקודות</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {message && (
              <p className={`text-sm text-center ${message.includes("בדוק") ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? "שולח..." : "שלח קישור התחברות"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            <p>נשלח לך קישור התחברות באימייל</p>
            <p className="mt-2">לחץ על הקישור כדי להתחבר</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

