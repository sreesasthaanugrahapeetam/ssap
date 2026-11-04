import { Batch } from './types'
import { fmtPhone } from './utils'

/** Plain-text yatra + guru swamy details, ready to send to a new devotee. */
export function yatraText(b: Batch): string {
  const lines = ['🕉 Sree Sastha Anugraha Peetam', 'Sabarimala Yatra · ' + b.name + ' (' + b.year + ')']
  if (b.travel_date) lines.push('Travel date: ' + b.travel_date)
  if (b.vehicle) lines.push('Vehicle: ' + b.vehicle)
  if (b.notes) lines.push(b.notes)
  if (b.gurus.length) {
    lines.push('', b.gurus.length > 1 ? 'Guru Swamys:' : 'Guru Swamy:')
    b.gurus.forEach((g) => lines.push('• ' + g.name + (g.phone ? ' – ' + fmtPhone(g.phone) : '')))
  }
  lines.push('', 'Swamiye Saranam Ayyappa 🙏')
  return lines.join('\n')
}

/** Share through the device sheet; copy to clipboard where sharing is unavailable. Returns what happened. */
export async function shareYatra(b: Batch): Promise<'shared' | 'copied'> {
  const text = yatraText(b)
  if (navigator.share) {
    try { await navigator.share({ title: 'Yatra ' + b.name, text }); return 'shared' } catch (e) { if ((e as Error).name === 'AbortError') return 'shared' }
  }
  await navigator.clipboard.writeText(text)
  return 'copied'
}
