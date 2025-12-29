"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  // Redirect to contract page
  useEffect(() => {
    router.push("/contract");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="wireframe-border p-8 bg-transparent text-center">
          <div className="mb-8">
            <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-4xl font-bold mb-2 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
              מעביר לדף החוזה...
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
