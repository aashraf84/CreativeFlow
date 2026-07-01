import { NextResponse } from 'next/server'

// ── Attendance Push API (receives data from local bridge agent) ─────
// The bridge agent runs on a computer in the same network as the
// Hikvision device and pushes records here.

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { records, deviceInfo } = body

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'records array required' }, { status: 400 })
    }

    // Forward each record to the attendance API
    let imported = 0
    const results: Array<{ employeeId: string; status: string; success: boolean }> = []

    for (const record of records) {
      try {
        const res = await fetch(new URL('/api/attendance', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: record.employeeId,
            date: record.date || new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
            clockIn: record.clockIn || null,
            clockOut: record.clockOut || null,
            status: record.status || 'present',
            workHours: record.workHours || null,
            notes: `Pushed from bridge: ${deviceInfo?.ipAddress || 'unknown device'}`,
          }),
        })

        if (res.ok) {
          imported++
          results.push({ employeeId: record.employeeId, status: 'imported', success: true })
        } else {
          results.push({ employeeId: record.employeeId, status: 'failed', success: false })
        }
      } catch {
        results.push({ employeeId: record.employeeId, status: 'error', success: false })
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: records.length,
      results,
      device: deviceInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Bridge push error:', error)
    return NextResponse.json({ error: 'Push failed' }, { status: 500 })
  }
}

// GET — returns bridge connection status and format info
export async function GET() {
  return NextResponse.json({
    endpoint: 'attendance-bridge',
    status: 'ready',
    description: 'POST attendance records here from the local bridge agent',
    format: {
      records: [{
        employeeId: 'e1',
        date: '2026-07-01T00:00:00.000Z',
        clockIn: '2026-07-01T09:00:00.000Z',
        clockOut: '2026-07-01T17:30:00.000Z',
        status: 'present',
        workHours: 8.5,
      }],
      deviceInfo: {
        ipAddress: '192.168.1.201',
        model: 'Hikvision DS-K1T341CMFW',
        serial: '49461691',
      }
    }
  })
}
