// Retry wrapper for database operations
// Handles Neon cold starts by retrying up to 3 times
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const error = e as Error
      // Don't retry on non-connection errors
      const msg = error?.message || ''
      if (!msg.includes('connect') && !msg.includes('timeout') && !msg.includes('Can\'t reach') && !msg.includes('Server has closed') && !msg.includes('Connection terminated')) {
        throw e
      }
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Retry failed')
}
