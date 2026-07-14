// backend/src/config/mockSupabase.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DB_STATE } from './mockDbData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'mock_db.json');

// Synchronously load or create the JSON database file
let inMemoryDb = null;

function loadDb() {
  if (inMemoryDb) return inMemoryDb;

  if (!fs.existsSync(dbFilePath)) {
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(INITIAL_DB_STATE, null, 2), 'utf-8');
    } catch (e) {
      console.warn('⚠️ Writable filesystem not available (Vercel/Read-only), using in-memory database fallback.');
    }
    inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DB_STATE));
    return inMemoryDb;
  }
  try {
    const content = fs.readFileSync(dbFilePath, 'utf-8');
    inMemoryDb = JSON.parse(content);
    return inMemoryDb;
  } catch (err) {
    console.error('Error reading mock DB file, resetting to initial state:', err);
    inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DB_STATE));
    return inMemoryDb;
  }
}

function saveDb(data) {
  inMemoryDb = data;
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Error writing to mock DB file (read-only filesystem):', err.message);
  }
}

function getNestedValue(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function resolveRelationships(row, table, db) {
  const result = { ...row };
  
  // Guess the table type if not explicitly provided
  const targetTable = table || (
    row.price_per_semester !== undefined ? 'properties' :
    row.booking_id !== undefined ? 'bookings' :
    row.review_id !== undefined ? 'reviews' :
    null
  );

  if (targetTable === 'properties') {
    // Join users (landlord) -> users!landlord_id
    const landlord = db.users.find(u => u.user_id === row.landlord_id);
    result.users = landlord ? { ...landlord } : null;

    // Join property_images
    const images = db.property_images.filter(img => img.property_id === row.property_id);
    result.property_images = images;
  }

  if (targetTable === 'bookings') {
    // Join properties
    const property = db.properties.find(p => p.property_id === row.property_id);
    result.properties = property ? resolveRelationships(property, 'properties', db) : null;

    // Join users (student)
    const student = db.users.find(u => u.user_id === row.student_id);
    result.users = student ? { ...student } : null;
  }

  if (targetTable === 'reviews') {
    // Join users (student)
    const student = db.users.find(u => u.user_id === row.student_id);
    result.users = student ? { ...student } : null;

    // Join properties
    const property = db.properties.find(p => p.property_id === row.property_id);
    result.properties = property ? resolveRelationships(property, 'properties', db) : null;
  }

  return result;
}

function matchesFilters(row, filters, db) {
  for (let filter of filters) {
    const { type, col, val } = filter;
    let actualVal = getNestedValue(row, col);

    // If actualVal is undefined and is a nested path, resolve relations first
    if (actualVal === undefined && col.includes('.') && db) {
      const tempRow = resolveRelationships(row, null, db);
      actualVal = getNestedValue(tempRow, col);
    }

    if (type === 'eq') {
      if (actualVal != val) return false;
    } else if (type === 'in') {
      if (!Array.isArray(val) || !val.some(v => v == actualVal)) return false;
    } else if (type === 'lt') {
      if (!(actualVal < val)) return false;
    } else if (type === 'lte') {
      if (!(actualVal <= val)) return false;
    } else if (type === 'gte') {
      if (!(actualVal >= val)) return false;
    } else if (type === 'ilike') {
      const searchPattern = typeof val === 'string' ? val.replace(/%/g, '').toLowerCase() : '';
      if (typeof actualVal !== 'string' || !actualVal.toLowerCase().includes(searchPattern)) return false;
    }
  }
  return true;
}

async function executeMockQuery(q) {
  const db = loadDb();
  let tableData = db[q.table] || [];

  // Deep copy to prevent mutating the database state directly
  tableData = JSON.parse(JSON.stringify(tableData));

  // If method is insert
  if (q.method === 'insert') {
    const rows = Array.isArray(q.data) ? q.data : [q.data];
    const insertedRows = [];
    
    // Identify auto-increment ID field name
    const idFieldName = {
      users: 'user_id',
      properties: 'property_id',
      property_images: 'image_id',
      bookings: 'booking_id',
      reviews: 'review_id',
      notifications: 'notification_id',
      vacancy_alerts: 'alert_id'
    }[q.table] || 'id';

    for (let row of rows) {
      const maxId = db[q.table]?.reduce((max, r) => r[idFieldName] > max ? r[idFieldName] : max, 0) || 0;
      const newRow = {
        ...row,
        [idFieldName]: maxId + 1,
        created_at: row.created_at || new Date().toISOString()
      };
      db[q.table].push(newRow);
      insertedRows.push(newRow);
    }
    saveDb(db);
    return q.isSingle ? { data: insertedRows[0], error: null } : { data: insertedRows, error: null };
  }

  // If method is update
  if (q.method === 'update') {
    const matchingIndices = [];
    tableData.forEach((row, idx) => {
      if (matchesFilters(row, q.filters, db)) {
        matchingIndices.push(idx);
      }
    });

    const updatedRows = [];
    for (let idx of matchingIndices) {
      const dbRow = db[q.table][idx];
      const updatedRow = {
        ...dbRow,
        ...q.data,
        updated_at: new Date().toISOString()
      };
      db[q.table][idx] = updatedRow;
      updatedRows.push(updatedRow);
    }
    saveDb(db);
    return q.isSingle ? { data: updatedRows[0], error: null } : { data: updatedRows, error: null };
  }

  // If method is delete
  if (q.method === 'delete') {
    const remainingRows = [];
    const deletedRows = [];
    
    db[q.table].forEach((row) => {
      if (matchesFilters(row, q.filters, db)) {
        deletedRows.push(row);
      } else {
        remainingRows.push(row);
      }
    });
    
    db[q.table] = remainingRows;
    saveDb(db);
    return { data: deletedRows, error: null };
  }

  // Select logic
  let filtered = tableData.filter(row => matchesFilters(row, q.filters, db));

  // Resolve relationships (joins)
  filtered = filtered.map(row => resolveRelationships(row, q.table, db));

  // Handle sorting
  if (q.orderVal) {
    const { col, ascending } = q.orderVal;
    filtered.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];
      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
  }

  const totalCount = filtered.length;

  // Handle range/limit pagination
  if (q.rangeVal) {
    const { start, end } = q.rangeVal;
    filtered = filtered.slice(start, end + 1);
  }
  if (q.limitVal) {
    filtered = filtered.slice(0, q.limitVal);
  }

  if (q.isSingle) {
    if (filtered.length === 0) {
      return { data: null, error: { message: 'Not found' } };
    }
    return { data: filtered[0], error: null };
  }

  return { data: filtered, error: null, count: totalCount };
}

class MockQueryBuilder {
  constructor(table, filters = [], method = 'select', data = null, range = null, order = null, limit = null, isSingle = false) {
    this.table = table;
    this.filters = filters;
    this.method = method;
    this.data = data;
    this.rangeVal = range;
    this.orderVal = order;
    this.limitVal = limit;
    this.isSingle = isSingle;
  }
  
  select(fields = '*') {
    if (this.method !== 'insert' && this.method !== 'update' && this.method !== 'delete') {
      this.method = 'select';
    }
    return this;
  }
  
  insert(data) {
    this.method = 'insert';
    this.data = data;
    return this;
  }

  update(data) {
    this.method = 'update';
    this.data = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  in(col, vals) {
    this.filters.push({ type: 'in', col, val: vals });
    return this;
  }

  lt(col, val) {
    this.filters.push({ type: 'lt', col, val });
    return this;
  }

  lte(col, val) {
    this.filters.push({ type: 'lte', col, val });
    return this;
  }

  gte(col, val) {
    this.filters.push({ type: 'gte', col, val });
    return this;
  }

  ilike(col, pattern) {
    this.filters.push({ type: 'ilike', col, val: pattern });
    return this;
  }

  order(col, options = {}) {
    this.orderVal = { col, ascending: options.ascending !== false };
    return this;
  }

  range(start, end) {
    this.rangeVal = { start, end };
    return this;
  }

  limit(count) {
    this.limitVal = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Thenable structure to support await directly on chain builder
  async then(resolve, reject) {
    try {
      const result = await executeMockQuery(this);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }
}

export function createMockSupabase() {
  return {
    from(table) {
      return new MockQueryBuilder(table);
    }
  };
}
