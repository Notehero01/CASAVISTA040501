import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface WatermarkedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fit?: 'cover' | 'contain';
  imgClassName?: string;
  watermark?: boolean;
  watermarkClassName?: string;
}

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x600';

export function WatermarkedImage({
  src,
  alt = '',
  fit = 'contain',
  className,
  imgClassName,
  watermark = true,
  watermarkClassName,
  ...props
}: WatermarkedImageProps) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-gray-100', className)}>
      <img
        src={src || FALLBACK_IMAGE}
        alt={alt}
        className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain', imgClassName)}
        {...props}
      />
      {watermark && (
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 select-none -translate-x-1/2 -translate-y-1/2 -rotate-12 font-mono text-[clamp(1.15rem,7vw,4.5rem)] font-black uppercase tracking-[0.26em] text-gray-950/15 mix-blend-multiply [font-stretch:condensed]',
            watermarkClassName
          )}
        >
          CASAVISTA
        </span>
      )}
    </div>
  );
}
