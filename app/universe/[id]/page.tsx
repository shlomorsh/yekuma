"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface UniverseItem {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    image_url: string | null;
    item_type: 'program' | 'advertisement' | 'concept';
    view_count: number;
    verified: boolean;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

interface Reference {
    id: string;
    timestamp: number;
    title: string;
    chapter_id: string;
}

function parseContent(content: string | null) {
    if (!content) return {};

    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            currentSection = line.replace('## ', '').trim();
            currentContent = [];
        } else if (line.startsWith('# ')) {
            continue;
        } else if (line.trim()) {
            currentContent.push(line.trim());
        }
    }

    if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}

export default function UniverseItemPage() {
    const params = useParams();
    const router = useRouter();
    const itemId = params.id as string;
    const [item, setItem] = useState<UniverseItem | null>(null);
    const [references, setReferences] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
        };
        checkSession();
    }, []);

    useEffect(() => {
        const fetchItem = async () => {
            if (!itemId) return;

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('universe_items')
                    .select('*')
                    .eq('id', itemId)
                    .single();

                if (error) {
                    console.error('Error fetching universe item:', error);
                    setLoading(false);
                    return;
                }

                if (data) {
                    setItem(data);
                    setEditContent(data.content || '');

                    await supabase.rpc('increment_view_count', {
                        entity_type_param: 'universe_item',
                        entity_id_param: itemId
                    });

                    const { data: refConnections } = await supabase
                        .from('reference_connections')
                        .select('reference_id')
                        .eq('entity_type', 'universe_item')
                        .eq('entity_id', itemId);

                    if (refConnections && refConnections.length > 0) {
                        const refIds = refConnections.map(c => c.reference_id);
                        const { data: refsData } = await supabase
                            .from('references')
                            .select('id, timestamp, title, chapter_id')
                            .in('id', refIds);

                        if (refsData) {
                            setReferences(refsData as Reference[]);
                        }
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [itemId]);

    const handleSaveEdit = async () => {
        if (!user || !item) return;

        try {
            const { error } = await supabase
                .from('universe_items')
                .update({
                    content: editContent,
                    updated_by: user.id
                })
                .eq('id', itemId);

            if (error) {
                alert('שגיאה בשמירה: ' + error.message);
                return;
            }

            await supabase.rpc('award_wiki_points', {
                user_id_param: user.id,
                points_to_add: 2,
                reason: 'עריכת פריט יקום'
            });

            setItem({ ...item, content: editContent });
            setIsEditing(false);
            alert('העריכה נשמרה בהצלחה! קיבלת 2 נקודות.');
        } catch (err) {
            console.error('Error saving edit:', err);
            alert('שגיאה בשמירה');
        }
    };

    const handleDeleteItem = async () => {
        if (!user || !item) return;

        if (item.created_by !== user.id) {
            alert("אתה יכול למחוק רק פריטים שיצרת");
            return;
        }

        if (!confirm("האם אתה בטוח שברצונך למחוק את הפריט הזה? פעולה זו לא ניתנת לביטול.")) {
            return;
        }

        try {
            const { error } = await supabase
                .from('universe_items')
                .delete()
                .eq('id', itemId)
                .eq('created_by', user.id);

            if (error) {
                alert('שגיאה במחיקה: ' + error.message);
                return;
            }

            alert('הפריט נמחק בהצלחה!');
            router.push('/universe');
        } catch (err) {
            console.error('Error deleting item:', err);
            alert('שגיאה בלתי צפויה');
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

    const getTypeColors = (type: string) => {
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

    if (loading && !item) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>טוען פריט...</div>
                </div>
            </div>
        );
    }

    if (!loading && !item) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
                <div className="text-center">
                    <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>פריט לא נמצא</div>
                    <Link href="/universe" className="text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-mono)' }}>
                        חזרה ליקום
                    </Link>
                </div>
            </div>
        );
    }

    if (!item) return null;

    const contentSections = parseContent(item.content);
    const typeColor = getTypeColors(item.item_type);

    return (
        <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <Link href="/universe" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        ← חזרה ליקום
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-5xl font-bold glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                    {item.title}
                                </h1>
                                <span className="px-3 py-1 text-sm wireframe-border" style={{ color: typeColor, fontFamily: 'var(--font-mono)' }}>
                                    {getTypeLabel(item.item_type)}
                                </span>
                            </div>
                            {item.description && (
                                <p className="text-xl mb-4" style={{ color: '#FFFFFF', opacity: 0.7 }}>{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm" style={{ color: typeColor, fontFamily: 'var(--font-mono)' }}>
                                <span>{item.view_count || 0} צפיות</span>
                                {item.verified && (
                                    <span className="flex items-center gap-1" style={{ color: '#FF6B00' }}>
                                        <span>⭐</span>
                                        <span>מאומת</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        {user && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="control-panel-btn"
                                >
                                    {isEditing ? 'בטל עריכה' : 'ערוך'}
                                </button>
                                {item.created_by === user.id && (
                                    <button
                                        onClick={handleDeleteItem}
                                        className="wireframe-border px-6 py-3 bg-black text-red-400 hover:bg-red-400/10 transition-colors"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    >
                                        🗑️ מחק
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {isEditing ? (
                            <div className="wireframe-border p-6 bg-transparent">
                                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>עריכת תוכן</h2>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={20}
                                    className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none resize-none"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                    placeholder="הכנס תוכן כאן..."
                                />
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="control-panel-btn"
                                    >
                                        שמור
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditContent(item.content || '');
                                        }}
                                        className="wireframe-border px-6 py-2 bg-black text-white hover:bg-white/10 transition-colors"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {item.image_url && (
                                    <div className="wireframe-border p-4 bg-transparent">
                                        <div className="relative aspect-square w-full max-w-md mx-auto">
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                unoptimized={item.image_url.includes('youtube.com') || item.image_url.includes('img.youtube.com')}
                                            />
                                        </div>
                                    </div>
                                )}

                                {Object.keys(contentSections).length > 0 ? (
                                    <div className="space-y-6">
                                        {Object.entries(contentSections).map(([section, content]) => (
                                            <div key={section} className="wireframe-border p-6 bg-transparent">
                                                <h2 className="text-2xl font-bold mb-4 glitch-text" style={{ color: typeColor, fontFamily: 'var(--font-heebo)' }}>
                                                    {section}
                                                </h2>
                                                <div className="space-y-3" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                                    {content.split('\n').map((line, i) => (
                                                        <p key={i} style={{ opacity: 0.9, lineHeight: '1.8' }}>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="wireframe-border p-6 bg-transparent">
                                        <p style={{ color: '#FFFFFF', opacity: 0.7, fontFamily: 'var(--font-heebo)' }}>
                                            אין תוכן עדיין. {user && 'לחץ על "ערוך" כדי להוסיף תוכן.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {references.length > 0 && (
                            <div className="wireframe-border p-6 bg-transparent">
                                <h2 className="text-2xl font-bold mb-4 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                    רפרנסים קשורים
                                </h2>
                                <div className="space-y-2">
                                    {references.map((ref) => (
                                        <Link
                                            key={ref.id}
                                            href={`/chapter/${ref.chapter_id}?ref=${ref.id}&time=${ref.timestamp}`}
                                            target="_blank"
                                            className="block wireframe-border p-4 bg-transparent hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>{ref.title}</div>
                                                    <div className="text-sm" style={{ color: typeColor, fontFamily: 'var(--font-mono)' }}>
                                                        {Math.floor(ref.timestamp / 60)}:{(ref.timestamp % 60).toString().padStart(2, '0')}
                                                    </div>
                                                </div>
                                                <svg className="w-5 h-5" style={{ color: typeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        {item.image_url && (
                            <div className="wireframe-border p-4 bg-transparent">
                                <div className="relative aspect-square w-full">
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        unoptimized={item.image_url.includes('youtube.com') || item.image_url.includes('img.youtube.com')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
