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
                    <div className="spinner spinner-large mb-4 mx-auto"></div>
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
                    <Link href="/universe" className="btn-link" style={{ fontFamily: 'var(--font-mono)' }}>
                        חזרה ליקום
                    </Link>
                </div>
            </div>
        );
    }

    if (!item) return null;

    const contentSections = parseContent(item.content);
    const typeColor = getTypeColors(item.item_type);
    const isEioro = item.title === 'אקורדים איורו';

    return (
        <div className="min-h-screen bg-black text-white" dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <Link href="/universe" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        ← חזרה ליקום
                    </Link>
                    
                    {/* Banner Image for Eioro */}
                    {isEioro && item.image_url && (
                        <div className="mb-8 wireframe-border overflow-hidden">
                            <div className="relative w-full" style={{ height: '300px' }}>
                                <Image
                                    src={item.image_url}
                                    alt="דייויד ברוזה - איורו"
                                    fill
                                    className="object-contain"
                                    style={{ objectPosition: 'center' }}
                                />
                            </div>
                        </div>
                    )}

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

                <div className="space-y-6">
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
                    ) : isEioro ? (
                        // Special rendering for Eioro Chords
                        <div className="wireframe-border p-8 bg-transparent mb-8">
                            <div className="mb-8" style={{ fontFamily: 'var(--font-heebo)', whiteSpace: 'pre', textAlign: 'right', color: '#FFFFFF', fontSize: '1rem', lineHeight: '1.1' }}>
                                {Object.entries(contentSections).map(([section, content]) => {
                                    const lines = content.split('\n').filter(line => line.trim());
                                    return (
                                        <div key={section}>
                                            {section !== 'פתיחה' && section !== 'סיום אקורדים' && (
                                                <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{section}:</div>
                                            )}
                                            {lines.map((line, i) => {
                                                // Check if line contains Hebrew characters
                                                const hasHebrew = /[\u0590-\u05FF]/.test(line);
                                                // Check if line contains only chords (letters, numbers, #, m, /, spaces)
                                                const chordPattern = new RegExp('^[A-Ga-g#mb0-9\\s/x]+$');
                                                const isChordLine = !hasHebrew && chordPattern.test(line.trim());
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        style={{ 
                                                            marginBottom: isChordLine ? '0.25rem' : '1rem',
                                                            textAlign: 'right'
                                                        }}
                                                    >
                                                        {line}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Banner Image for other items */}
                            {item.image_url && !isEioro && (
                                <div className="wireframe-border p-4 bg-transparent">
                                    <div className="relative w-full" style={{ height: item.title === 'לימוד איטלקית' ? '300px' : '400px' }}>
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-contain"
                                            style={{ objectPosition: 'center' }}
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
                                            {item.title === 'לימוד איטלקית' && section === 'מילה' ? (
                                                <div className="text-right space-y-4" style={{ fontFamily: 'var(--font-heebo)' }}>
                                                    <div className="wireframe-border p-6 bg-transparent">
                                                        <div className="text-3xl font-bold mb-2" style={{ color: '#FFFFFF' }}>POKITO</div>
                                                        <div className="text-2xl" style={{ color: '#FFFFFF', opacity: 0.8 }}>= פוקיטו</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                                    {content.split('\n').map((line, i) => (
                                                        <p key={i} style={{ opacity: 0.9, lineHeight: '1.8' }}>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
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
            </div>
        </div>
    );
}
