// Must match the mri-scans bucket limit in supabase/schema.sql (4194304 bytes)
// and stay under Vercel's 4.5 MB request body limit for the AI service.
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function validateUpload(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Please choose a JPG, PNG, WEBP or BMP image.";
  if (file.size > MAX_UPLOAD_BYTES)
    return `Image is ${formatBytes(file.size)}. The maximum is ${MAX_UPLOAD_MB} MB.`;
  return null;
}
