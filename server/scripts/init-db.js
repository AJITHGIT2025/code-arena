const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function initDatabase() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('[Database Init] schema.prisma not found at:', schemaPath);
    return;
  }

  let schema = fs.readFileSync(schemaPath, 'utf8');
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';
  const currentProvider = schema.includes('provider = "postgresql"') ? 'postgresql' : 'sqlite';

  if (currentProvider !== targetProvider) {
    console.log(`[Database Init] Switching Prisma provider from "${currentProvider}" to "${targetProvider}"...`);
    schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
    fs.writeFileSync(schemaPath, schema, 'utf8');

    console.log('[Database Init] Regenerating Prisma Client for', targetProvider, '...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }

  console.log(`[Database Init] Pushing schema to database (${targetProvider})...`);
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // Run database seed if needed
  try {
    const seedPath = path.join(__dirname, '../dist/db/seed.js');
    if (fs.existsSync(seedPath)) {
      console.log('[Database Init] Ensuring default admin and baseline questions are seeded...');
      execSync('node dist/db/seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    }
  } catch (err) {
    console.warn('[Database Init] Seed notice (non-fatal):', err.message);
  }

  console.log('[Database Init] Database ready!');
}

initDatabase();
