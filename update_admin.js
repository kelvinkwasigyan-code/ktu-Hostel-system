const fs = require('fs');
const bcrypt = require('bcrypt');
const path = './backend/src/config/mock_db.json';

async function updateAdmin() {
  try {
    let data = fs.readFileSync(path, 'utf8');
    let db = JSON.parse(data);
    
    // Find admin user
    let admin = db.users.find(u => u.role === 'Admin');
    if (admin) {
      admin.email = 'kelvinkwasigyan@gmail.com';
      admin.password_hash = await bcrypt.hash('Richbanny123', 12);
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
