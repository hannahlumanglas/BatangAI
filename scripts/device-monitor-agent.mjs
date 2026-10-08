import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const apiUrl = process.env.DEVICE_MONITOR_API_URL?.trim()
const token = process.env.DEVICE_MONITOR_TOKEN?.trim()
const intervalMs = Math.max(5_000, Number(process.env.DEVICE_MONITOR_INTERVAL_MS) || 15_000)

if (!apiUrl || !token || token.length < 32) {
  console.error('Set DEVICE_MONITOR_API_URL and DEVICE_MONITOR_TOKEN (at least 32 characters).')
  process.exit(1)
}

const endpoint = new URL(apiUrl)
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) {
  console.error('Use an HTTPS API URL. HTTP is allowed only for local development.')
  process.exit(1)
}

async function request(options = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Monitoring API returned HTTP ${response.status}.`)
  }
  return data
}

function ping(ipAddress) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32'
    const executable = isWindows ? 'ping.exe' : 'ping'
    const args = isWindows
      ? ['-n', '1', '-w', '1800', ipAddress]
      : ['-n', '-c', '1', '-W', '2', ipAddress]
    const startedAt = performance.now()
    let output = ''
    let finished = false
    let child
    let timeout

    const finish = (result) => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      resolve(result)
    }

    timeout = setTimeout(() => {
      child?.kill()
      finish({ reachable: false, responseTimeMs: null })
    }, 3_000)

    try {
      child = spawn(executable, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
      child.on('error', () => finish({ reachable: false, responseTimeMs: null }))
      child.on('close', (code) => {
        if (code !== 0) {
          finish({ reachable: false, responseTimeMs: null })
          return
        }
        const match = output.match(/time[=<]\s*([\d.,]+)\s*ms/i)
        const parsed = match ? Number(match[1].replace(',', '.')) : performance.now() - startedAt
        finish({ reachable: true, responseTimeMs: Number.isFinite(parsed) ? parsed : null })
      })
    } catch {
      finish({ reachable: false, responseTimeMs: null })
    }
  })
}

async function monitorDevice(device) {
  const result = await ping(device.ipAddress)
  await request({
    method: 'POST',
    body: JSON.stringify({
      deviceID: device.deviceID,
      reachable: result.reachable,
      responseTimeMs: result.responseTimeMs,
    }),
  })
}

async function run() {
  console.log(`Monitoring agent started; checking registered devices every ${Math.round(intervalMs / 1000)} seconds.`)
  while (true) {
    try {
      const data = await request()
      const requested = new Set(Array.isArray(data.requestedDeviceIDs) ? data.requestedDeviceIDs : [])
      const devices = Array.isArray(data.devices)
        ? [...data.devices].sort((a, b) => Number(requested.has(b.deviceID)) - Number(requested.has(a.deviceID)))
        : []
      for (let start = 0; start < devices.length; start += 10) {
        await Promise.all(devices.slice(start, start + 10).map(async (device) => {
          if (typeof device.deviceID !== 'string' || typeof device.ipAddress !== 'string') return
          try {
            await monitorDevice(device)
          } catch (error) {
            console.error(`Could not report ${device.deviceID}: ${error.message}`)
          }
        }))
      }
    } catch (error) {
      console.error(`Monitoring cycle failed: ${error.message}`)
    }
    await delay(intervalMs)
  }
}

run().catch((error) => {
  console.error(`Monitoring agent stopped: ${error.message}`)
  process.exitCode = 1
})
