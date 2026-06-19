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
            'pointer-events-none absolute bottom-2 right-2 select-none rounded-full bg-white/35 px-2 py-0.5 text-[10px] font-semibold lowercase tracking-[0.18em] text-gray-900/45 backdrop-blur-[1px]',
            watermarkClassName
          )}
        >
          casavista
        </span>
      )}
    </div>
  );
}
