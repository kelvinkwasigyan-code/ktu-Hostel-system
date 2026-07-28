import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const file = req.file;
    const { hostelId, landlordId, amount, studentId } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No receipt file provided.' });
    }

    const fileName = `receipt_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let receiptUrl = '';

    // Check if Supabase Storage is available (requires remote Supabase to be configured)
    if (supabaseAdmin.storage) {
      // 1. Upload receipt to Supabase Storage
      const { data: storageData, error: storageError } = await supabaseAdmin.storage
        .from('payment-receipts')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (storageError) throw storageError;

      // 2. Get Public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);
        
      receiptUrl = urlData.publicUrl;
    } else {
      // Fallback for local mock DB: Convert image buffer to Base64 data URL
      const base64Data = file.buffer.toString('base64');
      receiptUrl = `data:${file.mimetype};base64,${base64Data}`;
    }

    // 3. Save Payment Record in Postgres Database (or mock DB)
    const { data, error: dbError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          student_id: studentId,
          landlord_id: landlordId,
          hostel_id: hostelId,
          amount: parseFloat(amount),
          receipt_url: receiptUrl,
          status: 'pending',
        },
      ]);

    if (dbError) throw dbError;

    res.json({ success: true, message: 'Receipt submitted successfully!' });
  } catch (err) {
    console.error('Upload receipt error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
