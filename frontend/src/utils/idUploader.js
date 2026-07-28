import supabase from '../services/supabaseClient';

// Upload Function
export async function uploadLandlordID(file, userId) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/id_document.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('id-documents')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;
  return data.path; // Save this path in your database table
}

// Generate Secure Temporary URL (For Admin Review Panel)
export async function getSecureDocumentUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('id-documents')
    .createSignedUrl(filePath, 300); // URL expires in 5 minutes (300 seconds)

  if (error) throw error;
  return data.signedUrl;
}
