import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import mysql from 'mysql2/promise'

const secretsDirectory = join(process.cwd(), 'local-secrets')
const credentialsPath = join(secretsDirectory, 'tidb-credentials.json')
const caPath = join(secretsDirectory, 'isrgrootx1.pem')
const migrateOnly = process.argv.includes('--migrate-only')
const dumpPath = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(
    secretsDirectory,
    'if0_43113761_batangai.sql',
    'if0_43113761_batangai.sql',
  )

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`The private TiDB credentials file is missing ${name}.`)
  }
  return value.trim()
}

const credentials = JSON.parse(await readFile(credentialsPath, 'utf8'))
const host = requiredString(credentials.host, 'host')
const user = requiredString(credentials.user, 'user')
const password = requiredString(credentials.password, 'password')
const database = requiredString(credentials.database, 'database')
const port = Number(credentials.port)

if (database !== 'batangai') {
  throw new Error('The TiDB target database must be batangai.')
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('The TiDB port in the private credentials file is invalid.')
}
if (!/^[A-Za-z0-9.-]+\.tidbcloud\.com$/i.test(host)) {
  throw new Error('The TiDB host in the private credentials file is invalid.')
}

const ca = await readFile(caPath)
const dump = migrateOnly ? '' : await readFile(dumpPath, 'utf8')

if (!migrateOnly && /^\s*(?:CREATE\s+DATABASE|USE)\b/im.test(dump)) {
  throw new Error('The SQL export selects or creates a database; review it before importing.')
}

const connection = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl: { ca, rejectUnauthorized: true },
  connectTimeout: 20_000,
  multipleStatements: true,
  charset: 'utf8mb4',
})

let stage = 'checking the target database'
let targetWasNotEmpty = false
try {
  if (!migrateOnly) {
    const [tables] = await connection.query('SHOW FULL TABLES')
    if (tables.length > 0) {
      targetWasNotEmpty = true
      const tableNames = tables
        .map((row) => Object.values(row)[0])
        .filter((value) => typeof value === 'string')
      const tableCounts = []
      for (const tableName of tableNames) {
        const escapedName = tableName.replaceAll('`', '``')
        const [countRows] = await connection.query(
          `SELECT COUNT(*) AS rowCount FROM \`${escapedName}\``,
        )
        tableCounts.push(`${tableName}: ${countRows[0].rowCount}`)
      }
      console.error(`Tables already present (counts only): ${tableCounts.join(', ')}`)
      throw new Error('TARGET_NOT_EMPTY')
    }

    stage = 'importing the SQL dump'
    await connection.query(dump)
  }

  stage = 'applying the Vercel schema migration'
  const migration = await readFile(
    join(process.cwd(), 'database', 'vercel_migration.sql'),
    'utf8',
  )
  await connection.query(migration)

  stage = 'verifying imported tables'
  const [importedTables] = await connection.query('SHOW FULL TABLES')
  console.log(
    `${migrateOnly ? 'Database migration' : 'Database import'} complete. `
    + `${importedTables.length} tables are present.`,
  )
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : 'UNKNOWN'
  const name = error && typeof error === 'object' && 'name' in error
    ? String(error.name)
    : 'Error'
  const reason = targetWasNotEmpty
    ? 'The target database already contains tables; import stopped without changing it.'
    : ''
  console.error(
    `Database import failed while ${stage} (error: ${name}, code: ${code}). ${reason} `
    + 'No SQL data or credentials were printed.',
  )
  process.exitCode = 1
} finally {
  await connection.end()
}
