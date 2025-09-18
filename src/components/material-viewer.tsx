
'use client';

import * as React from 'react';
import { type ClassMaterial } from "@/app/materials/actions";
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialViewerProps {
  material: ClassMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialViewer({ material, open, onOpenChange }: MaterialViewerProps) {
  const [slides, setSlides] = React.useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [direction, setDirection] = React.useState<'next' | 'prev'>('next');

  React.useEffect(() => {
    if (material.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(material.content, 'text/html');
      const slideElements = Array.from(doc.querySelectorAll('header, section'));
      const htmlSlides = slideElements.map(el => el.outerHTML);
      setSlides(htmlSlides);
      setCurrentSlide(0);
    }
  }, [material]);

  const goToNextSlide = () => {
    setDirection('next');
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  };

  const goToPrevSlide = () => {
    setDirection('prev');
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };
  
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === 'ArrowRight') {
        goToNextSlide();
      } else if (event.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slides.length]);


  if (!open) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in-0"
    >
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
            .slide-content-animation-wrapper > * {
              opacity: 0;
              transform: translateY(20px);
              animation: content-slide-up 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            .material-content h1, .material-content h2, .material-content h3 {
                color: var(--slide-primary);
                border-bottom: 2px solid var(--slide-border);
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
             .slide-content-animation-wrapper h1, .slide-content-animation-wrapper h2, .slide-content-animation-wrapper h3 {
                animation-delay: 0.2s;
            }
            .material-content header {
                background-color: transparent;
                padding: 2rem;
                border-radius: var(--radius);
                margin-bottom: 2rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                height: 100%;
            }
            .material-content header h1 {
                font-size: 3.5rem;
                border: none;
                margin: 0;
            }
            .material-content header p {
                font-size: 1.25rem;
            }
            .material-content p {
                line-height: 1.7;
                color: var(--slide-muted-foreground);
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
             .slide-content-animation-wrapper p {
                animation-delay: 0.3s;
            }
            .material-content strong { color: var(--slide-primary); }
            .material-content em { color: var(--slide-accent); }
            .material-content ul {
                list-style-position: inside;
                padding-left: 1rem;
                margin-bottom: 1.5rem;
            }
             .slide-content-animation-wrapper ul {
                animation-delay: 0.4s;
            }
            .material-content ul li {
                margin-bottom: 0.75rem;
                padding-left: 0.5rem;
                border-left: 3px solid var(--slide-accent);
                font-size: 1.1rem;
            }
             .slide-content-animation-wrapper ul li {
                opacity: 0;
                transform: translateX(-20px);
                animation: list-item-in 0.5s ease-out forwards;
            }
            .slide-content-animation-wrapper ul li:nth-child(1) { animation-delay: 0.5s; }
            .slide-content-animation-wrapper ul li:nth-child(2) { animation-delay: 0.6s; }
            .slide-content-animation-wrapper ul li:nth-child(3) { animation-delay: 0.7s; }
            .slide-content-animation-wrapper ul li:nth-child(4) { animation-delay: 0.8s; }
            .slide-content-animation-wrapper ul li:nth-child(5) { animation-delay: 0.9s; }
            
            .material-content section {
                margin-bottom: 2.5rem;
                padding: 2.5rem;
                background: transparent;
                border-radius: var(--radius);
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .material-content pre {
                background-color: hsl(var(--sidebar-background));
                color: hsl(var(--sidebar-foreground));
                padding: 1.5rem;
                border-radius: var(--radius);
                overflow-x: auto;
                 font-size: 0.95rem;
            }
             .slide-content-animation-wrapper pre {
                 animation-delay: 0.5s;
            }
            .material-content footer {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid var(--slide-border);
                font-size: 0.9rem;
                color: var(--slide-muted-foreground);
                text-align: center;
            }
            .slide-content-animation-wrapper footer {
                 animation-delay: 0.6s;
            }
            @keyframes content-slide-up {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes list-item-in {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slide-zoom-in {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes slide-zoom-out {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
            }
            .slide-enter-active {
                animation: slide-zoom-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            .slide-exit-active {
                animation: slide-zoom-out 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            `}
        </style>
        
        <header className="flex items-center justify-between p-4 text-foreground">
            <h2 className="text-lg font-semibold truncate">{material.title}</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close presentation</span>
            </Button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {slides.map((slide, index) => (
                 <div 
                    key={index}
                    className={cn(
                        'material-content w-full h-full max-w-6xl absolute',
                        index === currentSlide ? 'z-10 slide-enter-active' : 'z-0',
                        index < currentSlide && direction === 'next' && 'slide-exit-active',
                        index > currentSlide && direction === 'prev' && 'slide-exit-active'
                    )}
                 >
                    <div
                        className={cn(
                          'w-full h-full',
                          index === currentSlide && 'slide-content-animation-wrapper'
                        )}
                        dangerouslySetInnerHTML={{ __html: slide || '' }}
                    />
                 </div>
            ))}
        </main>

        <footer className="flex items-center justify-between p-4 text-foreground">
            <Button variant="outline" onClick={goToPrevSlide} disabled={currentSlide === 0}>
                <ChevronLeft className="mr-2 h-4 w-4"/>
                Prev
            </Button>
            <div className="text-sm font-medium">
                {currentSlide + 1} / {slides.length}
            </div>
            <Button variant="outline" onClick={goToNextSlide} disabled={currentSlide === slides.length - 1}>
                Next
                <ChevronRight className="ml-2 h-4 w-4"/>
            </Button>
        </footer>
    </div>
  );
}
