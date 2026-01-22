"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [nameTag, setNameTag] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const usernameToEmail = (username: string) => {
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      cleanUsername = 'user' + Math.random().toString(36).substring(2, 9);
    }
    return `${cleanUsername}@yekumot.app`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameTag.trim()) {
      setMessage("אנא הכנס name tag");
      return;
    }

    if (!password.trim()) {
      setMessage("אנא הכנס סיסמה");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const email = usernameToEmail(nameTag);

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMessage('שגיאה בהתחברות: ' + error.message);
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setResetMessage("אנא הכנס מייל");
      return;
    }

    try {
      setResetLoading(true);
      setResetMessage("");

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setResetMessage('שגיאה באיפוס סיסמה: ' + error.message);
        return;
      }

      setResetMessage("נשלח מייל לאיפוס סיסמה. אנא בדוק את תיבת הדואר שלך.");
    } catch (err) {
      console.error('Unexpected error:', err);
      setResetMessage('שגיאה בלתי צפויה');
    } finally {
      setResetLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" 
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-[#1e1a17] border border-white/10 p-6 shadow-2xl w-full max-w-md mx-4 rounded-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">התחברות</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                autoComplete="current-password"
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

          {/* Reset Password Button */}
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="text-xs text-[#ec6d13] hover:text-orange-400 transition-colors font-medium text-right disabled:opacity-50"
          >
            {resetLoading ? "שולח..." : "ריסט"}
          </button>

          {/* Error Message */}
          {message && (
            <p className="text-sm text-center text-[#ef4444]">
              {message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        {/* Reset Password Form (hidden by default, shown when clicking ריסט) */}
        {resetMessage && (
          <div className="mt-4 p-3 bg-white/5 rounded text-sm text-center">
            <p className={resetMessage.includes("נשלח") ? "text-green-400" : "text-[#ef4444]"}>
              {resetMessage}
            </p>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/50">
            להרשמה נא לחתום על החוזה{' '}
            <Link 
              href="/contract" 
              onClick={onClose}
              className="text-[#ec6d13] hover:underline transition-colors"
            >
              כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

