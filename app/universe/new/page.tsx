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
        item_type: 'program' as 'program' | 'advertisement' | 'concept',
        channel: '', // ערוץ (לתכניות)
        air_time: '', // זמן שידור (לתכניות)
        host: '', // מנחה (לתכניות)
        product: '', // מוצר (לפרסומות)
        company: '', // חברה (לפרסומות)  
        explanation: '', // הסבר (למושגים)
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

            // Build content from form fields based on type
            let content = `# ${formData.title}\n\n`;

            if (formData.description) {
                content += `## תיאור\n${formData.description}\n\n`;
            }

            // Add type-specific fields
            if (formData.item_type === 'program') {
                if (formData.channel) content += `## ערוץ\n${formData.channel}\n\n`;
                if (formData.air_time) content += `## זמן שידור\n${formData.air_time}\n\n`;
                if (formData.host) content += `## מנחה\n${formData.host}\n\n`;
            } else if (formData.item_type === 'advertisement') {
                if (formData.product) content += `## מוצר\n${formData.product}\n\n`;
                if (formData.company) content += `## חברה\n${formData.company}\n\n`;
            } else if (formData.item_type === 'concept') {
                if (formData.explanation) content += `## הסבר\n${formData.explanation}\n\n`;
            }

            const { data, error } = await supabase
                .from('universe_items')
                .insert([{
                    title: formData.title,
                    description: formData.description || null,
                    item_type: formData.item_type,
                    content: content,
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
                reason: `יצירת ${getTypeLabel(formData.item_type)} חדש`
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

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'program':
                return 'תכנית';
            case 'advertisement':
                return 'פרסומת';
            case 'concept':
                return 'מושג';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'program':
                return '#008C9E';
            case 'advertisement':
                return '#FF6B00';
            case 'concept':
                return '#D62828';
            default:
                return '#FFFFFF';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
                <div className="text-center">
                    <p className="text-xl mb-4" style={{ color: '#FFFFFF' }}>אתה צריך להתחבר כדי ליצור פריט</p>
                    <Link href="/" className="btn-link" style={{ fontFamily: 'var(--font-mono)' }}>
                        חזרה לדף הבית
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link href="/universe" className="wireframe-border px-3 py-1 mb-6 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    ← חזרה ליקום
                </Link>

                <h1 className="text-4xl font-bold mb-8 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                    הוסף פריט חדש ליקום
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div className="wireframe-border p-6 bg-transparent">
                        <label className="block text-sm font-medium mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                            סוג הפריט <span style={{ color: '#D62828' }}>*</span>
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, item_type: 'program' })}
                                className={`flex-1 wireframe-border px-4 py-3 transition-colors ${formData.item_type === 'program' ? 'bg-white/10' : ''}`}
                                style={{ color: formData.item_type === 'program' ? getTypeColor('program') : '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                            >
                                תכנית
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, item_type: 'advertisement' })}
                                className={`flex-1 wireframe-border px-4 py-3 transition-colors ${formData.item_type === 'advertisement' ? 'bg-white/10' : ''}`}
                                style={{ color: formData.item_type === 'advertisement' ? getTypeColor('advertisement') : '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                            >
                                פרסומת
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, item_type: 'concept' })}
                                className={`flex-1 wireframe-border px-4 py-3 transition-colors ${formData.item_type === 'concept' ? 'bg-white/10' : ''}`}
                                style={{ color: formData.item_type === 'concept' ? getTypeColor('concept') : '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                            >
                                מושג
                            </button>
                        </div>
                    </div>

                    {/* Title */}
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
                            placeholder="שם הפריט"
                        />
                    </div>

                    {/* Description */}
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
                            placeholder="תיאור קצר"
                        />
                    </div>

                    {/* Type-specific fields */}
                    {formData.item_type === 'program' && (
                        <>
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
                        </>
                    )}

                    {formData.item_type === 'advertisement' && (
                        <>
                            <div className="wireframe-border p-6 bg-transparent">
                                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                    מוצר
                                </label>
                                <input
                                    type="text"
                                    value={formData.product}
                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                    className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
                                    style={{ fontFamily: 'var(--font-heebo)' }}
                                    placeholder="מה המוצר המפורסם?"
                                />
                            </div>

                            <div className="wireframe-border p-6 bg-transparent">
                                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                    חברה
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none"
                                    style={{ fontFamily: 'var(--font-heebo)' }}
                                    placeholder="איזו חברה מפרסמת?"
                                />
                            </div>
                        </>
                    )}

                    {formData.item_type === 'concept' && (
                        <div className="wireframe-border p-6 bg-transparent">
                            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                הסבר
                            </label>
                            <textarea
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                rows={5}
                                className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none resize-none"
                                style={{ fontFamily: 'var(--font-heebo)' }}
                                placeholder="מה המשמעות של המושג הזה?"
                            />
                        </div>
                    )}

                    {/* Image Upload */}
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

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 control-panel-btn disabled:opacity-50"
                        >
                            {loading ? 'יוצר...' : `צור ${getTypeLabel(formData.item_type)}`}
                        </button>
                        <Link
                            href="/universe"
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
