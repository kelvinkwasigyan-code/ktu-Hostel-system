const fs = require('fs');
const path = './backend/src/config/mock_db.json';

try {
  const data = fs.readFileSync(path, 'utf8');
  const db = JSON.parse(data);
  let changed = false;

  db.properties.forEach(p => {
    if (p.neighborhood === 'Ashanti Nkwanta' || p.neighborhood === 'Akwadum') {
      p.neighborhood = 'KTU Main Campus Area';
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(path, JSON.stringify(db, null, 2));
    console.log('Updated mock_db.json');
  }
} catch (e) {
  console.error(e);
}
