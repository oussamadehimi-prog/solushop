const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

function getStorageConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase Storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY on the server.");
  }

  return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), secretKey };
}

export async function uploadProductImage(path: string, content: Buffer, contentType: string) {
  const { supabaseUrl, secretKey } = getStorageConfig();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      apikey: secretKey,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: content as unknown as BodyInit,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase Storage upload failed (${response.status}): ${details}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
