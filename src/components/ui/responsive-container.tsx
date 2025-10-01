import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fluid' | 'container' | 'full';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
}

/**
 * Modern responsive container using fluid design principles
 * - Uses container queries when supported
 * - Falls back to viewport-based responsive design
 * - Implements fluid typography and spacing
 */
export function ResponsiveContainer({ 
  children, 
  className,
  variant = 'container',
  maxWidth = 'xl'
}: ResponsiveContainerProps) {
  const baseClasses = "w-full";
  
  const variantClasses = {
    fluid: "px-4 sm:px-6 lg:px-8",
    container: "mx-auto px-4 sm:px-6 lg:px-8",
    full: "px-0"
  };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    '2xl': "max-w-2xl",
    none: ""
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        maxWidth !== 'none' && maxWidthClasses[maxWidth],
        // Fluid spacing that scales with viewport
        "py-4 sm:py-6 lg:py-8",
        // Container query support (modern browsers)
        "@container",
        className
      )}
      style={{
        // CSS custom properties for fluid design
        '--container-padding': 'clamp(1rem, 4vw, 2rem)',
        '--container-max-width': 'clamp(20rem, 90vw, 80rem)',
        padding: 'var(--container-padding)',
        maxWidth: maxWidth !== 'none' ? 'var(--container-max-width)' : 'none'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Fluid typography component that scales smoothly
 */
interface FluidTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

export function FluidText({ 
  children, 
  className,
  size = 'base',
  weight = 'normal'
}: FluidTextProps) {
  const sizeClasses = {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base", 
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
    '2xl': "text-2xl sm:text-3xl",
    '3xl': "text-3xl sm:text-4xl",
    '4xl': "text-4xl sm:text-5xl"
  };

  const weightClasses = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium", 
    semibold: "font-semibold",
    bold: "font-bold"
  };

  return (
    <div 
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        // Fluid line height
        "leading-tight sm:leading-normal",
        className
      )}
      style={{
        // CSS clamp for truly fluid typography
        fontSize: size === 'xs' ? 'clamp(0.75rem, 2vw, 0.875rem)' :
                 size === 'sm' ? 'clamp(0.875rem, 2.5vw, 1rem)' :
                 size === 'base' ? 'clamp(1rem, 3vw, 1.125rem)' :
                 size === 'lg' ? 'clamp(1.125rem, 3.5vw, 1.25rem)' :
                 size === 'xl' ? 'clamp(1.25rem, 4vw, 1.5rem)' :
                 size === '2xl' ? 'clamp(1.5rem, 5vw, 1.875rem)' :
                 size === '3xl' ? 'clamp(1.875rem, 6vw, 2.25rem)' :
                 'clamp(2.25rem, 7vw, 3rem)'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Responsive grid that adapts to content and viewport
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({ 
  children, 
  className,
  minItemWidth = '20rem',
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2 sm:gap-4",
    md: "gap-4 sm:gap-6", 
    lg: "gap-6 sm:gap-8"
  };

  return (
    <div 
      className={cn(
        "grid",
        gapClasses[gap],
        // Auto-fit grid that responds to content
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      style={{
        // CSS Grid auto-fit for true responsiveness
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        // Container query support
        containerType: 'inline-size'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Aspect ratio container for consistent proportions
 */
interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: 'square' | 'video' | 'photo' | 'wide' | 'tall';
  className?: string;
}

export function AspectRatio({ 
  children, 
  ratio = 'video',
  className
}: AspectRatioProps) {
  const ratioClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    photo: "aspect-[4/3]",
    wide: "aspect-[16/9]",
    tall: "aspect-[3/4]"
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        ratioClasses[ratio],
        className
      )}
    >
      {children}
    </div>
  );
}
