/**
 * Client-Side Image Optimizer
 * Automatically converts and compresses uploaded photos (JPEG, PNG, HEIC, etc.)
 * into ultra-optimized modern WebP format before storage/upload.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  cropSquare?: boolean;
}

export async function convertToWebP(
  input: Blob | File,
  options: OptimizeImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.85,
    cropSquare = false
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(input);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        let sx = 0;
        let sy = 0;
        let sWidth = width;
        let sHeight = height;

        if (cropSquare) {
          const minDim = Math.min(width, height);
          sx = (width - minDim) / 2;
          sy = (height - minDim) / 2;
          sWidth = minDim;
          sHeight = minDim;
          width = Math.min(maxWidth, minDim);
          height = width;
        } else {
          // Scale down preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          resolve(input);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.type === 'image/webp') {
              resolve(blob);
            } else {
              // In case WebP is unavailable in canvas, try standard fallback
              canvas.toBlob(
                (fallbackBlob) => resolve(fallbackBlob || input),
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      } catch (err) {
        console.warn('Canvas WebP compression error, falling back to original:', err);
        resolve(input);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(input);
    };

    img.src = objectUrl;
  });
}
