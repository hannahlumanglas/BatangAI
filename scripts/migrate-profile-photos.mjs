import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { createConnection } from 'mysql2/promise'
import { put } from '@vercel/blob'

const mysqlUrl = process.env.MYSQL_URL
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

if (!mysqlUrl || !blobToken) {
  throw new Error('Set MYSQL_URL and BLOB_READ_WRITE_TOKEN before migrating profile photos.')
}

const connection = await createConnection(mysqlUrl)

function getImageType(contents) {
  const jpeg = contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff
  const png = contents.length >= 8
    && contents[0] === 0x89 && contents[1] === 0x50
    && contents[2] === 0x4e && contents[3] === 0x47
    && contents[4] === 0x0d && contents[5] === 0x0a
    && contents[6] === 0x1a && contents[7] === 0x0a
  const webp = contents.length >= 12
    && contents.toString('ascii', 0, 4) === 'RIFF'
    && contents.toString('ascii', 8, 12) === 'WEBP'

  if (jpeg) return { extension: 'jpg', contentType: 'image/jpeg' }
  if (png) return { extension: 'png', contentType: 'image/png' }
  if (webp) return { extension: 'webp', contentType: 'image/webp' }
  return null
}

async function loadImage(profilePhoto) {
  if (/^https?:\/\//i.test(profilePhoto)) {
    const url = new URL(profilePhoto)
    if (!['batangai.infinityfree.io', 'batangai.fwh.is'].includes(url.hostname)) {
      throw new Error(`Refusing to download a profile photo from ${url.hostname}.`)
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
      throw new Error(`Unable to download a profile photo (HTTP ${response.status}).`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  return readFile(join(
    process.cwd(),
    'uploads',
    'profile_photos',
    basename(profilePhoto),
  ))
}

try {
  const [users] = await connection.execute(
    `SELECT userID, profilePhoto FROM users
     WHERE profilePhoto IS NOT NULL
       AND profilePhoto <> ''
       AND profilePhoto NOT LIKE 'data:%'`,
  )
  let migrated = 0
  let skipped = 0

  for (const user of users) {
    const profilePhoto = String(user.profilePhoto)
    const fileName = basename(profilePhoto.split('?')[0])
    let contents
    try {
      contents = await loadImage(profilePhoto)
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        console.warn(`Skipped a missing profile-photo file: ${fileName}`)
        skipped += 1
        continue
      }
      throw error
    }

    const imageType = getImageType(contents)
    if (!imageType) {
      throw new Error(`The profile photo ${fileName} is not a valid JPG, PNG, or WEBP image.`)
    }
    const migratedName = `user_${user.userID}_${Date.now()}.${imageType.extension}`

    const blob = await put(`profile_photos/${migratedName}`, contents, {
      access: 'public',
      addRandomSuffix: true,
      contentType: imageType.contentType,
      token: blobToken,
    })
    await connection.execute(
      'UPDATE users SET profilePhoto = ? WHERE userID = ?',
      [blob.url, user.userID],
    )
    migrated += 1
  }

  console.log(`Profile-photo migration complete: ${migrated} migrated, ${skipped} missing.`)
} finally {
  await connection.end()
}
