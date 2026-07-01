import { NextResponse } from 'next/server'

// ── Attendance Machine Sync API ─────────────────────────────────────
// Simulates a biometric/RFID attendance machine (like ZKTeco, Hikvision, etc.)
// Returns check-in/check-out records for a given date.
//
// In production, this would connect to the actual device via:
// - SDK API (e.g., ZKTeco ZKAccess)
// - WebSocket connection to the device
// - Polling a device's REST API
// - Reading from a USB-connected device
// - Parsing exported CSV/Excel files from the device

// Demo employee fingerprints (simulated device database)
const DEVICE_EMPLOYEES = [
  { employeeId: 'e1', name: 'Sarah Chen', fingerprintId: 'FP001' },
  { employeeId: 'e2', name: 'Mike Ross', fingerprintId: 'FP002' },
  { employeeId: 'e3', name: 'Alex Rivera', fingerprintId: 'FP003' },
  { employeeId: 'e4', name: 'Emma Stone', fingerprintId: 'FP004' },
  { employeeId: 'e5', name: 'James Wilson', fingerprintId: 'FP005' },
  { employeeId: 'e6', name: 'Lisa Park', fingerprintId: 'FP006' },
  { employeeId: 'e7', name: 'David Kim', fingerprintId: 'FP007' },
  { employeeId: 'e8', name: 'Rachel Green', fingerprintId: 'FP008' },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Simulate device connection delay (500ms-1.5s)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Parse the requested date
    const requestedDate = new Date(dateStr + 'T00:00:00.000Z')
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Simulate biometric scan records from the device
    // Each employee has different clock-in/out times based on the day
    const dayOfWeek = requestedDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (isWeekend) {
      // Weekend: fewer records (only some employees worked)
      return NextResponse.json({
        device: {
          model: 'ZKTeco MB460',
          serial: 'CF-ATT-2024-001',
          firmware: 'v3.2.1',
          location: 'Main Office - Entrance',
          lastSync: new Date().toISOString(),
        },
        records: [],
        message: 'No records for weekend',
      })
    }

    // Generate realistic check-in/out times for each employee
    const records = DEVICE_EMPLOYEES.map((emp, idx) => {
      // Vary clock-in time: 8:45 - 9:30 (some late)
      const inHour = 8
      const inMin = 45 + idx * 7 + Math.floor(Math.random() * 15)
      const clockIn = new Date(requestedDate)
      clockIn.setHours(inHour + Math.floor(inMin / 60), inMin % 60, Math.floor(Math.random() * 60), 0)

      // Determine status based on clock-in time
      const isLate = clockIn.getUTCHours() > 9 || (clockIn.getUTCHours() === 9 && clockIn.getUTCMinutes() > 15)

      // Some employees don't clock out yet (still working) — only for today
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const hasClockOut = !isToday || idx < 5 // first 5 have clocked out

      let clockOut: Date | null = null
      let workHours: number | null = null
      if (hasClockOut) {
        const outHour = 17 + (idx % 2) // 17:00 or 18:00
        const outMin = 15 + idx * 5
        clockOut = new Date(requestedDate)
        clockOut.setHours(outHour, outMin % 60, Math.floor(Math.random() * 60), 0)
        workHours = Math.round(((clockOut.getTime() - clockIn.getTime()) / 3600000) * 10) / 10
      }

      // Rachel (e8) is on maternity leave — skip
      if (emp.employeeId === 'e8') {
        return null
      }

      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        fingerprintId: emp.fingerprintId,
        clockIn: clockIn.toISOString(),
        clockOut: clockOut ? clockOut.toISOString() : null,
        status: isLate ? 'late' : 'present',
        workHours,
        verificationMode: idx % 3 === 0 ? 'fingerprint' : idx % 3 === 1 ? 'face' : 'card',
      }
    }).filter(Boolean)

    // Add some absent records (employees who didn't scan)
    const scannedIds = new Set(records.map(r => r?.employeeId))
    const absentEmployees = DEVICE_EMPLOYEES.filter(e => !scannedIds.has(e.employeeId) && e.employeeId !== 'e8')
    for (const emp of absentEmployees) {
      records.push({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        fingerprintId: emp.fingerprintId,
        clockIn: null as string | null,
        clockOut: null,
        status: 'absent',
        workHours: null,
        verificationMode: 'none',
      })
    }

    return NextResponse.json({
      device: {
        model: 'ZKTeco MB460',
        serial: 'CF-ATT-2024-001',
        firmware: 'v3.2.1',
        location: 'Main Office - Entrance',
        lastSync: new Date().toISOString(),
        totalUsers: DEVICE_EMPLOYEES.length,
        todayScans: records.filter(r => r?.clockIn).length,
      },
      records: records.filter(Boolean),
      date: dateStr,
    })
  } catch (error) {
    console.error('Attendance machine sync error:', error)
    return NextResponse.json({ error: 'Failed to sync with attendance device' }, { status: 500 })
  }
}
