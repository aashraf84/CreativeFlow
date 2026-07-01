// ── Hikvision ISAPI Adapter ─────────────────────────────────────────
// Integrates with Hikvision face recognition terminals (DS-K1T series)
// via the ISAPI (IP Surveillance API) protocol.
//
// Device: Hikvision DS-K1T341CMFW
// Protocol: ISAPI over HTTP/HTTPS
// Auth: Digest authentication (username/password)
// Default port: 80 (HTTP) or 443 (HTTPS)
//
// API Reference: ISAPI 2.0 - Time Attendance Module
// https://www.hikvision.com/en/support/downloads/isapi-2.0/

export interface HikvisionDeviceConfig {
  ipAddress: string
  port: number
  username: string
  password: string
  useHttps: boolean
}

export interface HikvisionAttendanceRecord {
  employeeNo: string
  employeeName: string
  attendanceStatus: string  // "checkIn", "checkOut", "absent", "late", etc.
  time: string              // ISO 8601 timestamp
  major: number             // 0 = check-in, 1 = check-out
  minor: number             // Sub-event type
  deviceName: string
  deviceSerial: string
  verifyMode: string        // "face", "card", "password", "fingerprint"
}

export interface HikvisionDeviceInfo {
  deviceName: string
  deviceID: string
  deviceType: string
  model: string
  serialNumber: string
  firmwareVersion: string
  deviceLocation: string
  maxUserCount: number
  currentUserCount: number
}

export interface HikvisionUserInfo {
  employeeNo: string
  name: string
  userType: string
  role: string
  cardNumber: string
  faceValid: boolean
  fingerprintValid: boolean
}

// ── Build base URL ──────────────────────────────────────────────────
function buildBaseUrl(config: HikvisionDeviceConfig): string {
  const protocol = config.useHttps ? 'https' : 'http'
  return `${protocol}://${config.ipAddress}:${config.port}`
}

// ── Digest Auth Header ──────────────────────────────────────────────
// Hikvision uses HTTP Digest authentication
function buildAuthHeader(config: HikvisionDeviceConfig): string {
  // Basic auth as fallback (digest requires challenge-response which is
  // handled by fetch's credentials option in browsers, but for server-side
  // we use basic auth which Hikvision also accepts)
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
  return `Basic ${credentials}`
}

// ── Test Device Connection ──────────────────────────────────────────
export async function testConnection(config: HikvisionDeviceConfig): Promise<{
  success: boolean
  deviceInfo?: HikvisionDeviceInfo
  error?: string
}> {
  try {
    const url = `${buildBaseUrl(config)}/ISAPI/System/deviceInfo`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(config),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      // Try XML response (Hikvision often returns XML)
      const text = await res.text()
      return {
        success: false,
        error: `Device returned ${res.status}: ${text.substring(0, 200)}`,
      }
    }

    const text = await res.text()
    // Hikvision returns XML, parse it
    const deviceInfo = parseDeviceInfoXML(text)
    return { success: true, deviceInfo }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

// ── Get Device Info (XML parser) ────────────────────────────────────
function parseDeviceInfoXML(xml: string): HikvisionDeviceInfo {
  const extract = (tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'))
    return match ? match[1].trim() : ''
  }
  return {
    deviceName: extract('deviceName') || 'Unknown',
    deviceID: extract('deviceID') || '',
    deviceType: extract('deviceType') || 'DS-K1T341CMFW',
    model: extract('model') || 'DS-K1T341CMFW',
    serialNumber: extract('serialNumber') || '',
    firmwareVersion: extract('firmwareVersion') || '',
    deviceLocation: extract('deviceLocation') || 'Unknown',
    maxUserCount: parseInt(extract('maxUserCount') || '0'),
    currentUserCount: parseInt(extract('currentUserCount') || '0'),
  }
}

// ── Get All Users from Device ───────────────────────────────────────
export async function getDeviceUsers(config: HikvisionDeviceConfig): Promise<{
  success: boolean
  users?: HikvisionUserInfo[]
  error?: string
}> {
  try {
    const url = `${buildBaseUrl(config)}/ISAPI/AccessControl/UserInfo/Search?format=json`
    const body = JSON.stringify({
      UserInfoSearchCond: {
        searchID: '1',
        searchResultPosition: 0,
        maxResults: 500,
      },
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(config),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return { success: false, error: `Failed to fetch users: ${res.status}` }
    }

    const data = await res.json()
    const users: HikvisionUserInfo[] = (data.UserInfoSearch?.UserInfo || []).map((u: Record<string, unknown>) => ({
      employeeNo: String(u.employeeNo || ''),
      name: String(u.name || ''),
      userType: String(u.userType || 'normal'),
      role: String(u.role || ''),
      cardNumber: String(u.cardNumber || ''),
      faceValid: Boolean(u.faceValid),
      fingerprintValid: Boolean(u.fingerprintValid),
    }))

    return { success: true, users }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}

// ── Search Attendance Records ───────────────────────────────────────
export async function searchAttendanceRecords(
  config: HikvisionDeviceConfig,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean
  records?: HikvisionAttendanceRecord[]
  error?: string
}> {
  try {
    const url = `${buildBaseUrl(config)}/ISAPI/TimeAttendance/AttendanceRecord/search?format=json`
    const body = JSON.stringify({
      AttendanceRecordSearchCond: {
        searchID: '1',
        searchResultPosition: 0,
        maxResults: 1000,
        employeeNo: null,  // null = all employees
        timePeriod: {
          startTime: startDate,
          endTime: endDate,
        },
      },
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(config),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { success: false, error: `Failed to fetch records: ${res.status}` }
    }

    const data = await res.json()
    const records: HikvisionAttendanceRecord[] = (data.AttendanceRecordSearch?.MatchItem || []).map((r: Record<string, unknown>) => ({
      employeeNo: String(r.employeeNo || ''),
      employeeName: String(r.employeeName || ''),
      attendanceStatus: String(r.attendanceStatus || 'unknown'),
      time: String(r.time || ''),
      major: Number(r.major || 0),    // 0 = check-in, 1 = check-out
      minor: Number(r.minor || 0),
      deviceName: String(r.deviceName || config.ipAddress),
      deviceSerial: String(r.deviceSerial || ''),
      verifyMode: parseVerifyMode(Number(r.major), Number(r.minor)),
    }))

    return { success: true, records }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attendance records',
    }
  }
}

// ── Parse verification mode from major/minor codes ──────────────────
function parseVerifyMode(major: number, minor: number): string {
  // Hikvision major/minor codes:
  // major=0: check-in, major=1: check-out
  // minor=0: face, minor=1: card, minor=2: password, minor=3: fingerprint
  const modes = ['face', 'card', 'password', 'fingerprint']
  return modes[minor] || 'unknown'
}

// ── Register employee on device (enroll face/card) ──────────────────
export async function registerEmployee(
  config: HikvisionDeviceConfig,
  employeeNo: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${buildBaseUrl(config)}/ISAPI/AccessControl/UserInfo/Record?format=json`
    const body = JSON.stringify({
      UserInfo: {
        employeeNo: employeeNo,
        name: name,
        userType: 'normal',
        Valid: {
          enable: true,
          beginTime: '2024-01-01T00:00:00Z',
          endTime: '2030-12-31T23:59:59Z',
          timeType: 'local',
        },
      },
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return { success: false, error: `Registration failed: ${res.status}` }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }
  }
}

// ── Delete employee from device ─────────────────────────────────────
export async function deleteEmployee(
  config: HikvisionDeviceConfig,
  employeeNo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${buildBaseUrl(config)}/ISAPI/AccessControl/UserInfo/Delete?format=json`
    const body = JSON.stringify({
      UserInfoDelCond: {
        EmployeeNoList: [{ employeeNo }],
      },
    })

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': buildAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return { success: false, error: `Delete failed: ${res.status}` }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}
