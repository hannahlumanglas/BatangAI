import mysql from 'mysql2/promise'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

type SqlValue = string | number | boolean | Date | null

let connectionPool: Pool | undefined

export function getPool(): Pool {
  if (connectionPool) {
    return connectionPool
  }

  const connectionUrl = process.env.MYSQL_URL
  if (!connectionUrl) {
    throw new Error('MYSQL_URL is not configured.')
  }

  connectionPool = mysql.createPool(connectionUrl)
  return connectionPool
}

export async function getRow<T extends RowDataPacket>(
  sql: string,
  values: SqlValue[] = [],
): Promise<T | undefined> {
  const [rows] = await getPool().execute<T[]>(sql, values)
  return rows[0]
}

export async function getRows<T extends RowDataPacket>(
  sql: string,
  values: SqlValue[] = [],
): Promise<T[]> {
  const [rows] = await getPool().execute<T[]>(sql, values)
  return rows
}

export async function execute(
  sql: string,
  values: SqlValue[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, values)
  return result
}
