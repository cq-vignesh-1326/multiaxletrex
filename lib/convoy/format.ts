export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MON_TA = ['ஜன', 'பிப்', 'மார்ச்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']

export const uid = () => Math.random().toString(36).slice(2, 9)

export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return isFinite(n) ? n : 0
}

export const inr = (n: number) => (n < 0 ? '−' : '') + '₹' + Math.abs(Math.round(n || 0)).toLocaleString('en-IN')
export const nf = (n: number) => Math.round(n || 0).toLocaleString('en-IN')

// 2026-03-06 → 6/3/26 (tables) and 6/3/2026 (fields, PDF)
export const fmtD = (s?: string) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${+d}/${+m}/${y.slice(2)}`
}
export const fmtDate = (s?: string) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${+d}/${+m}/${y}`
}

export const today = () => new Date().toISOString().slice(0, 10)

export const monLbl = (k: string) => {
  if (k === 'Undated') return 'Undated / தேதி இல்லை'
  const [y, m] = k.split('-')
  return `${MON[+m - 1]} ${y} / ${MON_TA[+m - 1]}`
}

/** Bilingual label for plain text (options, placeholders, toasts). */
export const T = (en: string, ta: string) => `${en} / ${ta}`
