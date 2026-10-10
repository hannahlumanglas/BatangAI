import { del } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import bcrypt from 'bcryptjs'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { VercelApiHandler, VercelRequest, VercelResponse } from '@vercel/node'
import { execute, getPool, getRow, getRows } from '../server/db.js'

type JsonRecord = Record<string, unknown>
type UserRow = RowDataPacket & {
  userID: number
  dateCreated: string
  department: string
  email: string
  employeeId: string
  fullName: string
  password?: string
  profilePhoto: string | null
  role: string
  status: string
}

const SESSION_COOKIE = 'batangai_session'
const REMEMBER_COOKIE = 'batangai_remember'
const SESSION_DURATION = 8 * 60 * 60
const REMEMBER_DURATION = 30 * 24 * 60 * 60

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : ''
}

function json(req: VercelRequest): JsonRecord | null {
  return isRecord(req.body) ? req.body : null
}

function send(res: VercelResponse, status: number, body: JsonRecord): void {
  res.status(status).json(body)
}

function errorResponse(res: VercelResponse, message: string, status = 400): void {
  send(res, status, { success: false, message })
}

function parseCookies(req: VercelRequest): Record<string, string> {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    return req.cookies
  }

  const cookies: Record<string, string> = {}
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=')
    if (separator <= 0) continue
    const name = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    try {
      cookies[name] = decodeURIComponent(value)
    } catch {
      continue
    }
  }
  return cookies
}

function appendCookie(res: VercelResponse, value: string): void {
  const current = res.getHeader('Set-Cookie')
  const values = Array.isArray(current)
    ? current.map(String)
    : current
      ? [String(current)]
      : []
  res.setHeader('Set-Cookie', [...values, value])
}

function cookieString(
  name: string,
  value: string,
  maxAge: number,
  req: VercelRequest,
): string {
  const secure = req.headers['x-forwarded-proto'] === 'https'
    || process.env.VERCEL === '1'
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}

function clearCookie(res: VercelResponse, name: string, req: VercelRequest): void {
  appendCookie(res, cookieString(name, '', 0, req))
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.')
  }
  return secret
}

function createSessionToken(userID: number): string {
  const payload = `${userID}.${Math.floor(Date.now() / 1000) + SESSION_DURATION}`
  const signature = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url')
  return `${payload}.${signature}`
}

function readSessionUserID(req: VercelRequest): number | null {
  const token = parseCookies(req)[SESSION_COOKIE]
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [userID, expiresAt, signature] = parts
  if (!/^\d+$/.test(userID) || !/^\d+$/.test(expiresAt)) return null

  const payload = `${userID}.${expiresAt}`
  const expected = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest()
  let received: Buffer
  try {
    received = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null
  }
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return null
  return Number(userID)
}

function canonicalRole(role: string): string | null {
  const roles: Record<string, string> = {
    admin: 'Administrator',
    administrator: 'Administrator',
    secretary: 'Secretary',
    'it personnel': 'IT Personnel',
    employee: 'Employee',
  }
  return roles[role.trim().toLowerCase()] ?? null
}

function publicUser(user: UserRow): Omit<UserRow, 'password'> {
  const safeUser = { ...user }
  delete safeUser.password
  const role = canonicalRole(user.role)
  return { ...safeUser, role: role ?? user.role }
}

async function activeUser(userID: number): Promise<UserRow | undefined> {
  return getRow<UserRow>(
    `SELECT userID, dateCreated, department, email, employeeId, fullName,
            profilePhoto, role, status
     FROM users WHERE userID = ? LIMIT 1`,
    [userID],
  )
}

async function requireAdminSession(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const userID = readSessionUserID(req)
  if (!userID) {
    errorResponse(res, 'Please log in with an Administrator account.', 401)
    return false
  }

  const user = await activeUser(userID)
  if (!user || user.status.trim().toLowerCase() !== 'active') {
    errorResponse(res, 'This account is inactive or unavailable. Please log in again.', 401)
    return false
  }
  if (!adminRole(user.role)) {
    errorResponse(res, 'Only an Administrator can manage accounts.', 403)
    return false
  }
  return true
}

async function ensureRememberTable(): Promise<void> {
  await execute(`CREATE TABLE IF NOT EXISTS remember_tokens (
    tokenHash CHAR(64) NOT NULL PRIMARY KEY,
    userID INT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_remember_tokens_user (userID),
    INDEX idx_remember_tokens_expiry (expiresAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
}

function newRememberToken(): string {
  return randomBytes(32).toString('hex')
}

function hashRememberToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function adminRole(role: string): boolean {
  return ['admin', 'administrator'].includes(role.trim().toLowerCase())
}

function passwordIsStrong(password: string): boolean {
  return password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password)
}

async function hashPassword(password: string): Promise<string> {
  return (await bcrypt.hash(password, 10)).replace(/^\$2b\$/, '$2y$')
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function queryValue(req: VercelRequest, key: string): string {
  const raw = req.query[key]
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
}

function normalizedKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : []
    } catch {
      return []
    }
  }
  return []
}

const handler: VercelApiHandler = async (req, res) => {
  const origin = req.headers.origin
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (origin && configuredOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const route = decodeURIComponent((req.url ?? '').split('?')[0] ?? '')
    .replace(/^\/api\//, '')
    .replace(/\.php$/i, '')

  try {
    if (route === 'login') {
      await login(req, res)
    } else if (route === 'device_agent') {
      await deviceAgent(req, res)
    } else if (route === 'auth_session') {
      await authSession(req, res)
    } else if (route === 'logout') {
      await logout(req, res)
    } else if (route === 'get_incidents' || route === 'incidents') {
      await getIncidents(req, res)
    } else if (route === 'create_incident') {
      await createIncident(req, res)
    } else if (route === 'update_incident') {
      await updateIncident(req, res)
    } else if (route === 'delete_incident') {
      await deleteIncident(req, res)
    } else if (route === 'assign_incident') {
      await assignIncident(req, res)
    } else if (route === 'update_incident_status') {
      await updateIncidentStatus(req, res)
    } else if (route === 'users') {
      await users(req, res)
    } else if (route === 'it_personnel') {
      await itPersonnel(req, res)
    } else if (route === 'create_user') {
      await createUser(req, res)
    } else if (route === 'update_user') {
      await updateUser(req, res)
    } else if (route === 'update_user_status') {
      await updateUserStatus(req, res)
    } else if (route === 'delete_user') {
      await deleteUser(req, res)
    } else if (route === 'change_password') {
      await changePassword(req, res)
    } else if (route === 'devices' || route === 'add_device') {
      await devices(req, res)
    } else if (route === 'device_status_history') {
      await deviceStatusHistory(req, res)
    } else if (route === 'analyze_incident') {
      await analyzeIncident(req, res)
    } else if (route === 'upload_profile_photo') {
      await uploadProfilePhoto(req, res)
    } else {
      errorResponse(res, 'API endpoint not found.', 404)
    }
  } catch (error) {
    console.error(`API ${route} failed:`, error)
    if (!res.headersSent) {
      errorResponse(res, 'The server could not complete the request.', 500)
    }
  }
}

async function login(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  const data = json(req)
  const email = text(data?.email).toLowerCase()
  const password = typeof data?.password === 'string' ? data.password : ''
  if (!email || !password) {
    errorResponse(res, 'Email and password are required.')
    return
  }

  const user = await getRow<UserRow>(
    `SELECT userID, dateCreated, department, email, employeeId, fullName,
            password, profilePhoto, role, status
     FROM users WHERE LOWER(email) = ? LIMIT 1`,
    [email],
  )
  const storedPassword = user?.password ?? ''
  const bcryptCompatibleHash = storedPassword.replace(/^\$2y\$/, '$2b$')
  if (!user || !(await bcrypt.compare(password, bcryptCompatibleHash))) {
    errorResponse(res, 'Invalid email or password.', 401)
    return
  }
  if (user.status.trim().toLowerCase() !== 'active') {
    errorResponse(res, 'This account is inactive.', 403)
    return
  }
  const role = canonicalRole(user.role)
  if (!role) {
    errorResponse(res, 'This account has an invalid role configuration.', 500)
    return
  }

  appendCookie(res, cookieString(SESSION_COOKIE, createSessionToken(user.userID), SESSION_DURATION, req))
  const rememberMe = data?.rememberMe === true
  const cookies = parseCookies(req)
  if (rememberMe) {
    await ensureRememberTable()
    const oldToken = cookies[REMEMBER_COOKIE]
    if (oldToken && /^[a-f0-9]{64}$/.test(oldToken)) {
      await execute('DELETE FROM remember_tokens WHERE tokenHash = ?', [hashRememberToken(oldToken)])
    }
    const token = newRememberToken()
    const expires = new Date(Date.now() + REMEMBER_DURATION * 1000)
    await execute(
      'INSERT INTO remember_tokens (tokenHash, userID, expiresAt) VALUES (?, ?, ?)',
      [hashRememberToken(token), user.userID, expires],
    )
    appendCookie(res, cookieString(REMEMBER_COOKIE, token, REMEMBER_DURATION, req))
  } else if (cookies[REMEMBER_COOKIE]) {
    await ensureRememberTable()
    await execute('DELETE FROM remember_tokens WHERE tokenHash = ?', [hashRememberToken(cookies[REMEMBER_COOKIE])])
    clearCookie(res, REMEMBER_COOKIE, req)
  }

  send(res, 200, {
    success: true,
    message: 'Login successful.',
    user: publicUser({ ...user, role }),
  })
}

async function authSession(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }

  const cookies = parseCookies(req)
  let userID = readSessionUserID(req)
  let rememberToken = ''
  if (!userID) {
    rememberToken = cookies[REMEMBER_COOKIE] ?? ''
    if (!/^[a-f0-9]{64}$/.test(rememberToken)) {
      clearCookie(res, SESSION_COOKIE, req)
      errorResponse(res, 'Your session has expired. Please log in again.', 401)
      return
    }
    await ensureRememberTable()
    const token = await getRow<RowDataPacket & { userID: number }>(
      `SELECT userID FROM remember_tokens
       WHERE tokenHash = ? AND expiresAt > UTC_TIMESTAMP() LIMIT 1`,
      [hashRememberToken(rememberToken)],
    )
    if (!token) {
      clearCookie(res, REMEMBER_COOKIE, req)
      errorResponse(res, 'Your persistent login has expired. Please log in again.', 401)
      return
    }
    userID = Number(token.userID)
  }

  const user = await activeUser(userID)
  if (!user || user.status.trim().toLowerCase() !== 'active' || !canonicalRole(user.role)) {
    clearCookie(res, SESSION_COOKIE, req)
    clearCookie(res, REMEMBER_COOKIE, req)
    errorResponse(res, 'This account is inactive or unavailable. Please log in again.', 401)
    return
  }

  if (rememberToken) {
    await ensureRememberTable()
    const rotated = newRememberToken()
    const expires = new Date(Date.now() + REMEMBER_DURATION * 1000)
    const result = await execute(
      'UPDATE remember_tokens SET tokenHash = ?, expiresAt = ? WHERE tokenHash = ?',
      [hashRememberToken(rotated), expires, hashRememberToken(rememberToken)],
    )
    if (result.affectedRows !== 1) {
      clearCookie(res, REMEMBER_COOKIE, req)
      errorResponse(res, 'Your persistent login has expired. Please log in again.', 401)
      return
    }
    appendCookie(res, cookieString(SESSION_COOKIE, createSessionToken(userID), SESSION_DURATION, req))
    appendCookie(res, cookieString(REMEMBER_COOKIE, rotated, REMEMBER_DURATION, req))
  }

  send(res, 200, { success: true, user: publicUser(user) })
}

async function logout(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }

  const token = parseCookies(req)[REMEMBER_COOKIE]
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    await ensureRememberTable()
    await execute('DELETE FROM remember_tokens WHERE tokenHash = ?', [hashRememberToken(token)])
  }
  clearCookie(res, SESSION_COOKIE, req)
  clearCookie(res, REMEMBER_COOKIE, req)
  send(res, 200, { success: true, message: 'Logged out successfully.' })
}

async function getIncidents(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const userID = text(queryValue(req, 'userID'))
  if (!userID) {
    errorResponse(res, 'userID is required.')
    return
  }
  const user = await getRow<RowDataPacket & { role: string; status: string }>(
    'SELECT role, status FROM users WHERE userID = ? LIMIT 1',
    [userID],
  )
  if (!user) {
    errorResponse(res, 'User not found.', 404)
    return
  }
  if (user.status.trim().toLowerCase() !== 'active') {
    errorResponse(res, 'User account is inactive.', 403)
    return
  }

  const role = canonicalRole(user.role)
  const requestedScope = text(queryValue(req, 'scope')).toLowerCase()
  let where = ''
  let values: (string | number)[] = []
  if (role === 'Employee') {
    where = 'WHERE incidents.userId = ?'
    values = [userID]
  } else if (role === 'IT Personnel' && requestedScope !== 'all') {
    where = 'WHERE incidents.assignedTo = ?'
    values = [userID]
  }
  const incidents = await getRows<RowDataPacket>(
    `SELECT incidents.incidentID, incidents.affectedIssue, incidents.classification,
       incidents.keywords, incidents.connectionType, incidents.createdAt,
       incidents.department, incidents.description, incidents.deviceType,
       incidents.employeeName, incidents.issueCategory, incidents.location,
       incidents.resolvedAt, incidents.resolvedBy, incidents.severity,
       incidents.status, incidents.summary, incidents.troubleshooting,
       incidents.userId, incidents.assigned, incidents.assignedAt,
       incidents.assignedTo,
       COALESCE(NULLIF(assignee.fullName, ''), NULLIF(incidents.assignedToName, '')) AS assignedToName,
       incidents.durationMinutes, incidents.resolutionNotes, incidents.startedAt,
       reporter.profilePhoto AS reporterProfilePhoto,
       assignee.profilePhoto AS assignedToProfilePhoto
     FROM incidents
     LEFT JOIN users AS reporter ON reporter.userID = incidents.userId
     LEFT JOIN users AS assignee ON assignee.userID = incidents.assignedTo
     ${where}
     ORDER BY incidents.createdAt DESC`,
    values,
  )
  const normalized = incidents.map((incident) => ({
    ...incident,
    keywords: normalizedKeywords(incident.keywords),
  }))
  send(res, 200, { success: true, count: normalized.length, incidents: normalized })
}

async function createIncident(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  const data = json(req)
  if (!data) {
    errorResponse(res, 'Invalid JSON data.')
    return
  }

  const userId = text(data.userId)
  const affectedIssue = text(data.affectedIssue)
  const description = text(data.description)
  const issueCategory = text(data.issueCategory)
  const location = text(data.location)
  const severity = text(data.severity) || null
  if (!userId || !affectedIssue || !description || !issueCategory || !location) {
    errorResponse(res, 'Required incident information is missing.')
    return
  }
  if (severity && !['High', 'Medium', 'Low'].includes(severity)) {
    errorResponse(res, 'Severity must be High, Medium, or Low.')
    return
  }
  if (typeof data.resolvedByUser !== 'boolean') {
    errorResponse(res, 'Please confirm whether the issue was resolved by the self-help steps.')
    return
  }
  const employee = await getRow<RowDataPacket & {
    fullName: string; department: string; role: string; status: string
  }>(
    'SELECT fullName, department, role, status FROM users WHERE userID = ? LIMIT 1',
    [userId],
  )
  if (!employee || employee.role.trim().toLowerCase() !== 'employee' || employee.status.trim().toLowerCase() !== 'active') {
    errorResponse(res, 'Only an active Employee account may submit an incident report.', 403)
    return
  }
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((item): item is string => typeof item === 'string')
    : []
  const resolved = data.resolvedByUser
  const incidentID = `INC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`
  const date = new Date()
  const status = resolved ? 'Resolved' : 'Pending'
  await execute(
    `INSERT INTO incidents (
       incidentID, affectedIssue, classification, keywords, connectionType,
       department, description, deviceType, employeeName, issueCategory,
       location, severity, status, summary, troubleshooting, userId, assigned,
       assignedAt, assignedTo, assignedToName, startedAt, resolvedAt, resolvedBy
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'No',
       NULL, NULL, NULL, NULL, ?, ?)`,
    [
      incidentID,
      affectedIssue,
      text(data.classification),
      JSON.stringify(keywords),
      text(data.connectionType),
      employee.department,
      description,
      text(data.deviceType),
      employee.fullName,
      issueCategory,
      location,
      severity,
      status,
      text(data.summary),
      text(data.troubleshooting),
      userId,
      resolved ? date : null,
      resolved ? employee.fullName : null,
    ],
  )
  send(res, 200, {
    success: true,
    message: 'Incident created successfully.',
    incidentID,
    status,
    assigned: 'No',
    resolvedBy: resolved ? employee.fullName : null,
  })
}

async function updateIncident(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const data = json(req)
  const incidentID = text(data?.incidentID)
  if (!incidentID) {
    errorResponse(res, 'Valid incident ID is required.')
    return
  }
  const fields = [
    'department', 'location', 'issueCategory', 'deviceType', 'connectionType',
    'affectedIssue', 'description', 'severity', 'classification', 'summary',
    'troubleshooting',
  ] as const
  const setParts: string[] = []
  const values: (string | null)[] = []
  for (const field of fields) {
    if (!data || !Object.hasOwn(data, field)) continue
    const value = text(data[field])
    if (field === 'severity' && !['High', 'Medium', 'Low'].includes(value)) {
      errorResponse(res, 'Severity must be High, Medium, or Low.')
      return
    }
    setParts.push(`\`${field}\` = ?`)
    values.push(value)
  }
  if (setParts.length === 0) {
    errorResponse(res, 'No valid fields were provided to update.')
    return
  }

  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT status FROM incidents WHERE incidentID = ? FOR UPDATE',
      [incidentID],
    )
    const incident = rows[0] as (RowDataPacket & { status: string }) | undefined
    if (!incident) {
      await connection.rollback()
      errorResponse(res, 'Incident not found.', 404)
      return
    }
    if (['resolved', 'closed'].includes(incident.status.trim().toLowerCase())) {
      await connection.rollback()
      errorResponse(res, 'Resolved incidents cannot be edited.', 403)
      return
    }
    await connection.execute(
      `UPDATE incidents SET ${setParts.join(', ')} WHERE incidentID = ?`,
      [...values, incidentID],
    )
    await connection.commit()
    send(res, 200, { success: true, message: 'Incident updated successfully.' })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function deleteIncident(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const incidentID = text(json(req)?.incidentID)
  if (!incidentID) {
    errorResponse(res, 'Valid incident ID is required.')
    return
  }
  const result = await execute(
    "DELETE FROM incidents WHERE incidentID = ? AND status = 'Pending'",
    [incidentID],
  )
  if (!result.affectedRows) {
    const exists = await getRow<RowDataPacket & { status: string }>(
      'SELECT status FROM incidents WHERE incidentID = ? LIMIT 1',
      [incidentID],
    )
    if (!exists) {
      errorResponse(res, 'Incident not found.', 404)
    } else {
      errorResponse(res, 'Only Pending incidents can be deleted.', 403)
    }
    return
  }
  send(res, 200, { success: true, message: 'Incident deleted successfully.', incidentID })
}

async function assignIncident(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const data = json(req)
  const incidentID = text(data?.incidentID)
  const assignedTo = text(data?.assignedTo)
  const actorUserId = text(data?.actorUserId)
  if (!incidentID || !assignedTo || !actorUserId) {
    errorResponse(res, 'Incident ID, assigned personnel, and the current user are required.')
    return
  }
  const actor = await getRow<RowDataPacket & { role: string; status: string }>(
    'SELECT role, status FROM users WHERE userID = ? LIMIT 1',
    [actorUserId],
  )
  if (!actor || actor.status.toLowerCase() !== 'active' || !['admin', 'administrator', 'secretary'].includes(actor.role.toLowerCase())) {
    errorResponse(res, 'Only an Administrator or Secretary may assign incidents.', 403)
    return
  }
  const personnel = await getRow<RowDataPacket & { userID: number; fullName: string }>(
    "SELECT userID, fullName FROM users WHERE userID = ? AND role = 'IT Personnel' AND LOWER(status) = 'active' LIMIT 1",
    [assignedTo],
  )
  if (!personnel) {
    errorResponse(res, 'The selected account is not an active Technician.')
    return
  }
  const result = await execute(
    `UPDATE incidents SET assigned = 'Yes', assignedAt = NOW(), assignedTo = ?,
       assignedToName = ?, status = 'Pending', startedAt = NULL
     WHERE incidentID = ? AND status NOT IN ('Resolved', 'Closed')
       AND severity IN ('High', 'Medium', 'Low')`,
    [personnel.userID, personnel.fullName, incidentID],
  )
  if (!result.affectedRows) {
    const incident = await getRow<RowDataPacket & { status: string; severity: string | null }>(
      'SELECT status, severity FROM incidents WHERE incidentID = ? LIMIT 1',
      [incidentID],
    )
    if (!incident) {
      errorResponse(res, 'Incident not found.', 404)
      return
    }
    if (!incident.severity) {
      errorResponse(res, 'Set a severity level before assigning a Technician.')
      return
    }
    if (['Resolved', 'Closed'].includes(incident.status)) {
      errorResponse(res, 'Resolved incidents cannot be assigned.', 409)
      return
    }
  }
  send(res, 200, {
    success: true,
    message: 'Incident assigned successfully.',
    incidentID,
    assignedTo: String(personnel.userID),
    assignedToName: personnel.fullName,
    status: 'Pending',
  })
}

async function updateIncidentStatus(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const data = json(req)
  const incidentID = text(data?.incidentID)
  const status = text(data?.status)
  const actorUserId = text(data?.actorUserId)
  if (!incidentID || !status || !actorUserId) {
    errorResponse(res, 'Incident ID, status, and the current user are required.')
    return
  }
  const actor = await getRow<RowDataPacket & { fullName: string; role: string; status: string }>(
    'SELECT fullName, role, status FROM users WHERE userID = ? LIMIT 1',
    [actorUserId],
  )
  if (!actor || actor.role.trim().toLowerCase() !== 'it personnel' || actor.status.trim().toLowerCase() !== 'active') {
    errorResponse(res, 'Only the assigned active Technician may update this incident.', 403)
    return
  }
  const incident = await getRow<RowDataPacket & {
    status: string; assignedTo: number | string; startedAt: string | null; troubleshooting: string
  }>(
    'SELECT status, assignedTo, startedAt, troubleshooting FROM incidents WHERE incidentID = ? AND assignedTo = ? LIMIT 1',
    [incidentID, actorUserId],
  )
  if (!incident) {
    errorResponse(res, 'This incident is not assigned to the current Technician account.', 403)
    return
  }
  const currentStatus = incident.status.trim().toLowerCase()
  if (
    (status.toLowerCase() === 'in progress' && currentStatus !== 'pending')
    || (status.toLowerCase() === 'resolved' && currentStatus !== 'in progress')
  ) {
    errorResponse(res, 'Resolved incidents cannot be edited or reopened.', 409)
    return
  }
  if (status === 'In Progress') {
    await execute(
      "UPDATE incidents SET status = 'In Progress', startedAt = COALESCE(startedAt, NOW()) WHERE incidentID = ?",
      [incidentID],
    )
    send(res, 200, { success: true, message: 'Incident status updated successfully.', incidentID, status })
    return
  }
  if (status === 'Resolved') {
    const notes = text(data?.resolutionNotes)
    const checked = data?.technicianCheckedSteps
    if (!Array.isArray(checked) || !notes) {
      errorResponse(res, !Array.isArray(checked)
        ? 'Complete every technician troubleshooting step before resolving this incident.'
        : 'Resolution notes are required.')
      return
    }
    const sections = incident.troubleshooting.split(/^\s*IT Troubleshooting Suggestions:\s*$/im)
    const technicianText = (sections[1] ?? '')
      .replace(/\[Employee checked self-help steps: [^\]]*\]/gi, '')
      .replace(/\[IT checked troubleshooting steps: [^\]]*\]/gi, '')
      .trim()
    const technicianSteps = technicianText
      .split(/\s+(?=(?:\d+[.)]|[-*•])\s+)/u)
      .map((step) => step.replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, '').trim())
      .filter(Boolean)
    const checkedSteps = [...new Set(checked.map(Number))].sort((a, b) => a - b)
    if (
      technicianSteps.length === 0
      || checkedSteps.length !== technicianSteps.length
      || checkedSteps.some((step, index) => !Number.isInteger(step) || step !== index)
    ) {
      errorResponse(res, 'Complete every technician troubleshooting step before resolving this incident.')
      return
    }
    const troubleshooting = incident.troubleshooting
      .replace(/\s*\[IT checked troubleshooting steps: [^\]]*\]/gi, '')
      .trimEnd() + `\n[IT checked troubleshooting steps: ${checkedSteps.join(',')}]`
    await execute(
      `UPDATE incidents SET status = 'Resolved', resolvedAt = NOW(), resolvedBy = ?,
         resolutionNotes = ?, troubleshooting = ?,
         durationMinutes = CASE WHEN startedAt IS NULL THEN 0
           ELSE GREATEST(0, TIMESTAMPDIFF(MINUTE, startedAt, NOW())) END
       WHERE incidentID = ?`,
      [actor.fullName, notes, troubleshooting, incidentID],
    )
    const saved = await getRow<RowDataPacket & { resolvedAt: string; durationMinutes: number }>(
      'SELECT resolvedAt, durationMinutes FROM incidents WHERE incidentID = ? LIMIT 1',
      [incidentID],
    )
    send(res, 200, {
      success: true,
      message: 'Incident resolved successfully.',
      incidentID,
      status,
      resolvedBy: actor.fullName,
      resolvedAt: saved?.resolvedAt ?? null,
      durationMinutes: Number(saved?.durationMinutes ?? 0),
    })
    return
  }
  if (!['Pending', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
    errorResponse(res, 'Invalid incident status.')
    return
  }
  await execute('UPDATE incidents SET status = ? WHERE incidentID = ?', [status, incidentID])
  send(res, 200, { success: true, message: 'Incident status updated successfully.', incidentID, status })
}

async function users(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  if (!(await requireAdminSession(req, res))) return
  const rows = await getRows<UserRow>(
    `SELECT userID, dateCreated, department, email, employeeId, fullName,
            profilePhoto, role, status FROM users ORDER BY userID ASC`,
  )
  send(res, 200, { success: true, users: rows.map(publicUser) })
}

async function itPersonnel(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const personnel = await getRows<RowDataPacket>(
    `SELECT userID, employeeId, fullName, email, department, role, status
     FROM users WHERE role = 'IT Personnel' ORDER BY fullName ASC`,
  )
  send(res, 200, { success: true, personnel })
}

async function verifyAdmin(userID: unknown): Promise<boolean> {
  const id = text(userID)
  if (!/^\d+$/.test(id)) return false
  const admin = await getRow<RowDataPacket & { role: string; status: string }>(
    'SELECT role, status FROM users WHERE userID = ? LIMIT 1',
    [id],
  )
  return Boolean(admin && adminRole(admin.role) && admin.status.toLowerCase() === 'active')
}

async function createUser(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  if (!(await requireAdminSession(req, res))) return
  const data = json(req)
  if (!data) {
    errorResponse(res, 'Invalid account details.')
    return
  }
  const fullName = text(data.fullName)
  const employeeId = text(data.employeeId)
  const department = text(data.department)
  const email = text(data.email).toLowerCase()
  const password = typeof data.password === 'string' ? data.password : ''
  const role = text(data.role)
  const allowedRoles = ['Employee', 'IT Personnel', 'Secretary', 'Administrator']
  if (!fullName || !employeeId || !department || !email || !password || !role) {
    errorResponse(res, 'Please complete all required fields.')
    return
  }
  if (!allowedRoles.includes(role)) {
    errorResponse(res, 'Invalid account role.')
    return
  }
  if (!validEmail(email)) {
    errorResponse(res, 'Please enter a valid email address.')
    return
  }
  if (!passwordIsStrong(password)) {
    errorResponse(res, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')
    return
  }
  const duplicateEmail = await getRow<RowDataPacket>(
    'SELECT userID FROM users WHERE LOWER(email) = ? LIMIT 1',
    [email],
  )
  if (duplicateEmail) {
    errorResponse(res, 'An account with this email already exists.', 409)
    return
  }
  const duplicateEmployee = await getRow<RowDataPacket>(
    'SELECT userID FROM users WHERE LOWER(TRIM(employeeId)) = LOWER(?) LIMIT 1',
    [employeeId],
  )
  if (duplicateEmployee) {
    errorResponse(res, 'This Employee ID is already registered.', 409)
    return
  }
  const [result] = await getPool().execute<ResultSetHeader>(
    `INSERT INTO users (dateCreated, department, email, employeeId, fullName, password, role, status)
     VALUES (NOW(), ?, ?, ?, ?, ?, ?, 'Active')`,
    [department, email, employeeId, fullName, await hashPassword(password), role === 'Administrator' ? 'Admin' : role],
  )
  const userID = result.insertId
  const created = await getRow<RowDataPacket & { dateCreated: string }>(
    'SELECT dateCreated FROM users WHERE userID = ? LIMIT 1',
    [userID],
  )
  send(res, 200, {
    success: true,
    message: 'User account created successfully.',
    user: { userID, fullName, employeeId, department, email, role, status: 'Active', dateCreated: created?.dateCreated ?? null },
  })
}

async function updateUser(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const data = json(req)
  const userID = text(data?.userID)
  const action = text(data?.action)
  if (!userID || !/^\d+$/.test(userID)) {
    errorResponse(res, 'A valid user is required.')
    return
  }
  if (action === 'update') {
    const fullName = text(data?.fullName)
    const employeeId = text(data?.employeeId)
    const email = text(data?.email).toLowerCase()
    const department = text(data?.department)
    const role = text(data?.role)
    if (!fullName || !employeeId || !department || !validEmail(email)
      || !['Employee', 'Secretary', 'IT Personnel', 'Administrator'].includes(role)) {
      errorResponse(res, 'Please provide valid account details.')
      return
    }
    const duplicateEmployee = await getRow<RowDataPacket>(
      'SELECT userID FROM users WHERE LOWER(TRIM(employeeId)) = LOWER(?) AND userID <> ? LIMIT 1',
      [employeeId, userID],
    )
    const duplicateEmail = await getRow<RowDataPacket>(
      'SELECT userID FROM users WHERE LOWER(email) = ? AND userID <> ? LIMIT 1',
      [email, userID],
    )
    if (duplicateEmployee) {
      errorResponse(res, 'This Employee ID is already assigned to another account.', 409)
      return
    }
    if (duplicateEmail) {
      errorResponse(res, 'This email address is already used by another account.', 409)
      return
    }
    await execute(
      'UPDATE users SET fullName = ?, employeeId = ?, email = ?, department = ?, role = ? WHERE userID = ?',
      [fullName, employeeId, email, department, role === 'Administrator' ? 'Admin' : role, userID],
    )
  } else if (action === 'self_password') {
    const currentPassword = typeof data?.currentPassword === 'string' ? data.currentPassword : ''
    const password = typeof data?.password === 'string' ? data.password : ''
    const account = await getRow<UserRow>(
      'SELECT userID, password FROM users WHERE userID = ? LIMIT 1',
      [userID],
    )
    if (!currentPassword) {
      errorResponse(res, 'Enter your current password.')
      return
    }
    if (!account || !(await bcrypt.compare(currentPassword, (account.password ?? '').replace(/^\$2y\$/, '$2b$')))) {
      errorResponse(res, 'Current password is incorrect.', 401)
      return
    }
    if (!passwordIsStrong(password)) {
      errorResponse(res, 'Password must have 8+ characters with uppercase, lowercase, number, and special character.')
      return
    }
    await execute('UPDATE users SET password = ? WHERE userID = ?', [await hashPassword(password), userID])
  } else if (action === 'password') {
    const password = typeof data?.password === 'string' ? data.password : ''
    if (!passwordIsStrong(password)) {
      errorResponse(res, 'Password must have 8+ characters with uppercase, lowercase, number, and special character.')
      return
    }
    await execute('UPDATE users SET password = ? WHERE userID = ?', [await hashPassword(password), userID])
  } else if (action === 'status') {
    const status = text(data?.status)
    if (!['Active', 'Inactive'].includes(status)) {
      errorResponse(res, 'Invalid account status.')
      return
    }
    await execute('UPDATE users SET status = ? WHERE userID = ?', [status, userID])
  } else {
    errorResponse(res, 'Invalid user-management action.')
    return
  }
  send(res, 200, { success: true, message: 'User updated successfully.' })
}

async function updateUserStatus(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  const data = json(req)
  const userID = text(data?.userID)
  const status = text(data?.status)
  if (!data || !userID || !(await verifyAdmin(data.adminUserID))) {
    errorResponse(res, 'Only an active Administrator can update account status.', 403)
    return
  }
  const normalizedStatus = status.toLowerCase() === 'active' ? 'Active'
    : status.toLowerCase() === 'inactive' ? 'Inactive' : ''
  if (!normalizedStatus) {
    errorResponse(res, 'Invalid account status.')
    return
  }
  const target = await getRow<RowDataPacket & { role: string; fullName: string }>(
    'SELECT role, fullName FROM users WHERE userID = ? LIMIT 1',
    [userID],
  )
  if (!target) {
    errorResponse(res, 'User account was not found.', 404)
    return
  }
  if (adminRole(target.role)) {
    errorResponse(res, 'The Administrator account cannot be disabled through User Management.', 403)
    return
  }
  await execute('UPDATE users SET status = ? WHERE userID = ?', [normalizedStatus, userID])
  send(res, 200, {
    success: true,
    message: 'Account status updated successfully.',
    user: { userID, fullName: target.fullName, status: normalizedStatus },
  })
}

async function deleteUser(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  const data = json(req)
  const adminUserID = text(data?.adminUserID)
  const userID = text(data?.userID)
  if (!data || !userID || !(await verifyAdmin(adminUserID))) {
    errorResponse(res, 'Only an active Administrator can delete user accounts.', 403)
    return
  }
  if (adminUserID === userID) {
    errorResponse(res, 'You cannot delete your own Administrator account.', 403)
    return
  }
  const user = await getRow<RowDataPacket & {
    userID: number; fullName: string; email: string; employeeId: string; department: string; role: string; status: string
  }>(
    `SELECT userID, fullName, email, employeeId, department, role, status
     FROM users WHERE userID = ? LIMIT 1`,
    [userID],
  )
  if (!user) {
    errorResponse(res, 'User account not found.', 404)
    return
  }
  if (adminRole(user.role)) {
    errorResponse(res, 'Administrator accounts cannot be deleted.', 403)
    return
  }
  const result = await execute('DELETE FROM users WHERE userID = ?', [userID])
  if (!result.affectedRows) {
    errorResponse(res, 'User account could not be deleted because it no longer exists.', 404)
    return
  }
  send(res, 200, {
    success: true,
    message: 'User account deleted successfully.',
    user: {
      userID: user.userID,
      fullName: user.fullName,
      email: user.email,
      employeeId: user.employeeId,
      department: user.department,
      role: user.role,
      status: user.status,
    },
  })
}

async function changePassword(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Only POST requests are allowed.', 405)
    return
  }
  const data = json(req)
  const adminUserID = text(data?.adminUserID)
  const userID = text(data?.userID)
  const currentPassword = typeof data?.currentPassword === 'string' ? data.currentPassword : ''
  const newPassword = typeof data?.newPassword === 'string' ? data.newPassword : ''
  if (!adminUserID || !userID || !currentPassword || !newPassword) {
    errorResponse(res, 'Administrator ID, user ID, current password, and new password are required.')
    return
  }
  const admin = await getRow<UserRow>(
    'SELECT userID, password, role, status FROM users WHERE userID = ? LIMIT 1',
    [adminUserID],
  )
  if (!admin || !adminRole(admin.role) || admin.status.toLowerCase() !== 'active') {
    errorResponse(res, 'Only an active Administrator can change user passwords.', 403)
    return
  }
  if (!(await bcrypt.compare(currentPassword, (admin.password ?? '').replace(/^\$2y\$/, '$2b$')))) {
    errorResponse(res, 'The current Administrator password is incorrect.', 401)
    return
  }
  if (!passwordIsStrong(newPassword)) {
    errorResponse(res, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')
    return
  }
  const target = await getRow<RowDataPacket & { userID: number; fullName: string; role: string }>(
    'SELECT userID, fullName, role FROM users WHERE userID = ? LIMIT 1',
    [userID],
  )
  if (!target) {
    errorResponse(res, 'User account was not found.', 404)
    return
  }
  if (adminRole(target.role) && String(target.userID) !== adminUserID) {
    errorResponse(res, 'The Administrator account cannot be changed through User Management.', 403)
    return
  }
  await execute('UPDATE users SET password = ? WHERE userID = ?', [await hashPassword(newPassword), userID])
  send(res, 200, {
    success: true,
    message: 'Password updated successfully.',
    user: { userID: target.userID, fullName: target.fullName },
  })
}

function formatDevice(row: RowDataPacket): JsonRecord {
  const lastPingTimestamp = row.lastPingAt ? new Date(row.lastPingAt).getTime() : Number.NaN
  const pingIsStale = !Number.isFinite(lastPingTimestamp)
    || Date.now() - lastPingTimestamp > 120_000
  return {
    id: row.deviceID,
    name: row.name,
    type: row.deviceType,
    status: pingIsStale ? 'unknown' : row.monitoringStatus ?? 'unknown',
    ip: row.ipAddress,
    mac: row.macAddress || '—',
    location: row.location,
    department: row.department,
    firmware: row.firmware || '—',
    registeredAt: row.createdAt,
    lastSeen: row.lastPingAt === null ? null : row.lastSeen,
    throughput: null,
    devicesConnected: null,
    uptime: null,
    downloadMbps: null,
    uploadMbps: null,
    pingResponseTimeMs: row.pingResponseTimeMs,
    lastPingAt: row.lastPingAt,
    assignedUserId: row.assignedUserId === null ? null : String(row.assignedUserId),
    assignedUserName: row.assignedUserName,
  }
}

async function devices(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    const rows = await getRows<RowDataPacket>(
      `SELECT d.*, u.fullName AS assignedUserName
       FROM devices d LEFT JOIN users u ON u.userID = d.assignedUserId
       ORDER BY d.createdAt DESC, d.id DESC`,
    )
    send(res, 200, { success: true, devices: rows.map(formatDevice) })
    return
  }
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const data = json(req)
  if (!data) {
    errorResponse(res, 'Invalid device request.')
    return
  }
  const action = text(data.action)
  const deviceID = text(data.deviceID)
  if (action === 'ping') {
    if (!deviceID) {
      errorResponse(res, 'Device ID is required.')
      return
    }
    const device = await getRow<RowDataPacket>(
      'SELECT deviceID FROM devices WHERE deviceID = ? LIMIT 1',
      [deviceID],
    )
    if (!device) {
      errorResponse(res, 'Device not found.', 404)
      return
    }
    await ensureDevicePingTable()
    const result = await execute(
      `INSERT INTO device_ping_requests (deviceID, status, requestedAt)
       VALUES (?, 'pending', CURRENT_TIMESTAMP)`,
      [deviceID],
    )
    send(res, 202, {
      success: true,
      pending: true,
      requestID: result.insertId,
      message: 'Ping request sent to the network monitoring agent.',
    })
    return
  }
  if (action === 'ping_status') {
    const requestID = text(data.requestID)
    if (!requestID || !/^\d+$/.test(requestID) || !deviceID) {
      errorResponse(res, 'A valid ping request and device ID are required.')
      return
    }
    await ensureDevicePingTable()
    const pingRequest = await getRow<RowDataPacket>(
      `SELECT requests.status, requests.reachable, requests.responseTimeMs,
              requests.completedAt, devices.lastSeen
       FROM device_ping_requests requests
       LEFT JOIN devices ON devices.deviceID = requests.deviceID
       WHERE requests.id = ? AND requests.deviceID = ? LIMIT 1`,
      [requestID, deviceID],
    )
    if (!pingRequest) {
      errorResponse(res, 'Ping request not found.', 404)
      return
    }
    send(res, 200, {
      success: true,
      pending: pingRequest.status === 'pending',
      status: pingRequest.status === 'pending'
        ? 'unknown'
        : pingRequest.reachable ? 'online' : 'offline',
      responseTimeMs: pingRequest.responseTimeMs,
      lastSeen: pingRequest.lastSeen,
      lastPingAt: pingRequest.completedAt,
      message: pingRequest.status === 'pending'
        ? 'Waiting for the network monitoring agent.'
        : pingRequest.reachable ? 'Reachable from the device network.' : 'No ping response from the device.',
    })
    return
  }
  if (action === 'delete') {
    if (!deviceID) {
      errorResponse(res, 'Device ID is required.')
      return
    }
    const result = await execute('DELETE FROM devices WHERE deviceID = ?', [deviceID])
    if (!result.affectedRows) {
      errorResponse(res, 'Device not found.', 404)
      return
    }
    send(res, 200, { success: true, message: 'Device deleted.' })
    return
  }
  if (action !== 'add') {
    errorResponse(res, 'Invalid device request.')
    return
  }
  const name = text(data.name)
  const type = text(data.type)
  const ip = text(data.ip)
  const mac = text(data.mac)
  const location = text(data.location)
  const department = text(data.department)
  const firmware = text(data.firmware)
  const assignedUserId = text(data.assignedUserId)
  if (!name || !location || !department || !firmware || !isIP(ip)) {
    errorResponse(res, 'Please provide a device name, valid IP address, location, department, and firmware version.')
    return
  }
  if (!['Router', 'Switch', 'Access Point'].includes(type)) {
    errorResponse(res, 'Invalid device type.')
    return
  }
  if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac)) {
    errorResponse(res, 'A valid MAC address is required (e.g. AC:DE:48:00:11:22).')
    return
  }
  if (assignedUserId && !/^\d+$/.test(assignedUserId)) {
    errorResponse(res, 'Invalid assigned user.')
    return
  }
  if (assignedUserId) {
    const employee = await getRow<RowDataPacket>(
      "SELECT userID FROM users WHERE userID = ? AND LOWER(status) = 'active' AND LOWER(role) = 'employee' LIMIT 1",
      [assignedUserId],
    )
    if (!employee) {
      errorResponse(res, 'The selected employee is no longer active or is not an employee.')
      return
    }
  }
  try {
    const [insert] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO devices (name, deviceType, status, ipAddress, macAddress, location,
         department, firmware, assignedUserId, monitoringStatus, pingResponseTimeMs,
         lastPingAt, lastSeen)
       VALUES (?, ?, 'offline', ?, ?, ?, ?, ?, ?, 'unknown', NULL, NULL, NULL)`,
      [name, type, ip, mac, location, department, firmware, assignedUserId || null],
    )
    const insertedId = insert.insertId
    const id = `DEV-${String(insertedId).padStart(3, '0')}`
    await execute('UPDATE devices SET deviceID = ? WHERE id = ?', [id, insertedId])
    const created = await getRow<RowDataPacket>(
      `SELECT d.*, u.fullName AS assignedUserName FROM devices d
       LEFT JOIN users u ON u.userID = d.assignedUserId WHERE d.deviceID = ? LIMIT 1`,
      [id],
    )
    send(res, 201, { success: true, device: created ? formatDevice(created) : null })
  } catch (error) {
    if (isRecord(error) && error.code === 'ER_DUP_ENTRY') {
      errorResponse(res, 'A device already uses that IP address.', 409)
      return
    }
    throw error
  }
}

async function ensureDevicePingTable(): Promise<void> {
  await execute(`CREATE TABLE IF NOT EXISTS device_ping_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deviceID VARCHAR(40) NOT NULL,
    status ENUM('pending', 'complete') NOT NULL DEFAULT 'pending',
    reachable TINYINT(1) DEFAULT NULL,
    responseTimeMs VARCHAR(20) DEFAULT NULL,
    requestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME DEFAULT NULL,
    INDEX idx_device_ping_pending (status, requestedAt),
    INDEX idx_device_ping_device (deviceID, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
}

async function deviceAgent(req: VercelRequest, res: VercelResponse): Promise<void> {
  const expectedToken = process.env.DEVICE_MONITOR_TOKEN
  const authorization = req.headers.authorization ?? ''
  const suppliedToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  if (!expectedToken || expectedToken.length < 32) {
    errorResponse(res, 'Device monitoring agent is not configured.', 503)
    return
  }
  const expected = Buffer.from(expectedToken)
  const supplied = Buffer.from(suppliedToken)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    errorResponse(res, 'Unauthorized device monitoring agent.', 401)
    return
  }

  if (req.method === 'GET') {
    await ensureDevicePingTable()
    const rows = await getRows<RowDataPacket>(
      'SELECT deviceID, ipAddress FROM devices ORDER BY createdAt ASC, id ASC',
    )
    const requestedRows = await getRows<RowDataPacket>(
      `SELECT DISTINCT deviceID FROM device_ping_requests
       WHERE status = 'pending' ORDER BY deviceID`,
    )
    send(res, 200, {
      success: true,
      devices: rows.map((row) => ({ deviceID: row.deviceID, ipAddress: row.ipAddress })),
      requestedDeviceIDs: requestedRows.map((row) => row.deviceID),
    })
    return
  }
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }

  const data = json(req)
  const deviceID = text(data?.deviceID)
  if (!deviceID || typeof data?.reachable !== 'boolean') {
    errorResponse(res, 'A device ID and reachability result are required.')
    return
  }
  const responseTime = data.reachable && typeof data.responseTimeMs === 'number'
    && Number.isFinite(data.responseTimeMs) && data.responseTimeMs >= 0
    ? String(Math.round(data.responseTimeMs * 100) / 100)
    : null
  const status = data.reachable ? 'online' : 'offline'
  await ensureDevicePingTable()
  await ensureDeviceStatusHistoryTable()
  const currentDevice = await getRow<RowDataPacket>(
    'SELECT deviceID, name, ipAddress, monitoringStatus FROM devices WHERE deviceID = ? LIMIT 1',
    [deviceID],
  )
  if (!currentDevice) {
    errorResponse(res, 'Device not found.', 404)
    return
  }
  const previousEvent = await getRow<RowDataPacket>(
    `SELECT status FROM device_status_history
     WHERE deviceID = ? ORDER BY checkedAt DESC, id DESC LIMIT 1`,
    [deviceID],
  )
  const shouldRecordStatus = currentDevice.monitoringStatus !== status
    || !previousEvent
    || previousEvent.status !== status
  const result = await execute(
    `UPDATE devices
     SET status = ?, monitoringStatus = ?, pingResponseTimeMs = ?,
         lastPingAt = CURRENT_TIMESTAMP,
         lastSeen = IF(? = 'online', CURRENT_TIMESTAMP, lastSeen)
     WHERE deviceID = ?`,
    [status, status, responseTime, status, deviceID],
  )
  if (!result.affectedRows) {
    errorResponse(res, 'Device not found.', 404)
    return
  }
  if (shouldRecordStatus) {
    await execute(
      `INSERT INTO device_status_history (deviceID, deviceName, ipAddress, status, checkedAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [deviceID, currentDevice.name, currentDevice.ipAddress, status],
    )
  }
  await execute(
    `UPDATE device_ping_requests
     SET status = 'complete', reachable = ?, responseTimeMs = ?, completedAt = CURRENT_TIMESTAMP
     WHERE deviceID = ? AND status = 'pending'`,
    [data.reachable ? 1 : 0, responseTime, deviceID],
  )
  send(res, 200, { success: true, status, responseTimeMs: responseTime })
}

async function ensureDeviceStatusHistoryTable(): Promise<void> {
  await execute(`CREATE TABLE IF NOT EXISTS device_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deviceID VARCHAR(40) NOT NULL,
    deviceName VARCHAR(150) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    status ENUM('online', 'offline') NOT NULL,
    checkedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_status_history_time (checkedAt, id),
    INDEX idx_device_status_history_device (deviceID, checkedAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
}

async function deviceStatusHistory(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const userID = queryValue(req, 'userID')
  if (!(await verifyAdmin(userID))) {
    errorResponse(res, 'Only an active Administrator can view device status reports.', 403)
    return
  }
  const startDate = queryValue(req, 'startDate')
  const endDate = queryValue(req, 'endDate')
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    errorResponse(res, 'A valid start and end date are required.')
    return
  }
  await ensureDeviceStatusHistoryTable()
  const events = await getRows<RowDataPacket>(
    `SELECT deviceID, deviceName, ipAddress, status, checkedAt
     FROM device_status_history
     WHERE checkedAt >= CONCAT(?, ' 00:00:00')
       AND checkedAt < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
     ORDER BY checkedAt DESC, id DESC`,
    [startDate, endDate],
  )
  send(res, 200, { success: true, events })
}

function isIP(value: string): boolean {
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
    && value.split('.').every((part) => Number(part) <= 255)
  const ipv6 = /^[0-9a-f:]+$/i.test(value) && value.includes(':')
  return ipv4 || ipv6
}

async function analyzeIncident(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    send(res, 503, {
      success: false,
      aiAvailable: false,
      message: 'Gemini AI is not configured on the API server. Set GEMINI_API_KEY to enable analysis.',
    })
    return
  }
  const data = json(req)
  const fields = {
    department: text(data?.department),
    location: text(data?.location),
    issueCategory: text(data?.issueCategory),
    deviceType: text(data?.deviceType),
    connectionType: text(data?.connectionType),
    affectedService: text(data?.affectedService),
    description: text(data?.description),
  }
  if (Object.values(fields).some((value) => !value)) {
    errorResponse(res, 'Please provide all required incident information.')
    return
  }

  const prompt = `You are an AI support assistant for BatangAI, a network incident reporting system.
Analyze only the incident details provided. Do not claim a confirmed root cause or resolution. Do not assign or change incident status.
Return JSON with classification (short category), keywords (specific strings), summary (concise full summary), possibleInterpretation (cautious interpretation), basicSelfHelp (safe numbered steps for an employee; do not suggest changing network infrastructure), and itTroubleshooting (technical advisory steps for IT).
Department: ${fields.department}
Location: ${fields.location}
Issue Category: ${fields.issueCategory}
Device Type: ${fields.deviceType}
Connection Type: ${fields.connectionType}
Affected Service: ${fields.affectedService}
Description: ${fields.description}`

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest']
  let response: Response | undefined
  for (const model of models) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(55_000),
      },
    )
    if (response.ok || [400, 401, 403].includes(response.status)) break
  }
  if (!response?.ok) {
    const status = response?.status ?? 503
    const message = status === 401 || status === 403
      ? 'Gemini rejected the API key. Check GEMINI_API_KEY on the API server.'
      : status === 429
        ? 'Gemini API rate limit or usage quota reached. Please try again later.'
        : 'Gemini is temporarily unavailable. Please try again shortly.'
    send(res, 503, { success: false, aiAvailable: false, message })
    return
  }
  const upstream: unknown = await response.json()
  const output = isRecord(upstream)
    && Array.isArray(upstream.candidates)
    && isRecord(upstream.candidates[0])
    && isRecord(upstream.candidates[0].content)
    && Array.isArray(upstream.candidates[0].content.parts)
    && isRecord(upstream.candidates[0].content.parts[0])
    ? upstream.candidates[0].content.parts[0].text
    : null
  if (typeof output !== 'string') {
    send(res, 503, { success: false, aiAvailable: false, message: 'Gemini returned an unreadable response. Please try again.' })
    return
  }
  let analysis: unknown
  try {
    analysis = JSON.parse(output)
  } catch {
    send(res, 503, { success: false, aiAvailable: false, message: 'Gemini returned analysis in an unexpected format. Please try again.' })
    return
  }
  if (!isRecord(analysis)) {
    send(res, 503, { success: false, aiAvailable: false, message: 'Gemini returned analysis in an unexpected format. Please try again.' })
    return
  }
  const keywords = Array.isArray(analysis.keywords)
    ? analysis.keywords.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : []
  const normalized = {
    classification: text(analysis.classification),
    keywords,
    summary: text(analysis.summary),
    possibleInterpretation: text(analysis.possibleInterpretation),
    basicSelfHelp: text(analysis.basicSelfHelp),
    itTroubleshooting: text(analysis.itTroubleshooting),
  }
  if (Object.values(normalized).some((value) => !value || (Array.isArray(value) && value.length === 0))) {
    send(res, 503, { success: false, aiAvailable: false, message: 'Gemini returned incomplete analysis. Please try again.' })
    return
  }
  send(res, 200, { success: true, aiAvailable: true, analysis: normalized })
}

async function uploadProfilePhoto(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    errorResponse(res, 'Method not allowed.', 405)
    return
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    errorResponse(res, 'Profile photo storage is not configured.', 503)
    return
  }
  const body: HandleUploadBody = req.body
  const result = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      let data: unknown
      try {
        data = clientPayload ? JSON.parse(clientPayload) : null
      } catch {
        throw new Error('A valid user ID is required.')
      }
      const userID = isRecord(data) ? text(data.userID) : ''
      if (!/^\d+$/.test(userID)) {
        throw new Error('A valid user ID is required.')
      }
      const user = await activeUser(Number(userID))
      if (!user) {
        throw new Error('User account not found.')
      }
      if (readSessionUserID(req) !== Number(userID)) {
        throw new Error('Sign in as this user before uploading a profile photo.')
      }
      const fileName = pathname.split('/').pop() ?? ''
      if (
        !pathname.startsWith('profile_photos/')
        || !/^[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/i.test(fileName)
      ) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed.')
      }
      const extension = pathname.toLowerCase().split('.').pop()
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      }
      const contentType = mimeTypes[extension ?? '']
      if (!contentType) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed.')
      }
      return {
        allowedContentTypes: [contentType],
        maximumSizeInBytes: 5 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: userID,
      }
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      if (!tokenPayload || !/^\d+$/.test(tokenPayload)) {
        throw new Error('Uploaded profile photo did not include a valid user ID.')
      }
      const imageResponse = await fetch(blob.url)
      if (!imageResponse.ok) {
        await del(blob.url)
        throw new Error('Unable to verify the uploaded profile photo.')
      }
      const bytes = new Uint8Array(await imageResponse.arrayBuffer())
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      const isPng = bytes.length >= 8
        && bytes[0] === 0x89 && bytes[1] === 0x50
        && bytes[2] === 0x4e && bytes[3] === 0x47
        && bytes[4] === 0x0d && bytes[5] === 0x0a
        && bytes[6] === 0x1a && bytes[7] === 0x0a
      const isWebp = bytes.length >= 12
        && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
      if (!isJpeg && !isPng && !isWebp) {
        await del(blob.url)
        throw new Error('The uploaded file is not a valid JPG, PNG, or WEBP image.')
      }
      await execute('UPDATE users SET profilePhoto = ? WHERE userID = ?', [blob.url, tokenPayload])
    },
  })
  res.status(200).json(result)
}

export default handler
