const fs = require('fs');
const path = './backend/src/config/mock_db.json';
try {
  let data = fs.readFileSync(path, 'utf8');
  let db = JSON.parse(data);
  if (db.properties) {
    db.properties = db.properties.map(p => {
      if (!p.payment_frequency) {
        p.payment_frequency = "Semester";
      }
      return p;
    });
    fs.writeFileSync(path, JSON.stringify(db, null, 2));
    console.log('Successfully updated mock_db.json properties.');
  }
} catch (e) {
  console.error(e);
}
