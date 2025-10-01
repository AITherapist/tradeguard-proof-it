import React from 'react';
import { ResponsiveContainer, FluidText, ResponsiveGrid, AspectRatio } from '@/components/ui/responsive-container';
import { useResponsive } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Example component demonstrating modern responsive design approaches
 * This shows how to move beyond fixed pixel breakpoints to fluid, content-aware design
 */
export function ResponsiveExample() {
  const { breakpoint, isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <ResponsiveContainer variant="container" maxWidth="xl">
      <div className="space-y-8">
        {/* Fluid Typography Example */}
        <section>
          <FluidText size="4xl" weight="bold" className="text-center mb-4">
            Modern Responsive Design
          </FluidText>
          <FluidText size="lg" className="text-center text-muted-foreground mb-8">
            Beyond fixed pixels - content-aware, fluid design that adapts to any device
          </FluidText>
        </section>

        {/* Current Breakpoint Display */}
        <Card>
          <CardHeader>
            <CardTitle>Current Device Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{breakpoint}</div>
                <div className="text-sm text-muted-foreground">Breakpoint</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{isMobile ? '✓' : '✗'}</div>
                <div className="text-sm text-muted-foreground">Mobile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{isTablet ? '✓' : '✗'}</div>
                <div className="text-sm text-muted-foreground">Tablet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{isDesktop ? '✓' : '✗'}</div>
                <div className="text-sm text-muted-foreground">Desktop</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Grid Example */}
        <section>
          <FluidText size="2xl" weight="semibold" className="mb-4">
            Auto-Fitting Grid
          </FluidText>
          <FluidText size="base" className="text-muted-foreground mb-6">
            This grid automatically adjusts the number of columns based on available space
          </FluidText>
          
          <ResponsiveGrid minItemWidth="280px" gap="md">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="p-4">
                <CardHeader>
                  <CardTitle className="text-lg">Card {i + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This card will automatically fit based on available space.
                    No fixed breakpoints needed!
                  </p>
                </CardContent>
              </Card>
            ))}
          </ResponsiveGrid>
        </section>

        {/* Aspect Ratio Examples */}
        <section>
          <FluidText size="2xl" weight="semibold" className="mb-4">
            Consistent Proportions
          </FluidText>
          <FluidText size="base" className="text-muted-foreground mb-6">
            Using aspect ratios instead of fixed heights for consistent proportions
          </FluidText>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AspectRatio ratio="video" className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full">
                <span className="text-sm font-medium">16:9 Video</span>
              </div>
            </AspectRatio>
            
            <AspectRatio ratio="square" className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full">
                <span className="text-sm font-medium">1:1 Square</span>
              </div>
            </AspectRatio>
            
            <AspectRatio ratio="photo" className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full">
                <span className="text-sm font-medium">4:3 Photo</span>
              </div>
            </AspectRatio>
          </div>
        </section>

        {/* Fluid Spacing Example */}
        <section>
          <FluidText size="2xl" weight="semibold" className="mb-4">
            Fluid Spacing & Typography
          </FluidText>
          <FluidText size="base" className="text-muted-foreground mb-6">
            Text and spacing that scales smoothly with viewport size
          </FluidText>
          
          <div 
            className="bg-muted rounded-lg p-6"
            style={{
              // Fluid padding using CSS clamp
              padding: 'clamp(1rem, 4vw, 3rem)',
              // Fluid margin
              margin: 'clamp(0.5rem, 2vw, 2rem) 0'
            }}
          >
            <FluidText size="xl" weight="semibold" className="mb-4">
              This heading scales with your screen
            </FluidText>
            <FluidText size="base" className="text-muted-foreground">
              This paragraph uses fluid typography that adapts to any screen size.
              The spacing and text size will scale smoothly as you resize your browser.
              No more awkward breakpoints or fixed sizes!
            </FluidText>
          </div>
        </section>

        {/* Device Capability Detection */}
        <section>
          <FluidText size="2xl" weight="semibold" className="mb-4">
            Smart Device Detection
          </FluidText>
          <FluidText size="base" className="text-muted-foreground mb-6">
            Adapting to device capabilities, not just screen size
          </FluidText>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Touch Device</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Larger touch targets and hover-free interactions
              </p>
              <Button 
                className="w-full"
                style={{
                  // Larger touch targets for touch devices
                  minHeight: '44px'
                }}
              >
                Touch-Friendly Button
              </Button>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Mouse Device</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Smaller targets with hover effects
              </p>
              <Button 
                className="w-full hover:scale-105 transition-transform"
                style={{
                  minHeight: '32px'
                }}
              >
                Hover-Enabled Button
              </Button>
            </Card>
          </div>
        </section>

        {/* CSS Container Queries Example */}
        <section>
          <FluidText size="2xl" weight="semibold" className="mb-4">
            Container Queries
          </FluidText>
          <FluidText size="base" className="text-muted-foreground mb-6">
            Components that respond to their container size, not the viewport
          </FluidText>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Wide Container</h4>
              <div 
                className="bg-muted rounded-lg p-4"
                style={{ containerType: 'inline-size' }}
              >
                <div className="@container">
                  <div className="@[400px]:flex @[400px]:items-center @[400px]:gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <h5 className="font-semibold">Adaptive Layout</h5>
                      <p className="text-sm text-muted-foreground">
                        This layout changes based on container width, not viewport width.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Narrow Container</h4>
              <div 
                className="bg-muted rounded-lg p-4 max-w-xs"
                style={{ containerType: 'inline-size' }}
              >
                <div className="@container">
                  <div className="@[400px]:flex @[400px]:items-center @[400px]:gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      B
                    </div>
                    <div>
                      <h5 className="font-semibold">Stacked Layout</h5>
                      <p className="text-sm text-muted-foreground">
                        Same component, different layout based on container size.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ResponsiveContainer>
  );
}
