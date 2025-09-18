
'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';
import type { AppUser } from '@/app/messages/types';
import { getClassMaterials, type ClassMaterial } from './actions';
import { NewMaterialDialog } from '@/components/new-material-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { MaterialViewer } from '@/components/material-viewer';
import { DeleteMaterialButton } from '@/components/delete-material-button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function MaterialsPageContent({ currentUser, initialMaterials }: { currentUser: AppUser, initialMaterials: ClassMaterial[] }) {
    const [selectedMaterial, setSelectedMaterial] = useState<ClassMaterial | null>(null);

    const publishedMaterials = initialMaterials.filter(m => m.is_published);
    const draftMaterials = currentUser.role === 'teacher' ? initialMaterials.filter(m => !m.is_published) : [];

    const materialsToShow = currentUser.role === 'teacher' ? initialMaterials : publishedMaterials;

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Class Materials</h1>
                    <p className="text-muted-foreground">Browse slides and important content from your classes.</p>
                </div>
                {currentUser.role === 'teacher' && (
                    <NewMaterialDialog />
                )}
            </div>

            {materialsToShow.length === 0 ? (
                <Card>
                    <CardContent className="py-24">
                        <div className="text-center text-muted-foreground">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No class materials have been posted yet.</p>
                        {currentUser.role === 'teacher' && <p className="text-sm">Click "New Material" to get started.</p>}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {materialsToShow.map(material => (
                        <Card key={material.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="line-clamp-2">{material.title}</CardTitle>
                                <CardDescription>{material.topic || 'General'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {currentUser.role === 'teacher' && !material.is_published && (
                                     <Badge variant="outline">Draft</Badge>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    {material.is_published ? `Published on ${format(new Date(material.created_at), 'MMM d, yyyy')}` : `Created on ${format(new Date(material.created_at), 'MMM d, yyyy')}`}
                                </div>
                                <div className="flex items-center">
                                    <Button variant="secondary" size="sm" onClick={() => setSelectedMaterial(material)}>
                                        <Eye className="mr-2 h-4 w-4" /> View
                                    </Button>
                                    {currentUser.role === 'teacher' && (
                                        <>
                                            <NewMaterialDialog material={material}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </NewMaterialDialog>
                                            <DeleteMaterialButton materialId={material.id} />
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            {selectedMaterial && (
                <MaterialViewer 
                    material={selectedMaterial} 
                    open={!!selectedMaterial} 
                    onOpenChange={(isOpen) => { if (!isOpen) setSelectedMaterial(null); }} 
                />
            )}
        </>
    );
}


export default function MaterialsPageWrapper() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [materials, setMaterials] = useState<ClassMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const role = user.user_metadata?.role || 'student';
            const name = user.user_metadata?.full_name || user.email;

            const appUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: generateAvatarUrl(name),
            };
            
            setCurrentUser(appUser);
            
            const fetchedMaterials = await getClassMaterials();
            setMaterials(fetchedMaterials);
            setLoading(false);
        };
        
        fetchData();

    }, [supabase, router]);


    if (loading || !currentUser) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
              <div>Loading...</div>
            </div>
        )
    }

    return (
        <AppLayout user={currentUser}>
            <Suspense fallback={
                <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] bg-background items-center justify-center">
                    <div>Loading materials...</div>
                </div>
            }>
                <MaterialsPageContent currentUser={currentUser} initialMaterials={materials} />
            </Suspense>
        </AppLayout>
    )
}
