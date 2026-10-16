-- Canvas WebP encoding may fall back to PNG in browsers without WebP support.
update storage.buckets
set public = false,
    file_size_limit = 786432,
    allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg']
where id = 'daily-diary';
