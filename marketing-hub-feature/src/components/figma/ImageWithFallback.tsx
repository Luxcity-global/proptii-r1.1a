import { useState } from 'react';
import { cn } from '../ui/utils';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className, 
  fallbackSrc = '/placeholder-image.jpg',
  onError 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      onError?.();
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn(className)}
      onError={handleError}
      loading="lazy"
    />
  );
}
