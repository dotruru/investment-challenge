import { useMemo } from 'react';
import { cn } from '@/shared/utils/cn';

interface LogoItem {
  src: string;
  alt?: string;
}

interface LogoCarouselProps {
  /** Array of logo URLs or objects with src/alt */
  logos: (string | LogoItem)[];
  /** Animation duration in seconds (default: 30) */
  duration?: number;
  /** Direction of scroll */
  direction?: 'left' | 'right';
  /** Height of logos in pixels (default: 40) */
  logoHeight?: number;
  /** Gap between logos in pixels (default: 48) */
  gap?: number;
  /** Whether to show grayscale with color on hover (default: true) */
  grayscale?: boolean;
  /** Additional class names for the container */
  className?: string;
  /** Whether to pause on hover (default: true) */
  pauseOnHover?: boolean;
}

export function LogoCarousel({
  logos,
  duration = 30,
  direction = 'left',
  logoHeight = 40,
  gap = 48,
  grayscale = true,
  className,
  pauseOnHover = true,
}: LogoCarouselProps) {
  // Normalize logos to always have src/alt
  const normalizedLogos = useMemo(() => 
    logos.map((logo, idx) => 
      typeof logo === 'string' 
        ? { src: logo, alt: `Partner logo ${idx + 1}` }
        : logo
    ), 
    [logos]
  );

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = useMemo(() => 
    [...normalizedLogos, ...normalizedLogos, ...normalizedLogos],
    [normalizedLogos]
  );

  if (logos.length === 0) return null;

  return (
    <div 
      className={cn(
        'logo-carousel-container overflow-hidden relative',
        className
      )}
    >
      {/* Gradient masks for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none" />
      
      <div
        className={cn(
          'logo-carousel-track flex items-center',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
        style={{
          gap: `${gap}px`,
          animationDuration: `${duration}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {duplicatedLogos.map((logo, idx) => (
          <div
            key={`${logo.src}-${idx}`}
            className={cn(
              'flex-shrink-0 transition-all duration-300',
              grayscale && 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
            )}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className="object-contain"
              style={{ height: `${logoHeight}px`, width: 'auto' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Simpler variant for just image URLs (societies)
interface SimpleCarouselProps {
  images: string[];
  duration?: number;
  direction?: 'left' | 'right';
  imageHeight?: number;
  gap?: number;
  className?: string;
}

export function SimpleLogoCarousel({
  images,
  duration = 25,
  direction = 'left',
  imageHeight = 36,
  gap = 40,
  className,
}: SimpleCarouselProps) {
  // Duplicate for seamless loop
  const duplicatedImages = useMemo(() => 
    [...images, ...images, ...images],
    [images]
  );

  if (images.length === 0) return null;

  return (
    <div className={cn('logo-carousel-container overflow-hidden relative', className)}>
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none" />
      
      <div
        className="logo-carousel-track flex items-center hover:[animation-play-state:paused]"
        style={{
          gap: `${gap}px`,
          animationDuration: `${duration}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {duplicatedImages.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <img
              src={src}
              alt=""
              className="object-contain rounded"
              style={{ height: `${imageHeight}px`, width: 'auto' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

