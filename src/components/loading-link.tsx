
'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, forwardRef, useTransition } from 'react';
import { Button, type ButtonProps } from './ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type LoadingLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children: React.ReactNode;
    asButton?: boolean;
    buttonProps?: ButtonProps;
  };

export const LoadingLink = forwardRef<HTMLAnchorElement, LoadingLinkProps>(
    ({ href, children, asButton = false, buttonProps = {}, className, ...props }, ref) => {
        const pathname = usePathname();
        const [isPending, startTransition] = useTransition();

        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (pathname !== href) {
                startTransition(() => {
                    // This will trigger the loading state, Next.js handles the navigation
                });
            }
        };

        if (asButton) {
            return (
                <Button
                    {...buttonProps}
                    asChild
                    disabled={buttonProps.disabled || isPending}
                    className={cn(buttonProps.className, className)}
                >
                    <Link href={href} onClick={handleClick} ref={ref} {...props}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {children}
                    </Link>
                </Button>
            );
        }

        return (
            <Link href={href} onClick={handleClick} className={cn(className, isPending && "opacity-75 pointer-events-none")} ref={ref} {...props}>
                {children}
            </Link>
        );
    }
);

LoadingLink.displayName = 'LoadingLink';
