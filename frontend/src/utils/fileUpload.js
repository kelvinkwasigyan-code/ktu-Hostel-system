// src/utils/fileUpload.js
import supabase from '../services/supabaseClient';

/**
 * Resizes and compresses an image File using HTML Canvas
 * Returns a Promise resolving to a JPEG Base64 Data URL
 */
export const compressImageFile = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file (image or document).
 * Tries Supabase Storage first. If bucket is unavailable or fails, falls back to local data URL compression.
 */
export const processAndUploadFile = async (file, folder = 'properties') => {
  // Try Supabase Storage if configured
  if (supabase) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const bucketName = folder === 'documents' ? 'id-documents' : 'property-images';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase Storage upload bypassed, using compressed data encoding:', err.message);
    }
  }

  // Fallback: Compress image and convert to Data URL (base64)
  if (file.type && file.type.startsWith('image/')) {
    return await compressImageFile(file);
  }

  // Fallback for non-image documents (e.g. PDF)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
