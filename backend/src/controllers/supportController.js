import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from './notificationController.js';

export const submitSupportRequest = async (req, res) => {
  try {
    const { topic, message, name, email } = req.body;
    const user = req.user; // from optionalAuthenticate middleware

    if (!topic || !message) {
      return res.status(400).json({ error: 'Topic and message are required.' });
    }

    const senderName = user ? user.full_name : name;
    const senderRole = user ? user.role : 'Guest';
    const senderEmail = user ? user.email : email;

    // Find admin users
    const { data: admins, error: adminErr } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('role', 'Admin');

    if (adminErr || !admins || admins.length === 0) {
      return res.status(500).json({ error: 'Failed to contact support. No admin found.' });
    }

    // Construct the notification message
    const supportMsg = `Support Request [${topic}]:\nFrom: ${senderName} (${senderRole} - ${senderEmail})\nMessage: ${message}`;

    // Send a notification to all admins
    for (const admin of admins) {
      await notifyUser(
        admin.user_id,
        'System',
        supportMsg,
        null,
        null,
        'InApp'
      );
    }

    res.json({ message: 'Support request sent successfully.' });
  } catch (err) {
    console.error('submitSupportRequest error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
