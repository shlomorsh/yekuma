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
        } else {
            // Keep the line as is (including empty lines for paragraph breaks)
            currentContent.push(line);
        }
    }

    if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}

// Helper function to render markdown-like text
function renderText(text: string) {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    return paragraphs.map((paragraph, pIdx) => {
        // Split by single newlines to handle line breaks within paragraphs
        const lines = paragraph.split('\n').filter(l => l.trim());
        
        return (
            <div key={pIdx} className="mb-4 last:mb-0">
                {lines.map((line, lIdx) => {
                    // Handle bold markdown (**text**)
                    const parts: (string | React.ReactElement)[] = [];
                    const boldRegex = /\*\*(.+?)\*\*/g;
                    const matches = Array.from(line.matchAll(boldRegex));
                    
                    if (matches.length === 0) {
                        // No bold found, just return the line
                        return (
                            <p key={lIdx} className="mb-2 last:mb-0 leading-relaxed">
                                {line}
                            </p>
                        );
                    }
                    
                    let lastIndex = 0;
                    matches.forEach((match, mIdx) => {
                        // Add text before the bold
                        if (match.index !== undefined && match.index > lastIndex) {
                            parts.push(line.substring(lastIndex, match.index));
                        }
                        // Add bold text
                        if (match.index !== undefined) {
                            parts.push(
                                <strong key={mIdx} className="font-bold text-white">
                                    {match[1]}
                                </strong>
                            );
                            lastIndex = match.index + match[0].length;
                        }
                    });
                    // Add remaining text
                    if (lastIndex < line.length) {
                        parts.push(line.substring(lastIndex));
                    }
                    
                    return (
                        <p key={lIdx} className="mb-2 last:mb-0 leading-relaxed">
                            {parts}
                        </p>
                    );
                })}
            </div>
        );
    });
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
    const [activeTab, setActiveTab] = useState<'content' | 'references'>('content');

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


    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading && !item) {
        return (
            <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
                <div className="spinner spinner-large" />
            </div>
        );
    }

    if (!loading && !item) {
        return (
            <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl mb-4">פריט לא נמצא</p>
                    <Link href="/universe" className="text-[#ec6d13] hover:underline">
                        חזרה ליקום
                    </Link>
                </div>
            </div>
        );
    }

    if (!item) return null;

    const contentSections = parseContent(item.content);
    const isEioro = item.title === 'אקורדים איורו';

    return (
        <div className="min-h-screen bg-[#120e0b] text-white relative overflow-x-hidden pb-24">
            {/* Scanlines overlay */}
            <div className="scanlines fixed inset-0 z-50 opacity-20 pointer-events-none" />
            
            {/* Navigation Bar */}
            <nav className="app-bar flex items-center justify-between">
                <Link href="/universe" className="btn-icon">
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-extrabold tracking-tight uppercase">
                        <span className="text-[#ec6d13]">יקו</span>מות
                    </h1>
                </div>
                {user && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn-icon"
                    >
                        <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
                    </button>
                )}
            </nav>

            {/* Header */}
            <header className="px-4 pt-6 pb-4">
                <div className="flex items-start gap-4">
                    {item.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <Image
                                src={item.image_url}
                                alt={item.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-bold truncate">{item.title}</h1>
                        </div>
                        {item.description && (
                            <p className="text-white/70 text-sm line-clamp-2 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-white/50">
                            <span>{item.view_count || 0} צפיות</span>
                            {item.verified && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-green-500">
                                        <span className="material-symbols-outlined text-[12px]">verified</span>
                                        מאומת
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="sticky top-[69px] z-30 bg-[#120e0b] pt-2">
                <div className="tabs px-4">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                    >
                        תוכן
                    </button>
                    <button
                        onClick={() => setActiveTab('references')}
                        className={`tab ${activeTab === 'references' ? 'active' : ''}`}
                    >
                        אזכורים ({references.length})
                    </button>
                </div>
                <div className="h-4 bg-gradient-to-b from-[#120e0b] to-transparent opacity-50 pointer-events-none" />
            </div>

            <main className="px-4 py-4 space-y-6">
                {/* Content Tab */}
                {activeTab === 'content' && (
                    <>
                        {isEditing ? (
                            <section className="surface-card p-4">
                                <h2 className="text-lg font-bold mb-4">עריכת תוכן</h2>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={15}
                                    className="input-field font-mono text-sm"
                                    placeholder="הכנס תוכן כאן..."
                                />
                                <div className="flex gap-3 mt-4">
                                    <button onClick={handleSaveEdit} className="btn-primary flex-1">שמור</button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditContent(item.content || '');
                                        }}
                                        className="btn-secondary flex-1"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </section>
                        ) : isEioro ? (
                            // Special rendering for Eioro Chords
                            <section className="surface-card p-8">
                                <div style={{ fontFamily: 'var(--font-heebo)', whiteSpace: 'pre', textAlign: 'right', color: '#FFFFFF', fontSize: '1rem', lineHeight: '1.1' }}>
                                    {Object.entries(contentSections).map(([section, content]) => {
                                        const lines = content.split('\n').filter(line => line.trim());
                                        return (
                                            <div key={section}>
                                                {section !== 'פתיחה' && section !== 'סיום אקורדים' && (
                                                    <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{section}:</div>
                                                )}
                                                {lines.map((line, i) => {
                                                    const hasHebrew = /[\u0590-\u05FF]/.test(line);
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
                            </section>
                        ) : (
                            <section className="space-y-4">
                                {item.image_url && (
                                    <div className="surface-card p-4">
                                        <div className="relative w-full aspect-video">
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {Object.keys(contentSections).length > 0 ? (
                                    <div className="space-y-6">
                                        {Object.entries(contentSections).map(([section, content]) => (
                                            <div key={section} className="surface-card p-6">
                                                <h3 className="text-xl font-bold mb-4 text-[#ec6d13] border-b border-[#ec6d13]/30 pb-2">
                                                    {section}
                                                </h3>
                                                <div className="text-white/90 text-base leading-relaxed">
                                                    {renderText(content)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="surface-card p-4 text-center">
                                        <p className="text-white/50">אין תוכן עדיין. {user && 'לחץ על "ערוך" כדי להוסיף תוכן.'}</p>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}

                {/* References Tab */}
                {activeTab === 'references' && (
                    <section className="space-y-3">
                        {references.length > 0 ? (
                            references.map((ref) => (
                                <Link
                                    key={ref.id}
                                    href={`/chapter/${ref.chapter_id}?ref=${ref.id}&time=${ref.timestamp}`}
                                    target="_blank"
                                    className="reference-card block"
                                >
                                    <div className="shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium leading-snug">{ref.title}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="badge">{formatTime(ref.timestamp)}</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-white/40 text-lg">chevron_left</span>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 text-white/40">
                                אין רפרנסים מקושרים עדיין
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* FAB for editing */}
            {user && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="fab"
                >
                    <span className="material-symbols-outlined text-[28px]">edit_note</span>
                </button>
            )}

            {/* Delete Button (only for creator) */}
            {user && item.created_by === user.id && (
                <button
                    onClick={handleDeleteItem}
                    className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-[#1e1a17] border border-[#ef4444]/30 text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444]/10 transition-all z-30"
                >
                    <span className="material-symbols-outlined text-[24px]">delete</span>
                </button>
            )}
        </div>
    );
}
