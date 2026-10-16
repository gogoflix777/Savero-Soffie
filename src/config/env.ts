export const getGoogleMapsApiKey = (): string => {
  const value = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();

  if (!value) {
    console.warn(
      'VITE_GOOGLE_MAPS_API_KEY is missing. Add it to your local .env file or Cloudflare build environment, then redeploy.'
    );
  }

  return value;
};

export const getTmdbApiKey = (): string => {
  return (import.meta.env.VITE_TMDB_API_KEY ?? '').trim();
};

export const getCartoApiKey = (): string => {
  return (import.meta.env.VITE_CARTO_API_KEY ?? '').trim();
};
