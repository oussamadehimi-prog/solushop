import { createClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGE_BUCKET = "image";
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Supabase Storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY on the server.",
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function uploadProductImage(path: string, file: File) {
  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function removeProductImages(paths: string[]) {
  if (paths.length === 0) return;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove(paths);

  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}

export function getProductStoragePath(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const prefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    if (!pathname.startsWith(prefix)) return null;
    return decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
}
