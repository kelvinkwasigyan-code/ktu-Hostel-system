import fs from 'fs';
import bcrypt from 'bcryptjs';
const path = './backend/src/config/mock_db.json';

async function updateAdmin() {
  try {
    let data = fs.readFileSync(path, 'utf8');
    let db = JSON.parse(data);
    
    // Find admin user
    let admin = db.users.find(u => u.role === 'Admin');
    if (admin) {
      admin.email = 'admin@ktu.edu.gh';
      admin.password_hash = await bcrypt.hash('Admin123!', 12);
      fs.writeFileSync(path, JSON.stringify(db, null, 2));
      console.log('Successfully updated Admin credentials in mock_db.json');
    } else {
      console.log('Admin user not found');
    }
  } catch (e) {
    console.error(e);
  }
}

updateAdmin();
