"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/app/components/ImageUploader";

export default function NewProgramPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    channel: '', // ערוץ
    air_time: '', // זמן שידור
    host: '', // מנחה
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
      alert('אנא העלה תמונה');
      return;
    }

    try {
      setLoading(true);
      
      // Build content from form fields
      const content = `# ${formData.title}

${formData.description ? `## תיאור\n${formData.description}\n` : ''}
${formData.channel ? `## ערוץ\n${formData.channel}\n` : ''}
${formData.air_time ? `## זמן שידור\n${formData.air_time}\n` : ''}
${formData.host ? `## מנחה\n${formData.host}\n` : ''}
`;

      const { data, error } = await supabase
        .from('programs')
        .insert([{
          title: formData.title,
          description: formData.description || null,
          content: content,
          image_url: formData.image_url,
          created_by: user.id,
          updated_by: user.id
        }])
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('תכנית עם שם זה כבר קיימת');
        } else {
          alert('שגיאה ביצירת תכנית: ' + error.message);
        }
        return;
      }

      await supabase.rpc('award_wiki_points', {
        user_id_param: user.id,
        points_to_add: 10,
        reason: 'יצירת תכנית חדשה'
      });

      alert('התכנית נוצרה בהצלחה! קיבלת 10 נקודות.');
      router.push(`/programs/${data.id}`);
    } catch (err) {
      console.error('Error creating program:', err);
      alert('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#FFFFFF' }}>אתה צריך להתחבר כדי ליצור תכנית</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-mono)' }}>
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/programs" className="wireframe-border px-3 py-1 mb-6 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
          ← חזרה לתכניות
        </Link>

        <h1 className="text-4xl font-bold mb-8 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
          הוסף תכנית חדשה
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              כותרת <span style={{ color: '#D62828' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
              style={{ fontFamily: 'var(--font-heebo)' }}
              placeholder="שם התכנית"
            />
          </div>

          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              תיאור קצר
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none resize-none"
              style={{ fontFamily: 'var(--font-heebo)' }}
              placeholder="תיאור קצר של התכנית"
            />
          </div>

          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ערוץ
            </label>
            <input
              type="text"
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
              style={{ fontFamily: 'var(--font-heebo)' }}
              placeholder="איזה ערוץ משדר את התכנית?"
            />
          </div>

          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              זמן שידור
            </label>
            <input
              type="text"
              value={formData.air_time}
              onChange={(e) => setFormData({ ...formData, air_time: e.target.value })}
              className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
              style={{ fontFamily: 'var(--font-heebo)' }}
              placeholder="מתי התכנית משודרת?"
            />
          </div>

          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              מנחה
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
              style={{ fontFamily: 'var(--font-heebo)' }}
              placeholder="מי מנחה את התכנית?"
            />
          </div>

          <div className="wireframe-border p-6 bg-transparent">
            <label className="block text-sm font-medium mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              תמונה <span style={{ color: '#D62828' }}>*</span>
            </label>
            <ImageUploader
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              aspectRatio={1}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 control-panel-btn disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור תכנית'}
            </button>
            <Link
              href="/programs"
              className="flex-1 wireframe-border px-6 py-3 text-center text-white hover:bg-white/10 transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ביטול
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
