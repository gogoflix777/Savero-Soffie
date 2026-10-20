import React, { useEffect, useState } from 'react';
import { getManagedPhotoUrl } from '../../lib/supabase';

type ManagedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & { photoKey?: string };

/** Resolves a private Supabase replacement while retaining the original image as fallback. */
export const ManagedImage: React.FC<ManagedImageProps> = ({ src, photoKey, ...props }) => {
  const fallback = typeof src === 'string' ? src : '';
  const [resolved, setResolved] = useState(fallback);
  const key = photoKey || fallback;
  useEffect(() => {
    let active = true;
    const resolve = () => {
      setResolved(fallback);
      if (key) void getManagedPhotoUrl(key, fallback).then(url => { if (active) setResolved(url); });
    };
    const refreshManagedPhoto = (event: Event) => {
      const detail = (event as CustomEvent<{ photoKey: string }>).detail;
      if (detail?.photoKey === key) resolve();
    };
    resolve();
    window.addEventListener('managed-photo-updated', refreshManagedPhoto);
    return () => {
      active = false;
      window.removeEventListener('managed-photo-updated', refreshManagedPhoto);
    };
  }, [fallback, key]);
  return <img loading="lazy" decoding="async" {...props} src={resolved} />;
};
