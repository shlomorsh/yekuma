"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function NewCharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: ''
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/');
        return;
      }
      setUser(session.user);
    };
    checkSession();
  }, [router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      alert('אנא הכנס כותרת');
      return;
    }

    if (!formData.image_url.trim()) {
      alert('אנא הכנס כתובת תמונה');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .insert([{
          title: formData.title,
          image_url: formData.image_url,
          created_by: user.id,
          updated_by: user.id
        }])
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('דמות עם שם זה כבר קיימת');
        } else {
          alert('שגיאה ביצירת דמות: ' + error.message);
        }
        return;
      }

      // Award points
      await supabase.rpc('award_wiki_points', {
        user_id_param: user.id,
        points_to_add: 10,
        reason: 'יצירת דמות חדשה'
      });

      alert('הדמות נוצרה בהצלחה! קיבלת 10 נקודות.');
      router.push(`/characters/${data.id}`);
    } catch (err) {
      console.error('Error creating character:', err);
      alert('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-zinc-400 mb-4">אתה צריך להתחבר כדי ליצור דמות</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">חזרה לדף הבית</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/characters" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← חזרה לדמויות
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          הוסף דמות חדשה
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              כותרת <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="שם הדמות"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              כתובת תמונה <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image_url && (
              <div className="mt-4 relative w-full h-64 rounded-lg overflow-hidden border border-zinc-700">
                <Image
                  src={formData.image_url}
                  alt="תצוגה מקדימה"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3Eתמונה לא זמינה%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור דמות'}
            </button>
            <Link
              href="/characters"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
            >
              ביטול
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

