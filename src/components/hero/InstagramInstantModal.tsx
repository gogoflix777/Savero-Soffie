import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Camera,
  RefreshCw,
  Image as ImageIcon,
  Heart,
  Check,
  Sparkles,
  Pencil
} from 'lucide-react';
import { CoupleProfile, MoodExpression } from '../../types';
import { soundManager } from '../../utils/audio';
import {
  getCurvedCaptionFontSize,
  getCurvedCaptionStartOffset,
  SQUIRCLE_CURVE_PATH
} from '../../utils/caption';
import { moodOptions, moodImage } from '../../utils/mood';
import { convertToWebP } from '../../utils/imageOptimizer';

interface InstagramInstantModalProps {
  activeProfile: CoupleProfile;
  initialExpression?: MoodExpression;
  initialData?: {
    id?: string;
    profile?: CoupleProfile;
    logDate?: string;
    expression?: MoodExpression;
    rating?: number;
    diaryText?: string | null;
    photoUrl?: string | null;
    photoPath?: string | null;
  } | null;
  onSaveInstant: (data: {
    id?: string;
    logDate?: string;
    expression: MoodExpression;
    rating: number;
    diaryText: string;
    photo?: Blob | null;
    keepExistingPhoto?: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Butuh Peluk 🥺',
  2: 'Kurang Oke ☁️',
  3: 'Tenang & Nyaman 🌸',
  4: 'Senang Banget ✨',
  5: 'Penuh Cinta! 💖'
};

export const InstagramInstantModal: React.FC<InstagramInstantModalProps> = ({
  activeProfile,
  initialExpression = 'bahagia',
  initialData,
  onSaveInstant,
  onClose
}) => {
  const isEditMode = Boolean(initialData?.id);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.photoUrl || null);
  const [isReplacingPhoto, setIsReplacingPhoto] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>(initialData?.diaryText || '');
  const [expression, setExpression] = useState<MoodExpression>(initialData?.expression || initialExpression);
  const [rating, setRating] = useState<number>(initialData?.rating ?? 5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Stop all camera tracks and clear video srcObject completely
  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('Error stopping camera track:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }
    setStream(null);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      // If user closed the modal while waiting for permission, stop tracks immediately
      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.warn('Camera access denied or failed:', err);
      setCameraError('Kamera tidak aktif. Kamu tetap bisa pilih foto dari galeri.');
    }
  };

  // Component Mount & Unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    const handleWindowUnload = () => {
      stopCamera();
    };
    window.addEventListener('beforeunload', handleWindowUnload);
    window.addEventListener('pagehide', handleWindowUnload);

    return () => {
      isMountedRef.current = false;
      stopCamera();
      window.removeEventListener('beforeunload', handleWindowUnload);
      window.removeEventListener('pagehide', handleWindowUnload);
    };
  }, []);

  // Facing mode switch or initial camera start (only start camera if no preview image exists)
  useEffect(() => {
    if (!capturedBlob && !previewUrl && isMountedRef.current) {
      void startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, capturedBlob, previewUrl]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleFlipCamera = () => {
    soundManager.playTap();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    soundManager.playPop();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 720, video.videoHeight || 720);
    canvas.width = Math.min(1080, size);
    canvas.height = Math.min(1080, size);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (rawBlob) => {
        if (!rawBlob) return;
        try {
          const webpBlob = await convertToWebP(rawBlob, { maxWidth: 1080, maxHeight: 1080, quality: 0.85, cropSquare: true });
          setCapturedBlob(webpBlob);
          setPreviewUrl(URL.createObjectURL(webpBlob));
          setIsReplacingPhoto(true);
          stopCamera();
        } catch (err) {
          console.error('Failed to optimize captured photo to WebP:', err);
        }
      },
      'image/webp',
      0.88
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playTap();
    try {
      // Otomatis mengonversi dan mengompresi foto galeri ke format WebP optimal
      const webpBlob = await convertToWebP(file, { maxWidth: 1080, maxHeight: 1080, quality: 0.85, cropSquare: true });
      setCapturedBlob(webpBlob);
      setPreviewUrl(URL.createObjectURL(webpBlob));
      setIsReplacingPhoto(true);
      stopCamera();
    } catch (err) {
      console.warn('Gagal mengonversi file ke WebP, menggunakan file asli:', err);
      setCapturedBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsReplacingPhoto(true);
      stopCamera();
    }
  };

  const handleRetake = () => {
    soundManager.playTap();
    setCapturedBlob(null);
    if (previewUrl && previewUrl !== initialData?.photoUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsReplacingPhoto(true);
    void startCamera(facingMode);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSaveInstant({
        id: initialData?.id,
        logDate: initialData?.logDate,
        expression,
        rating,
        diaryText: caption.trim(),
        photo: capturedBlob,
        keepExistingPhoto: !capturedBlob && Boolean(initialData?.photoUrl && !isReplacingPhoto)
      });
      soundManager.playSuccess();
      stopCamera();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan instant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* 3D Clay Compact Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 18 }}
        transition={{ type: 'spring', damping: 24, stiffness: 340 }}
        className="relative my-auto flex w-full max-w-[334px] flex-col items-center rounded-[2.5rem] border border-white/95 bg-gradient-to-b from-[#ffffff] via-[#fff6f9] to-[#ffe6ee] p-3.5 text-[#4a1623] shadow-[0_24px_60px_rgba(90,15,35,0.32),inset_0_4px_8px_#ffffff,inset_0_-6px_12px_rgba(230,140,170,0.35)] dark:border-white/15 dark:from-[#341622] dark:via-[#261019] dark:to-[#1b0a11] dark:text-rose-100 dark:shadow-[0_24px_60px_rgba(0,0,0,0.75),inset_0_2px_4px_rgba(255,255,255,0.12)]"
      >
        {/* Compact Top Header */}
        <div className="mb-2.5 flex w-full items-center justify-between px-1">
          <div className="flex items-center gap-1.5 rounded-full border border-white/90 bg-gradient-to-b from-rose-100 to-pink-100/90 px-3 py-1 shadow-[0_2px_6px_rgba(190,40,80,0.1),inset_0_1px_2px_#fff] dark:border-white/10 dark:from-rose-950/90 dark:to-rose-900/70">
            {isEditMode ? (
              <Pencil className="h-3 w-3 text-rose-500 dark:text-rose-300" />
            ) : (
              <Camera className="h-3 w-3 text-rose-500 dark:text-rose-300" />
            )}
            <span className="text-[10px] font-black tracking-wider uppercase text-[#8f2440] dark:text-rose-200">
              {isEditMode ? `Edit Instant · ${initialData?.profile || activeProfile}` : `Instant · ${activeProfile}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/90 bg-white/90 text-[#6e2236] shadow-[0_2px_6px_rgba(140,30,60,0.1),inset_0_1px_1px_#fff] transition hover:bg-rose-500 hover:text-white active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-rose-200"
            aria-label="Tutup"
          >
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* True Squircle Viewfinder (rounded-[22%] matches SQUIRCLE_CURVE_PATH 100%) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-[22%] border-[2.5px] border-white bg-[#17090e] shadow-[0_10px_28px_rgba(120,20,50,0.18),inset_0_0_0_1px_rgba(255,255,255,0.2)] dark:border-rose-200/20">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Instant preview"
              className="h-full w-full object-cover"
            />
          ) : stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-5 text-center text-white/85">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <Camera className="h-6 w-6 text-rose-300" />
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-rose-100/80">
                {cameraError || 'Menyiapkan kamera...'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-rose-400 to-rose-600 px-4 py-1.5 text-[11px] font-extrabold text-white shadow-[0_4px_12px_rgba(225,29,72,0.4),inset_0_1px_2px_rgba(255,255,255,0.6)] active:scale-95"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Pilih dari Galeri</span>
              </button>
            </div>
          )}

          {/* Soft Top-Left Vignette when caption is present so white text is always readable */}
          {caption.trim() && (
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,0,0,0.32)_0%,transparent_55%)]"
              aria-hidden="true"
            />
          )}

          {/* True Squircle-Hugging Curved Caption */}
          {caption.trim() && (
            <svg
              viewBox="0 0 400 400"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <defs>
                <path id="instant-modal-curve" d={SQUIRCLE_CURVE_PATH} fill="none" />
                <filter id="caption-shadow-modal" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.65" />
                </filter>
              </defs>
              <text
                fill="#ffffff"
                fontSize={getCurvedCaptionFontSize(caption)}
                fontWeight="800"
                letterSpacing="1.4"
                filter="url(#caption-shadow-modal)"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <textPath
                  href="#instant-modal-curve"
                  startOffset={getCurvedCaptionStartOffset(caption)}
                >
                  {caption.toUpperCase()}
                </textPath>
              </text>
            </svg>
          )}

          {/* Retake Floating Clay Pill */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleRetake}
              className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/40 bg-black/55 px-2.5 py-1 text-[9.5px] font-extrabold text-white shadow-md backdrop-blur-md transition hover:bg-black/75 active:scale-95"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              <span>{isEditMode && previewUrl === initialData?.photoUrl ? 'Ganti Foto' : 'Foto Ulang'}</span>
            </button>
          )}
        </div>

        {/* Compact 3D Clay Caption Input */}
        <div className="mt-2.5 w-full">
          <input
            type="text"
            maxLength={42}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tulis caption melengkung... (opsional)"
            className="w-full rounded-full border border-white/90 bg-white/85 px-4 py-1.5 text-center text-[11.5px] font-extrabold text-[#4a1623] shadow-[inset_0_2px_4px_rgba(160,40,70,0.08),0_2px_6px_rgba(255,255,255,0.8)] transition placeholder:font-semibold placeholder:text-[#8c4f60]/55 focus:border-rose-300 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-black/35 dark:text-rose-100 dark:placeholder:text-rose-200/40"
          />
        </div>

        {/* 3D Clay Mood (Chibi) & Upgraded Rating Card */}
        <div className="mt-2 flex w-full flex-col gap-2 rounded-[1.4rem] border border-white/90 bg-gradient-to-b from-white/90 to-[#fff0f5]/90 p-2.5 shadow-[0_6px_16px_rgba(150,30,60,0.06),inset_0_2px_4px_#ffffff] dark:border-white/10 dark:from-white/10 dark:to-white/5">
          {/* Upgraded Rating Row */}
          <div className="flex items-center justify-between gap-1 border-b border-rose-200/45 pb-1.5 dark:border-white/10">
            <div className="flex flex-col text-left">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-[#99334c] dark:text-rose-300">
                Mood Meter
              </span>
              <span className="text-[10.5px] font-extrabold text-[#4a1623] dark:text-rose-100">
                {RATING_LABELS[rating]}
              </span>
            </div>

            {/* 3D Puffy Heart Rating Pills */}
            <div className="flex items-center gap-1 rounded-full bg-rose-100/70 p-1 shadow-inner dark:bg-black/30">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setRating(star);
                    }}
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 active:scale-75 ${
                      active
                        ? 'bg-gradient-to-b from-[#ff7aa2] to-[#e11d48] text-white shadow-[0_2px_5px_rgba(225,29,72,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.8)] scale-105'
                        : 'bg-white/70 text-rose-300 hover:bg-white dark:bg-white/10 dark:text-white/25'
                    }`}
                    title={`Rating ${star}/5`}
                  >
                    <Heart
                      className={`h-3 w-3 transition-transform ${
                        active ? 'fill-white text-white scale-105' : 'fill-current'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chibi Mood Selector (Tetap Pakai Chibi dengan Kapsul 3D Clay) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {moodOptions.map((opt) => {
              const isSelected = expression === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setExpression(opt.id);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[10.5px] font-extrabold transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#ff6b98] to-[#e11d48] text-white shadow-[0_4px_10px_rgba(225,29,72,0.3),inset_0_2px_3px_rgba(255,255,255,0.65)] scale-[1.03]'
                      : 'border border-white/90 bg-gradient-to-b from-white to-[#fff2f6] text-[#682436] shadow-[0_2px_4px_rgba(140,30,60,0.06),inset_0_1px_2px_#fff] hover:from-rose-50 hover:to-rose-100/60 dark:border-white/10 dark:from-white/15 dark:to-white/5 dark:text-rose-200'
                  }`}
                >
                  <img
                    src={moodImage(initialData?.profile || activeProfile, opt.id)}
                    alt={opt.label}
                    className="h-6 w-6 rounded-full object-cover object-top bg-rose-50 border border-white shadow-2xs"
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom 3D Clay Shutter & Action Bar */}
        <div className="mt-3 flex w-full items-center justify-between px-3">
          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/95 bg-gradient-to-b from-white to-[#ffeef3] text-[#7a243b] shadow-[0_4px_10px_rgba(140,30,60,0.1),inset_0_2px_3px_#fff] transition hover:scale-105 active:scale-90 dark:border-white/15 dark:from-white/15 dark:to-white/5 dark:text-rose-200"
            title="Pilih dari Galeri"
            aria-label="Pilih dari Galeri"
          >
            <ImageIcon className="h-4 w-4 text-rose-500 dark:text-rose-300" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 3D Clay Shutter / Save Button */}
          {!previewUrl ? (
            <button
              type="button"
              onClick={() => void handleCapturePhoto()}
              className="group flex h-15 w-15 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-rose-300 to-rose-400 p-1 shadow-[0_6px_18px_rgba(225,60,100,0.32),inset_0_2px_4px_#ffffff] transition-transform hover:scale-105 active:scale-90"
              title="Jepret Instant"
              aria-label="Jepret Instant"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-white to-[#ffe6ee] shadow-inner">
                <div className="h-5 w-5 rounded-full bg-gradient-to-b from-[#ff6b98] to-[#e11d48] shadow-[0_2px_6px_rgba(225,29,72,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.7)] transition-transform group-hover:scale-110" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="mx-2.5 flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-300/40 bg-gradient-to-b from-[#ff6b98] via-[#f43f5e] to-[#e11d48] px-5 text-xs font-black tracking-wide text-white shadow-[0_6px_18px_rgba(225,29,72,0.38),inset_0_2px_4px_rgba(255,255,255,0.65)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Instant'}</span>
                  <Sparkles className="h-3.5 w-3.5 fill-amber-200 text-amber-200" />
                </>
              )}
            </button>
          )}

          {/* Flip Camera Button */}
          {!previewUrl ? (
            <button
              type="button"
              onClick={handleFlipCamera}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/95 bg-gradient-to-b from-white to-[#ffeef3] text-[#7a243b] shadow-[0_4px_10px_rgba(140,30,60,0.1),inset_0_2px_3px_#fff] transition hover:scale-105 active:scale-90 dark:border-white/15 dark:from-white/15 dark:to-white/5 dark:text-rose-200"
              title="Balik Kamera"
              aria-label="Balik Kamera"
            >
              <RefreshCw className="h-4 w-4 text-rose-500 dark:text-rose-300" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
