import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn(
      'VITE_GOOGLE_MAPS_API_KEY is missing. Google Places proxy requests will fail until this env var is configured.'
    );
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'google-places-proxy',
        configureServer(server) {
          server.middlewares.use('/api/places/search', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const textQuery = parsed.textQuery || 'cafe Semarang';
                const maxResultCount = Math.min(parsed.maxResultCount || 15, 20);

                const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.googleMapsUri,places.photos,places.priceLevel,places.primaryType,places.editorialSummary',
                    'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1'
                  },
                  body: JSON.stringify({
                    textQuery,
                    maxResultCount,
                    locationBias: parsed.locationBias || {
                      circle: {
                        center: { latitude: -6.9932, longitude: 110.4203 },
                        radius: 8000.0
                      }
                    }
                  })
                });

                const data = await response.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });

          // Google Places Photo Proxy endpoint
          server.middlewares.use('/api/places/photo', async (req, res) => {
            try {
              const url = new URL(req.url || '', 'http://localhost');
              const photoName = url.searchParams.get('name');
              if (!photoName) {
                res.statusCode = 400;
                res.end('Missing photo name parameter');
                return;
              }
              const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&key=${apiKey}&solution_id=gmp_git_agentskills_v1`;
              const photoRes = await fetch(photoUrl);
              if (!photoRes.ok) {
                res.statusCode = photoRes.status;
                res.end('Failed to fetch photo from Google Places');
                return;
              }
              const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              const buffer = await photoRes.arrayBuffer();
              res.end(Buffer.from(buffer));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(err.message);
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
