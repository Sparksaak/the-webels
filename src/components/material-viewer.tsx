
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
  const [animationState, setAnimationState] = React.useState<'idle' | 'entering' | 'exiting'>('idle');
  const slideRef = React.useRef<HTMLDivElement>(null);

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

  const changeSlide = (direction: 'next' | 'prev') => {
    if (animationState !== 'idle') return;

    const nextSlideIndex = direction === 'next' ? currentSlide + 1 : currentSlide - 1;
    if (nextSlideIndex < 0 || nextSlideIndex >= slides.length) return;

    // Start exit animation
    setAnimationState('exiting');
    
    // Wait for exit animation to finish, then change slide and start enter animation
    setTimeout(() => {
      setCurrentSlide(nextSlideIndex);
      setAnimationState('entering');
      // Wait for enter animation to finish, then return to idle
      setTimeout(() => {
        setAnimationState('idle');
      }, 800); // Corresponds to the longest enter animation delay
    }, 800); // Corresponds to the longest exit animation duration
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === 'ArrowRight') {
        changeSlide('next');
      } else if (event.key === 'ArrowLeft') {
        changeSlide('prev');
      } else if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slides.length, animationState, currentSlide]);


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
            .material-content h1, .material-content h2, .material-content h3 {
                color: var(--slide-primary);
                border-bottom: 2px solid var(--slide-border);
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
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
            .material-content p {
                line-height: 1.7;
                color: var(--slide-muted-foreground);
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            .material-content strong { color: var(--slide-primary); }
            .material-content em { color: var(--slide-accent); }
            .material-content ul {
                list-style-position: inside;
                padding-left: 1rem;
                margin-bottom: 1.5rem;
            }
            .material-content ul li {
                margin-bottom: 0.75rem;
                padding-left: 0.5rem;
                border-left: 3px solid var(--slide-accent);
                font-size: 1.1rem;
            }
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
            .material-content footer {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid var(--slide-border);
                font-size: 0.9rem;
                color: var(--slide-muted-foreground);
                text-align: center;
            }
            
            /* Animations */
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideUpIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideUpOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-30px); } }
            @keyframes slideLeftIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes slideLeftOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-30px); } }

            .slide-container {
                animation: fadeIn 0.5s ease-out forwards;
                width: 100%;
                height: 100%;
            }

            .slide-container.exiting {
                animation: fadeOut 0.5s ease-in forwards;
            }

            .slide-element {
                opacity: 0;
                animation-fill-mode: forwards;
            }
            
            .slide-container.entering .slide-element {
                animation-name: slideUpIn;
                animation-duration: 0.5s;
                animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .slide-container.exiting .slide-element {
                animation-name: slideUpOut;
                animation-duration: 0.4s;
                animation-timing-function: ease-in;
            }

            .slide-container.entering ul li.slide-element { animation-name: slideLeftIn; }
            .slide-container.exiting ul li.slide-element { animation-name: slideLeftOut; }

            /* Staggered Delays */
            .slide-container.entering h1, .slide-container.entering h2 { animation-delay: 0.1s; }
            .slide-container.entering p { animation-delay: 0.2s; }
            .slide-container.entering pre, .slide-container.entering ul { animation-delay: 0.3s; }
            .slide-container.entering footer { animation-delay: 0.4s; }
            .slide-container.entering li:nth-child(1) { animation-delay: 0.4s; }
            .slide-container.entering li:nth-child(2) { animation-delay: 0.5s; }
            .slide-container.entering li:nth-child(3) { animation-delay: 0.6s; }
            .slide-container.entering li:nth-child(4) { animation-delay: 0.7s; }
            .slide-container.entering li:nth-child(5) { animation-delay: 0.8s; }
            
            /* Reverse delays for exit */
            .slide-container.exiting li:nth-child(5) { animation-delay: 0s; }
            .slide-container.exiting li:nth-child(4) { animation-delay: 0.1s; }
            .slide-container.exiting li:nth-child(3) { animation-delay: 0.2s; }
            .slide-container.exiting li:nth-child(2) { animation-delay: 0.3s; }
            .slide-container.exiting li:nth-child(1) { animation-delay: 0.4s; }
            .slide-container.exiting footer { animation-delay: 0.5s; }
            .slide-container.exiting pre, .slide-container.exiting ul { animation-delay: 0.6s; }
            .slide-container.exiting p { animation-delay: 0.7s; }
            .slide-container.exiting h1, .slide-container.exiting h2 { animation-delay: 0.8s; }
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
            <div
                ref={slideRef}
                key={currentSlide}
                className={cn(
                    'material-content w-full h-full max-w-6xl slide-container',
                    animationState === 'entering' && 'entering',
                    animationState === 'exiting' && 'exiting'
                )}
                dangerouslySetInnerHTML={{ __html: slides[currentSlide] || '' }}
                // Add slide-element class to all children for animation targeting
                onLoad={() => {
                  if (slideRef.current) {
                    slideRef.current.querySelectorAll('*').forEach(el => el.classList.add('slide-element'));
                  }
                }}
             />
        </main>

        <footer className="flex items-center justify-between p-4 text-foreground">
            <Button variant="outline" onClick={() => changeSlide('prev')} disabled={currentSlide === 0 || animationState !== 'idle'}>
                <ChevronLeft className="mr-2 h-4 w-4"/>
                Prev
            </Button>
            <div className="text-sm font-medium">
                {currentSlide + 1} / {slides.length}
            </div>
            <Button variant="outline" onClick={() => changeSlide('next')} disabled={currentSlide === slides.length - 1 || animationState !== 'idle'}>
                Next
                <ChevronRight className="ml-2 h-4 w-4"/>
            </Button>
        </footer>
    </div>
  );
}
