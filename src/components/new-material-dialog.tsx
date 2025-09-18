
"use client";

import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveMaterial, type ClassMaterial } from '@/app/materials/actions';
import { Loader2, PlusCircle } from 'lucide-react';
import { Switch } from './ui/switch';

interface NewMaterialDialogProps {
    material?: ClassMaterial;
    children?: React.ReactNode;
}

const defaultContent = `
<header>
  <h1>Your Slide Title</h1>
</header>
<section>
  <h2>Key Point 1</h2>
  <p>Explanation about the first key point. You can use <strong>strong</strong> or <em>emphasized</em> text.</p>
  <ul>
    <li>Bullet point 1.1</li>
    <li>Bullet point 1.2</li>
  </ul>
</section>
<section>
  <h2>Key Point 2</h2>
  <p>Explanation about the second key point. Here's a code snippet example:</p>
  <pre><code class="language-javascript">
function helloWorld() {
  console.log("Hello, world!");
}
  </code></pre>
</section>
<footer>
  <p>Summary or contact information.</p>
</footer>
`;

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
    const { pending } = useFormStatus();
    const text = isEditMode ? 'Save Changes' : 'Create Material';
    const loadingText = isEditMode ? 'Saving...' : 'Creating...';
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
            </> : text}
        </Button>
    )
}

export function NewMaterialDialog({ material, children }: NewMaterialDialogProps) {
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const isEditMode = !!material;

    const handleFormSubmit = async (formData: FormData) => {
        if (isEditMode) {
            formData.append('id', material.id);
        }

        const result = await saveMaterial(formData);

        if (result?.error) {
            toast({
                title: `Error ${isEditMode ? 'updating' : 'creating'} material`,
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: `Material ${isEditMode ? 'updated' : 'created'}.`,
            });
            setOpen(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Material
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Create New'} Material</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this material.' : 'Create a new set of slides or class material. You can use HTML for styling.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                        Title
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        defaultValue={material?.title}
                        className="col-span-3"
                        required
                    />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="topic" className="text-right">
                        Topic
                    </Label>
                    <Input
                        id="topic"
                        name="topic"
                        defaultValue={material?.topic || ''}
                        className="col-span-3"
                        placeholder="e.g. Week 1: Intro to JavaScript"
                    />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="content" className="text-right pt-2">
                        Content (HTML)
                    </Label>
                    <Textarea
                        id="content"
                        name="content"
                        defaultValue={material?.content || defaultContent}
                        className="col-span-3 font-mono"
                        rows={15}
                    />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="is_published" className="text-right">
                        Publish
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                         <Switch 
                            id="is_published" 
                            name="is_published" 
                            value="true"
                            defaultChecked={material?.is_published || false}
                         />
                         <span className="text-sm text-muted-foreground">Make this material visible to students.</span>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <SubmitButton isEditMode={isEditMode} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
