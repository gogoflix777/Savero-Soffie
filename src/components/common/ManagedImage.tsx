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
    setResolved(fallback);
    if (key) void getManagedPhotoUrl(key, fallback).then(url => { if (active) setResolved(url); });
    return () => { active = false; };
  }, [fallback, key]);
  return <img {...props} src={resolved} />;
};
