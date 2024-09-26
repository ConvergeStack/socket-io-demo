export function formatUptime (seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)
  return `${d}d ${h}h ${m}m ${s}s`
}

export function formatMemoryUsage (memoryUsage: NodeJS.MemoryUsage): Record<string, string> {
  return {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
  }
}

export function formatCpuUsage (cpuUsage: NodeJS.CpuUsage): Record<string, string> {
  return {
    user: `${(cpuUsage.user / 1000000).toFixed(2)} ms`,
    system: `${(cpuUsage.system / 1000000).toFixed(2)} ms`
  }
}
