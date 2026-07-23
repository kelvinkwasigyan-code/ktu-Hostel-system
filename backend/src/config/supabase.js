// backend/src/config/supabase.js
// Supabase client initialization & smart fallback mechanism
import { createClient } from '@supabase/supabase-js';
import { createMockSupabase } from './mockSupabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isPlaceholder = 
  !supabaseUrl || 
  supabaseUrl.includes('placeholder-url') || 
  supabaseUrl.includes('your_supabase_project_url');

let remoteAdmin = null;
let mockAdmin = null;

if (!isPlaceholder && supabaseUrl && supabaseServiceKey) {
  try {
    remoteAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } catch (e) {
    console.error('Error initializing remote Supabase client:', e);
  }
}

mockAdmin = createMockSupabase();

const isFallbackError = (err) => {
  if (!err) return false;
  const code = err.code || err.statusCode;
  return code === 'PGRST205' || code === 'PGRST204' || code === 'PGRST100' || code === '42703' || code === '42P01';
};

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (table) => {
        if (!remoteAdmin) {
          return mockAdmin.from(table);
        }

        const remoteQuery = remoteAdmin.from(table);
        const mockQuery = mockAdmin.from(table);

        return new Proxy(remoteQuery, {
          get(qTarget, qProp) {
            if (qProp === 'then') {
              return (onFulfilled, onRejected) => {
                return remoteQuery.then(res => {
                  if (res && res.error && isFallbackError(res.error)) {
                    return mockQuery.then(onFulfilled, onRejected);
                  }
                  return onFulfilled(res);
                }, err => {
                  return mockQuery.then(onFulfilled, onRejected);
                });
              };
            }
            const orig = qTarget[qProp];
            if (typeof orig === 'function') {
              return (...args) => {
                const res = orig.apply(qTarget, args);
                if (res && typeof res.then === 'function') {
                  return new Proxy(res, {
                    get(rTarget, rProp) {
                      if (rProp === 'then') {
                        return (onF, onR) => {
                          return rTarget.then(resData => {
                            if (resData && resData.error && isFallbackError(resData.error)) {
                              return mockQuery[qProp](...args).then(onF, onR);
                            }
                            return onF(resData);
                          }, err => {
                            return mockQuery[qProp](...args).then(onF, onR);
                          });
                        };
                      }
                      return rTarget[rProp];
                    }
                  });
                }
                return res;
              };
            }
            return orig;
          }
        });
      };
    }
    if (remoteAdmin && remoteAdmin[prop]) {
      return remoteAdmin[prop];
    }
    return mockAdmin[prop];
  }
});

export const supabase = remoteAdmin || supabaseAdmin;

if (remoteAdmin) {
  remoteAdmin.from('users').select('count', { count: 'exact', head: true }).then(res => {
    if (res.error && res.error.code === 'PGRST205') {
      console.log('ℹ️  [DB CONFIG] Remote Supabase connected (' + supabaseUrl + '). Note: Run database/schema.sql & seed.sql in Supabase SQL Editor to create remote tables. Seamless fallback active.');
    } else if (!res.error) {
      console.log('✅ [DB CONFIG] Connected & active on remote Supabase database (' + supabaseUrl + ')');
    } else {
      console.log('✅ [DB CONFIG] Remote Supabase connected (' + supabaseUrl + ')');
    }
  }).catch(() => {
    console.log('⚠️  [DB CONFIG] Remote Supabase fallback to local DB');
  });
} else {
  console.log('⚠️  [DB CONFIG] Using Local JSON Database (Mock Supabase)');
}

export default supabaseAdmin;
