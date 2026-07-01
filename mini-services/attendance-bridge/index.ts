// ════════════════════════════════════════════════════════════════════
// CreativeFlow ERP — Attendance Device Bridge Agent
// ════════════════════════════════════════════════════════════════════
//
// This script runs on a computer in the SAME network as your Hikvision
// attendance device. It:
//   1. Connects to the device locally (192.168.x.x)
//   2. Fetches check-in/check-out records via ISAPI
//   3. Pushes them to your CreativeFlow ERP cloud instance
//
// HOW TO USE:
//   1. Install Bun: https://bun.sh
//   2. Edit the configuration below (DEVICE_IP, ERP_URL, etc.)
//   3. Run: bun index.ts
//   4. Leave it running — it auto-syncs every 5 minutes
//
// For production: run as a Windows Service or Linux systemd service
// ════════════════════════════════════════════════════════════════════

// ─── CONFIGURATION — EDIT THESE VALUES ───────────────────────────────

const CONFIG = {
  // Your Hikvision device settings (LOCAL network)
  DEVICE: {
    ipAddress: "192.168.1.201",    // ← Change to your device's IP
    port: 80,                       // ← 80 for HTTP, 443 for HTTPS
    username: "admin",              // ← ISAPI username
    password: "your_device_password", // ← ISAPI password (set on device web interface)
  },

  // Your CreativeFlow ERP cloud instance
  ERP: {
    url: "https://creativeflowerp.vercel.app",  // ← Your ERP URL
    // If running locally: "http://localhost:3000"
  },

  // Sync settings
  SYNC_INTERVAL_MINUTES: 5,  // ← Auto-sync every 5 minutes
  AUTO_IMPORT: true,          // ← Automatically import new records to ERP
}

// ─── DON'T EDIT BELOW THIS LINE ──────────────────────────────────────

const DEVICE_URL = `http://${CONFIG.DEVICE.ipAddress}:${CONFIG.DEVICE.port}`
const AUTH_HEADER = "Basic " + btoa(`${CONFIG.DEVICE.username}:${CONFIG.DEVICE.password}`)

// ─── Main ────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  CreativeFlow ERP — Attendance Bridge Agent v1.0             ║
╠══════════════════════════════════════════════════════════════╣
║  Device: ${CONFIG.DEVICE.ipAddress}:${CONFIG.DEVICE.port}                       ║
║  ERP:    ${CONFIG.ERP.url.padEnd(45)}║
║  Sync:   Every ${CONFIG.SYNC_INTERVAL_MINUTES} minutes                                ║
╚══════════════════════════════════════════════════════════════╝
`)

// Track synced record IDs to avoid duplicates
const syncedRecordIds = new Set<string>()

// ─── Test Device Connection ──────────────────────────────────────────

async function testDeviceConnection(): Promise<boolean> {
  try {
    console.log(`[${timestamp()}] Testing connection to ${DEVICE_URL}...`)
    
    const res = await fetch(`${DEVICE_URL}/ISAPI/System/deviceInfo`, {
      headers: {
        "Authorization": AUTH_HEADER,
        "Accept": "application/xml",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.error(`[${timestamp()}] ✗ Device returned HTTP ${res.status}`)
      return false
    }

    const xml = await res.text()
    const deviceName = xml.match(/<deviceName>(.*?)<\/deviceName>/i)?.[1] || "Unknown"
    const serial = xml.match(/<serialNumber>(.*?)<\/serialNumber>/i)?.[1] || "Unknown"
    const model = xml.match(/<model>(.*?)<\/model>/i)?.[1] || "Unknown"
    
    console.log(`[${timestamp()}] ✓ Device connected: ${deviceName}`)
    console.log(`[${timestamp()}]   Model: ${model}`)
    console.log(`[${timestamp()}]   Serial: ${serial}`)
    return true
  } catch (error) {
    console.error(`[${timestamp()}] ✗ Cannot connect to device: ${error}`)
    console.error(`[${timestamp()}]   Check: IP address, port, username/password`)
    console.error(`[${timestamp()}]   Make sure this computer is on the same network as the device`)
    return false
  }
}

// ─── Fetch Attendance Records from Device ────────────────────────────

async function fetchAttendanceRecords(): Promise<any[]> {
  const today = new Date().toISOString().split("T")[0]
  const startOfDay = `${today}T00:00:00Z`
  const endOfDay = `${today}T23:59:59Z`

  try {
    const res = await fetch(`${DEVICE_URL}/ISAPI/TimeAttendance/AttendanceRecord/search?format=json`, {
      method: "POST",
      headers: {
        "Authorization": AUTH_HEADER,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        AttendanceRecordSearchCond: {
          searchID: "1",
          searchResultPosition: 0,
          maxResults: 1000,
          employeeNo: null,
          timePeriod: {
            startTime: startOfDay,
            endTime: endOfDay,
          },
        },
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.error(`[${timestamp()}] ✗ Device returned HTTP ${res.status} for attendance search`)
      return []
    }

    const data = await res.json()
    const records = data.AttendanceRecordSearch?.MatchItem || []
    return records
  } catch (error) {
    console.error(`[${timestamp()}] ✗ Failed to fetch records: ${error}`)
    return []
  }
}

// ─── Push Records to CreativeFlow ERP ────────────────────────────────

async function pushToERP(records: any[]): Promise<number> {
  let pushed = 0

  for (const record of records) {
    const employeeNo = String(record.employeeNo || "")
    const recordId = `${employeeNo}_${record.time}`
    
    // Skip already synced records
    if (syncedRecordIds.has(recordId)) continue

    const isCheckIn = Number(record.major) === 0
    const employeeName = String(record.employeeName || `Employee ${employeeNo}`)
    
    try {
      // Push to ERP
      const erpUrl = `${CONFIG.ERP.url}/api/attendance`
      const res = await fetch(erpUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeNo,
          employeeName: employeeName,
          date: new Date().toISOString().split("T")[0] + "T00:00:00.000Z",
          clockIn: isCheckIn ? record.time : null,
          clockOut: !isCheckIn ? record.time : null,
          status: "present",
          notes: `Auto-synced from Hikvision device (${CONFIG.DEVICE.ipAddress})`,
          verificationMode: Number(record.minor) === 0 ? "face" : Number(record.minor) === 1 ? "card" : "password",
        }),
      })

      if (res.ok) {
        syncedRecordIds.add(recordId)
        pushed++
        console.log(`[${timestamp()}] ✓ Pushed: ${employeeName} ${isCheckIn ? "check-in" : "check-out"} at ${record.time}`)
      }
    } catch (error) {
      console.error(`[${timestamp()}] ✗ Failed to push record for ${employeeName}: ${error}`)
    }
  }

  return pushed
}

// ─── Sync Cycle ──────────────────────────────────────────────────────

async function syncCycle() {
  console.log(`[${timestamp()}] ── Sync cycle started ──`)

  // 1. Test device connection
  const connected = await testDeviceConnection()
  if (!connected) {
    console.log(`[${timestamp()}] Skipping sync — device not reachable`)
    return
  }

  // 2. Fetch attendance records from device
  const records = await fetchAttendanceRecords()
  console.log(`[${timestamp()}] Found ${records.length} records on device`)

  if (records.length === 0) {
    console.log(`[${timestamp()}] No new records to sync`)
    return
  }

  // 3. Push to ERP
  const pushed = await pushToERP(records)
  console.log(`[${timestamp()}] ✓ Pushed ${pushed} new record(s) to ERP`)
  console.log(`[${timestamp()}] ── Sync complete ──\n`)
}

// ─── Helper ──────────────────────────────────────────────────────────

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

// ─── Start ───────────────────────────────────────────────────────────

async function main() {
  // Initial sync
  await syncCycle()

  // Schedule periodic syncs
  const intervalMs = CONFIG.SYNC_INTERVAL_MINUTES * 60 * 1000
  console.log(`[${timestamp()}] Next sync in ${CONFIG.SYNC_INTERVAL_MINUTES} minutes...`)
  
  setInterval(async () => {
    await syncCycle()
    console.log(`[${timestamp()}] Next sync in ${CONFIG.SYNC_INTERVAL_MINUTES} minutes...`)
  }, intervalMs)

  // Keep process alive
  console.log(`[${timestamp()}] Bridge agent running. Press Ctrl+C to stop.`)
}

main()
