"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 retro-shadow">
            404
          </h1>
        </div>

        <div className="surface-card p-8 mb-8">
          <p className="text-2xl md:text-3xl mb-4 leading-relaxed">
            מה אם אני אגיד לך שאתה בול עכשיו?
          </p>
          <p className="text-xl md:text-2xl leading-relaxed opacity-80">
            מה אם אני אגיד לך שאתה בול בדף עכשיו?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/" className="btn-primary">
            חזרה לדף הבית
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary"
          >
            חזרה אחורה
          </button>
        </div>
      </div>
    </div>
  );
}
