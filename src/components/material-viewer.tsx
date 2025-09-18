
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type ClassMaterial } from "@/app/materials/actions";
import { ScrollArea } from "./ui/scroll-area";

interface MaterialViewerProps {
  material: ClassMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialViewer({ material, open, onOpenChange }: MaterialViewerProps) {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">{material.title}</DialogTitle>
        </DialogHeader>
        <style>
            {`
            .material-content {
                --slide-bg: hsl(var(--card));
                --slide-text: hsl(var(--card-foreground));
                --slide-primary: hsl(var(--primary));
                --slide-primary-foreground: hsl(var(--primary-foreground));
                --slide-accent: hsl(var(--accent));
                --slide-border: hsl(var(--border));
                --slide-muted-foreground: hsl(var(--muted-foreground));
            }
            .material-content > *:not(style) {
              opacity: 0;
              transform: translateY(20px);
              animation: slide-up 0.6s ease-out forwards;
            }
            .material-content h1, .material-content h2, .material-content h3 {
                color: var(--slide-primary);
                border-bottom: 2px solid var(--slide-border);
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
                animation-delay: 0.2s;
            }
            .material-content header {
                background-color: hsl(var(--muted) / 0.5);
                padding: 2rem;
                border-radius: var(--radius);
                margin-bottom: 2rem;
                animation-delay: 0.1s;
            }
            .material-content header h1 {
                font-size: 2.5rem;
                border: none;
                margin: 0;
            }
            .material-content p {
                line-height: 1.6;
                color: var(--slide-muted-foreground);
                margin-bottom: 1rem;
                animation-delay: 0.3s;
            }
            .material-content strong { color: var(--slide-primary); }
            .material-content em { color: var(--slide-accent); }
            .material-content ul {
                list-style-position: inside;
                padding-left: 1rem;
                margin-bottom: 1.5rem;
                animation-delay: 0.4s;
            }
            .material-content ul li {
                margin-bottom: 0.5rem;
                padding-left: 0.5rem;
                border-left: 2px solid var(--slide-accent);
            }
            .material-content section {
                margin-bottom: 2.5rem;
                padding: 1.5rem;
                background: var(--slide-bg);
                border-radius: var(--radius);
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            }
            .material-content pre {
                background-color: hsl(var(--sidebar-background));
                color: hsl(var(--sidebar-foreground));
                padding: 1rem;
                border-radius: var(--radius);
                overflow-x: auto;
                animation-delay: 0.5s;
            }
            .material-content footer {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid var(--slide-border);
                font-size: 0.9rem;
                color: var(--slide-muted-foreground);
                text-align: center;
                animation-delay: 0.6s;
            }
            @keyframes slide-up {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            `}
        </style>
        <ScrollArea className="flex-1">
          <div
            className="material-content p-6"
            dangerouslySetInnerHTML={{ __html: material.content || '' }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
