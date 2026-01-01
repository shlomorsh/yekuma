"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/app/components/ImageUploader";

export default function NewUniverseItemPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
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

            const { data, error } = await supabase
                .from('universe_items')
                .insert([{
                    title: formData.title,
                    description: formData.description || null,
                    content: formData.content || null,
                    image_url: formData.image_url,
                    created_by: user.id,
                    updated_by: user.id
                }])
                .select('id')
                .single();

            if (error) {
                if (error.code === '23505') {
                    alert('פריט עם שם זה כבר קיים');
                } else {
                    alert('שגיאה ביצירת פריט: ' + error.message);
                }
                return;
            }

            await supabase.rpc('award_wiki_points', {
                user_id_param: user.id,
                points_to_add: 10,
                reason: 'יצירת פריט יקום חדש'
            });

            alert('הפריט נוצר בהצלחה! קיבלת 10 נקודות.');
            router.push(`/universe/${data.id}`);
        } catch (err) {
            console.error('Error creating universe item:', err);
            alert('שגיאה בלתי צפויה');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl mb-4">אתה צריך להתחבר כדי ליצור פריט</p>
                    <Link href="/" className="btn-link">
                        חזרה לדף הבית
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#120e0b] text-white" dir="rtl">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link href="/universe" className="btn-icon mb-6 inline-flex">
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>

                <h1 className="text-4xl font-bold mb-8">הוסף פריט חדש ליקום</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="surface-card p-6">
                        <label className="block text-sm font-bold mb-2">
                            כותרת <span className="text-[#ef4444]">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="input-field"
                            placeholder="שם הפריט"
                        />
                    </div>

                    {/* Description */}
                    <div className="surface-card p-6">
                        <label className="block text-sm font-bold mb-2">
                            תיאור קצר
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="input-field"
                            placeholder="תיאור קצר"
                        />
                    </div>

                    {/* Content */}
                    <div className="surface-card p-6">
                        <label className="block text-sm font-bold mb-2">
                            תוכן
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={10}
                            className="input-field font-mono text-sm"
                            placeholder="תוכן מפורט (Markdown)"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="surface-card p-6">
                        <label className="block text-sm font-bold mb-4">
                            תמונה <span className="text-[#ef4444]">*</span>
                        </label>
                        <ImageUploader
                            value={formData.image_url}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                            aspectRatio={1}
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'יוצר...' : 'צור פריט'}
                        </button>
                        <Link
                            href="/universe"
                            className="flex-1 btn-secondary text-center"
                        >
                            ביטול
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
