import supabase from '../services/supabaseClient';

// Upload Function (Attempts 'ID-images' bucket, falls back to 'id-documents')
export async function uploadLandlordID(file, userId) {
  const fileExt = file?.name ? file.name.split('.').pop() : 'png';
  const filePath = `${userId}/id_document.${fileExt}`;

  // Upload to 'ID-images' bucket
  const { data: imgData, error: imgError } = await supabase.storage
    .from('ID-images')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600'
    });

  if (!imgError && imgData) {
    return imgData.path;
  }

  // Fallback to 'id-documents' bucket
  const { data, error } = await supabase.storage
    .from('id-documents')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;
  return data.path;
}

// Generate Secure Temporary URL (For Admin Review Panel)
export async function getSecureDocumentUrl(filePath) {
  // Try signed URL from 'ID-images' bucket
  const { data: imgData } = await supabase.storage
    .from('ID-images')
    .createSignedUrl(filePath, 300);

  if (imgData?.signedUrl) return imgData.signedUrl;

  const { data, error } = await supabase.storage
    .from('id-documents')
    .createSignedUrl(filePath, 300);

  if (error) throw error;
  return data.signedUrl;
}
