'use client';

import { useState } from 'react';

/*
 * An image slot that degrades gracefully. While the real asset is missing
 * (before the generated images are dropped into /public/images), it shows a
 * calm branded placeholder instead of a broken-image icon. Once the file
 * exists at `src`, it renders the real thing. No layout shift either way:
 * the wrapper holds the aspect ratio.
 */
export function SlotImage({
  src,
  alt,
  aspect = '4 / 3',
  className = '',
  label,
  fit = 'cover',
}: {
  src: string;
  alt: string;
  aspect?: string;
  className?: string;
  label?: string;
  fit?: 'cover' | 'contain';
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-paper-raised ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="comet-mark" aria-hidden="true">
            <span className="comet-core" />
          </span>
          <span className="font-mono text-xs text-faint">
            {label ?? 'image slot'}
          </span>
        </div>
      )}
    </div>
  );
}
