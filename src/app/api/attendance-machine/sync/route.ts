import { NextResponse } from 'next/server'
import {
  type HikvisionDeviceConfig,
  testConnection,
  searchAttendanceRecords,
  getDeviceUsers,
} from '@/lib/hikvision-adapter'

// ── Hikvision ISAPI Sync Endpoint ───────────────────────────────────
// Connects to a REAL Hikvision DS-K1T341CMFW device via ISAPI
//
// Query params:
//   date: YYYY-MM-DD (the date to fetch records for)
//   ipAddress: Device IP (e.g. 192.168.1.201)
//   port: Device port (default: 80)
//   username: ISAPI username (default: admin)
//   password: ISAPI password
//   useHttps: true/false (default: false)
//
// If no device params are provided, falls back to simulation mode.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const ipAddress = searchParams.get('ipAddress')
    const port = searchParams.get('port') || '80'
    const username = searchParams.get('username') || 'admin'
    const password = searchParams.get('password') || ''
    const useHttps = searchParams.get('useHttps') === 'true'

    // ── Real device mode: if IP address is provided, try real ISAPI ──
    if (ipAddress && password) {
      const config: HikvisionDeviceConfig = {
        ipAddress,
        port: parseInt(port),
        username,
        password,
        useHttps,
      }

      // First test the connection
      const connectionTest = await testConnection(config)
      if (!connectionTest.success) {
        return NextResponse.json({
          success: false,
          error: `Cannot connect to device: ${connectionTest.error}`,
          mode: 'real-device',
          config: { ipAddress, port, username },
        }, { status: 502 })
      }

      // Fetch attendance records for the date
      const startOfDay = `${dateStr}T00:00:00Z`
      const endOfDay = `${dateStr}T23:59:59Z`
      const recordsResult = await searchAttendanceRecords(config, startOfDay, endOfDay)

      if (!recordsResult.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to fetch records: ${recordsResult.error}`,
          mode: 'real-device',
          device: connectionTest.deviceInfo,
        }, { status: 502 })
      }

      // Transform Hikvision records to CreativeFlow format
      const records = recordsResult.records!.map(r => {
        const isCheckIn = r.major === 0
        return {
          employeeId: r.employeeNo,
          employeeName: r.employeeName || `Employee ${r.employeeNo}`,
          clockIn: isCheckIn ? r.time : null,
          clockOut: !isCheckIn ? r.time : null,
          status: r.attendanceStatus === 'late' ? 'late' : 'present',
          workHours: null, // Calculated when both in/out are matched
          verificationMode: r.verifyMode,
          deviceName: r.deviceName,
          deviceSerial: r.deviceSerial,
        }
      })

      // Group by employee to pair check-in/check-out
      const groupedRecords = groupAttendanceByEmployee(records)

      return NextResponse.json({
        success: true,
        mode: 'real-device',
        device: connectionTest.deviceInfo,
        records: groupedRecords,
        date: dateStr,
        totalScans: records.length,
      })
    }

    // ── Simulation mode (no real device configured) ──
    return simulateDeviceResponse(dateStr)
  } catch (error) {
    console.error('Hikvision sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// ── Group check-in/out records by employee ──────────────────────────
function groupAttendanceByEmployee(records: Array<{
  employeeId: string
  employeeName: string
  clockIn: string | null
  clockOut: string | null
  status: string
  workHours: number | null
  verificationMode: string
}>): Array<{
  employeeId: string
  employeeName: string
  clockIn: string
  clockOut: string | null
  status: string
  workHours: number | null
  selected: boolean
}> {
  const byEmployee = new Map<string, {
    employeeId: string
    employeeName: string
    clockIn: string | null
    clockOut: string | null
    verificationMode: string
  }>()

  for (const r of records) {
    const existing = byEmployee.get(r.employeeId)
    if (existing) {
      if (r.clockIn && !existing.clockIn) existing.clockIn = r.clockIn
      if (r.clockOut && !existing.clockOut) existing.clockOut = r.clockOut
    } else {
      byEmployee.set(r.employeeId, {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        clockIn: r.clockIn,
        clockOut: r.clockOut,
        verificationMode: r.verificationMode,
      })
    }
  }

  return Array.from(byEmployee.values()).map(emp => {
    let workHours: number | null = null
    let status = 'present'

    if (emp.clockIn && emp.clockOut) {
      try {
        const inTime = new Date(emp.clockIn).getTime()
        const outTime = new Date(emp.clockOut).getTime()
        workHours = Math.round(((outTime - inTime) / 3600000) * 10) / 10
      } catch { /* ignore */ }

      // Check if late (after 9:15)
      try {
        const inDate = new Date(emp.clockIn)
        if (inDate.getUTCHours() > 9 || (inDate.getUTCHours() === 9 && inDate.getUTCMinutes() > 15)) {
          status = 'late'
        }
      } catch { /* ignore */ }
    } else if (!emp.clockIn) {
      status = 'absent'
    }

    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      clockIn: emp.clockIn || '',
      clockOut: emp.clockOut,
      status,
      workHours,
      selected: true,
    }
  })
}

// ── Simulation fallback (when no real device is configured) ─────────
function simulateDeviceResponse(dateStr: string) {
  const DEVICE_EMPLOYEES = [
    { employeeId: 'e1', name: 'Sarah Chen' },
    { employeeId: 'e2', name: 'Mike Ross' },
    { employeeId: 'e3', name: 'Alex Rivera' },
    { employeeId: 'e4', name: 'Emma Stone' },
    { employeeId: 'e5', name: 'James Wilson' },
    { employeeId: 'e6', name: 'Lisa Park' },
    { employeeId: 'e7', name: 'David Kim' },
  ]

  const requestedDate = new Date(dateStr + 'T00:00:00.000Z')
  if (isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const dayOfWeek = requestedDate.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({
      mode: 'simulation',
      device: { model: 'Hikvision DS-K1T341CMFW (Simulation)', serial: 'N/A' },
      records: [],
      message: 'Weekend — no records',
    })
  }

  // Simulate realistic Hikvision records (individual check-in/out events)
  const records = DEVICE_EMPLOYEES.map((emp, idx) => {
    const inHour = 8
    const inMin = 45 + idx * 7 + Math.floor(Math.random() * 15)
    const clockIn = new Date(requestedDate)
    clockIn.setUTCHours(inHour + Math.floor(inMin / 60), inMin % 60, 0, 0)

    const isLate = clockIn.getUTCHours() > 9 || (clockIn.getUTCHours() === 9 && clockIn.getUTCMinutes() > 15)
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    const hasClockOut = !isToday || idx < 5

    let clockOut: string | null = null
    if (hasClockOut) {
      const outHour = 17 + (idx % 2)
      const outMin = 15 + idx * 5
      clockOut = new Date(requestedDate)
      clockOut.setUTCHours(outHour, outMin % 60, 0, 0)
    }

    let workHours: number | null = null
    if (clockOut) {
      workHours = Math.round(((new Date(clockOut).getTime() - clockIn.getTime()) / 3600000) * 10) / 10
    }

    return {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      clockIn: clockIn.toISOString(),
      clockOut,
      status: isLate ? 'late' : 'present',
      workHours,
      selected: true,
      verificationMode: idx % 3 === 0 ? 'face' : idx % 3 === 1 ? 'card' : 'fingerprint',
    }
  })

  return NextResponse.json({
    mode: 'simulation',
    device: {
      model: 'Hikvision DS-K1T341CMFW (Simulation)',
      serial: '49461691',
      firmware: 'V030308ENL',
      location: 'Main Office — Simulation Mode',
      note: 'No real device configured. Add device IP + password in Machine Manager for real sync.',
    },
    records,
    date: dateStr,
    totalScans: records.filter(r => r.clockIn).length,
  })
}
