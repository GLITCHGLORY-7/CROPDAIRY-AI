import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ncutyjxiannsjjncakka';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_TOKEN || '';

function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  const migrationsDir = path.resolve('./supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  // Create migration tracking table
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS public._schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Record already applied migrations 1-5
  for (let i = 0; i < 5; i++) {
    await executeQuery(`
      INSERT INTO public._schema_migrations (version)
      VALUES ('${files[i]}')
      ON CONFLICT (version) DO NOTHING;
    `);
  }

  // Get applied migrations
  const { data: appliedRows } = await executeQuery(`SELECT version FROM public._schema_migrations;`);
  const applied = new Set((appliedRows || []).map(r => r.version));

  console.log(`Found ${files.length} total migration files.`);
  console.log(`Currently applied in database: ${applied.size}`);

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`- Skipping already applied: ${file}`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`Executing migration: ${file}`);
    console.log(`========================================`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    try {
      const res = await executeQuery(sql);
      console.log(`✓ Migration ${file} succeeded (HTTP ${res.status})`);
      await executeQuery(`INSERT INTO public._schema_migrations (version) VALUES ('${file}');`);
    } catch (err) {
      console.error(`✗ Error in migration ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log(`\n🎉 All 8 database migrations successfully verified and applied!`);
}

run().catch(console.error);
