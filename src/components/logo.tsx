import { GraduationCap } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-primary text-primary-foreground rounded-md size-8 ${className}`}>
        <GraduationCap className="size-5" />
    </div>
  );
}
