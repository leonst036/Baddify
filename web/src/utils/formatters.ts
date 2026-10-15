export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

export function formatRate(bytesPerSec?: number): string {
  if (bytesPerSec === undefined || bytesPerSec === null || isNaN(bytesPerSec)) return '-- B/s'
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  const kb = bytesPerSec / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB/s`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB/s`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB/s`
}

export function formatRamUsage(usedBytes: number, totalBytes: number): string {
  if (!totalBytes || totalBytes <= 0) return '-- / --'
  const usedGb = usedBytes / (1024 * 1024 * 1024)
  const totalGb = totalBytes / (1024 * 1024 * 1024)
  if (totalGb >= 1) {
    const totalStr = totalGb.toFixed(1).replace(/\.0$/, '')
    return `${usedGb.toFixed(1)} / ${totalStr} GB`
  }
  const usedMb = (usedBytes / (1024 * 1024)).toFixed(0)
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(0)
  return `${usedMb} / ${totalMb} MB`
}
