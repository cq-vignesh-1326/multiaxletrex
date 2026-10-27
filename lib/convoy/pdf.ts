// A4 PDF of one trip sheet: page 1 summary, page 2 line-by-line details. Pages are built
// as HTML, rendered with html2canvas and placed one image per page with jsPDF.
import { CATS } from './constants'
import { calc } from './calc'
import { fmtDate, inr, nf, num, today } from './format'
import type { CatKey, Sheet } from './types'

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function pdfPages(s: Sheet): string[] {
  const r = calc(s)
  const e = esc
  const C = { ink: '#0f2b27', mute: '#5d7570', line: '#d6e3df', head: '#eaf4f1', teal: '#0f9d8a', ok: '#16a34a', warn: '#c77700', bad: '#d64032', soft: '#f6faf9' }
  const TA = `font-family:var(--font-tamil),'Noto Sans Tamil',sans-serif;font-weight:400`
  const tb = `border-collapse:collapse;width:100%;font-size:10.8px`
  const th = `text-align:left;padding:5px 6px;background:${C.head};border-bottom:1px solid ${C.line};font-weight:700;font-size:10.5px;vertical-align:bottom`
  const td = `padding:4px 6px;border-bottom:1px solid ${C.line};vertical-align:top`
  const nr = `text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap`
  const L = (en: string, ta: string) => `${en}<div style="${TA};font-size:9.5px;color:${C.mute}">${ta}</div>`
  const by = (v: string) => (v === 'driver' ? 'Driver / டிரைவர்' : 'Office / ஆபிஸ்')
  const PM: Record<string, string> = { account: 'Account / அக்கவுண்ட்', cheque: 'Cheque / செக்', gpay: 'GPay', driver: 'Driver cash / டிரைவர் வசூல்' }
  const page = (inner: string) => `<div class="pdfdoc" style="width:794px;box-sizing:border-box;padding:26px 30px;background:#fff;color:${C.ink};font-family:var(--font-body),'Segoe UI',sans-serif;font-size:12px;line-height:1.38">${inner}</div>`
  const header = (sub: string) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:10px;border-bottom:2px solid ${C.teal}">
    <div style="display:flex;align-items:center;gap:12px"><span style="width:26px;height:26px;border-radius:7px;background:#f5a524;display:inline-block"></span>
      <div><div style="font-size:21px;font-weight:800;letter-spacing:-.02em">${e(s.no || '—')} · ${e(s.vehicle || '')}</div><div style="font-size:10.5px;color:${C.mute};letter-spacing:.12em;font-weight:700">CONVOY · ${sub}</div></div></div>
    <div style="text-align:right;font-size:10.5px;color:${C.mute}">${s.settled ? `<b style="color:${C.ok}">Settled with driver</b>` : 'Open'}<br>Printed ${fmtDate(today())}</div></div>`
  const kv = (k: string, ta: string, v: string | number) => `<div style="min-width:0"><div style="font-size:9.5px;color:${C.mute};text-transform:uppercase;letter-spacing:.05em;font-weight:700">${k} <span style="${TA};text-transform:none;letter-spacing:0">${ta}</span></div><div style="font-size:12.5px;font-weight:700;margin-top:1px">${v}</div></div>`
  const row = (en: string, ta: string, v: string, st = '') => `<tr><td style="padding:3.5px 0;${st}">${en} <span style="${TA};font-size:10px;color:${C.mute}">${ta}</span></td><td style="padding:3.5px 0;${nr};${st}">${v}</td></tr>`
  const bold = `font-weight:800;border-top:1px solid ${C.line};padding-top:6px`
  const sec = (en: string, ta: string) => `<div style="margin:10px 0 4px;display:flex;align-items:baseline;gap:8px"><b style="font-size:13.5px">${en}</b><span style="${TA};font-size:11px;color:${C.mute}">${ta}</span></div>`
  const card = (inner: string, st = '') => `<div style="border:1px solid ${C.line};border-radius:12px;padding:12px 14px;${st}">${inner}</div>`
  const settleEn = r.settle > 0 ? 'Pay to driver' : r.settle < 0 ? 'Driver returns' : 'Even'
  const settleTa = r.settle > 0 ? 'டிரைவருக்கு கொடுக்கணும்' : r.settle < 0 ? 'டிரைவர் திருப்பி தரணும்' : 'சரி'

  // ---------- page 1: summary ----------
  const loadRows = s.loads.map((l, i) => {
    const got = (l.payments || []).reduce((a, p) => a + num(p.amount), 0)
    const left = num(l.rent) - got
    const st = !num(l.rent) ? '' : left <= 0 ? `<span style="color:${C.ok};font-weight:700">Received</span>` : `<span style="color:${C.warn};font-weight:700">Due ${inr(left)}</span>`
    return `<tr><td style="${td}">${i + 1}</td><td style="${td}">${fmtDate(l.date)}</td><td style="${td}">${e(l.from || '—')} → ${e(l.to || '—')}</td><td style="${td}">${e(l.goods || '')}</td><td style="${td};${nr}">${l.ton || ''}</td><td style="${td};${nr};font-weight:700">${inr(num(l.rent))}</td><td style="${td};${nr}">${inr(Math.round((num(l.rent) * r.commPct) / 100))}</td><td style="${td};${nr}">${inr(num(l.loading))}</td><td style="${td};${nr}">${inr(num(l.unloading))}</td><td style="${td}">${st}</td></tr>`
  }).join('')
  const otherTot = r.cat.other + r.cat.extra + r.cat.naka + r.cat.workshop
  const heads: [string, string, number][] = ([
    ['Diesel', 'டீசல்', r.cat.diesel], ['Commission', 'கமிஷன்', r.comm], ['Driver bata', 'டிரைவர் படி', r.bata], ['Cleaner bata', 'கிளீனர் படி', r.cleanerBata],
    ['Loading', 'ஏற்றுக்கூலி', r.loading], ['Unloading', 'இறக்குக்கூலி', r.unloading], ['RTO total', 'ஆர்.டி.ஓ மொத்தம்', r.cat.rto], ['PC total', 'பி.சி மொத்தம்', r.cat.pc],
    ['Toll', 'பாலம்', r.cat.toll], ['Other expenses total', 'இதர செலவு மொத்தம்', otherTot],
  ] as [string, string, number][]).filter((x) => x[2])
  const chip = (en: string, ta: string, v: string, col?: string) => `<div style="flex:1;min-width:0;background:${C.soft};border:1px solid ${C.line};border-radius:10px;padding:8px 10px"><div style="font-size:9.5px;color:${C.mute};font-weight:700;text-transform:uppercase;letter-spacing:.04em">${en} <span style="${TA};text-transform:none;letter-spacing:0">${ta}</span></div><div style="font-size:15px;font-weight:800;color:${col || C.ink}">${v}</div></div>`
  const verdict = `<div style="margin-top:8px;padding:10px 12px;border-radius:10px;background:${C.head};display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">${settleEn}<div style="${TA};font-size:10px;color:${C.mute}">${settleTa}</div></b><b style="font-size:20px">${inr(Math.abs(r.settle))}</b></div>`
  const p1 = page(`${header('TRIP SHEET SUMMARY · டிரிப் ஷீட் சுருக்கம்')}
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 14px;margin-top:12px;padding:11px 14px;border:1px solid ${C.line};border-radius:12px;background:${C.soft}">
      ${kv('Driver', 'டிரைவர்', e(s.driver || '—') + (s.driver2 ? ', ' + e(s.driver2) : ''))}${kv('Cleaner', 'கிளீனர்', e(s.cleaner || '—'))}${kv('From', 'ஆரம்பம்', fmtDate(s.from) || '—')}${kv('To', 'முடிவு', fmtDate(s.to) || '—')}${kv('Days', 'நாள்', r.days || '—')}${kv('Distance', 'கி.மீ', r.km ? nf(r.km) + ' km' : '—')}${kv('Diesel', 'டீசல்', nf(r.litres) + ' L')}${kv('Mileage', 'மைலேஜ்', r.mileage ? r.mileage.toFixed(2) + ' km/L' : '—')}</div>
    <div style="margin-top:14px">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><b style="font-size:13.5px">Loads and rent</b><span style="${TA};font-size:11px;color:${C.mute}">லோடு / வாடகை</span></div>
      <table style="${tb}"><tr><th style="${th}">#</th><th style="${th}">${L('Date', 'தேதி')}</th><th style="${th}">${L('Route', 'இடம்')}</th><th style="${th}">${L('Goods', 'லோடு')}</th><th style="${th};${nr}">${L('Ton', 'டன்')}</th><th style="${th};${nr}">${L('Rent', 'வாடகை')}</th><th style="${th};${nr}">${L('Comm. ' + r.commPct + '%', 'கமிஷன்')}</th><th style="${th};${nr}">${L('Loading', 'ஏ.கூலி')}</th><th style="${th};${nr}">${L('Unload', 'இ.கூலி')}</th><th style="${th}">${L('Rent status', 'வசூல்')}</th></tr>${loadRows}
      <tr><td colspan="5" style="${td};font-weight:800">Total / மொத்தம்</td><td style="${td};${nr};font-weight:800">${inr(r.rent)}</td><td style="${td};${nr};font-weight:700">${inr(r.comm)}</td><td style="${td};${nr};font-weight:700">${inr(r.loading)}</td><td style="${td};${nr};font-weight:700">${inr(r.unloading)}</td><td style="${td}"></td></tr></table>
      <div style="display:flex;gap:10px;margin-top:12px">${chip('Rent', 'வரவு', inr(r.rent))}${chip('In account / cheque', 'அக்கவுண்ட்', inr(r.accRecv))}${chip('Driver collected', 'டிரைவர் வசூல்', inr(r.drvRecv))}${chip('Still to come', 'வர வேண்டியது', inr(r.pending), r.pending ? C.warn : C.ok)}</div>
      <div style="display:flex;gap:10px;margin-top:10px">${chip('Per day', 'நாள் மீதி', r.days ? inr(r.perDay) : '—')}${chip('Per km', '1 கி.மீ. மீதி', r.perKm ? '₹' + r.perKm.toFixed(2) : '—')}${chip('Advance to driver', 'அட்வான்ஸ்', inr(r.advance))}${chip('Driver spent', 'டிரைவர் செலவு', inr(r.driverSpent))}</div>
      <div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px;margin-top:14px;align-items:start">
        ${card(`<b style="font-size:13.5px">Sheet total / மொத்தம்</b><table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px">
          ${row('Total rent', 'மொத்த வரவு', inr(r.rent), 'font-weight:800')}
          ${heads.map((x) => row(x[0], x[1], inr(x[2]), 'color:' + C.mute)).join('')}
          ${row('Total expense', 'மொத்த செலவு', inr(r.expense), bold)}</table>
          <div style="margin-top:8px;padding:10px 12px;border-radius:10px;background:${r.balance < 0 ? '#fdecea' : '#e8f7ee'};display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">Balance<div style="${TA};font-size:10px;color:${C.mute}">மீதி</div></b><b style="font-size:24px;color:${r.balance < 0 ? C.bad : C.ok}">${inr(r.balance)}</b></div>`)}
        ${card(`<b style="font-size:13.5px">Driver account / டிரைவர் கணக்கு</b><table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px">${row('Driver spent', 'டிரைவர் செலவு', inr(r.driverSpent))}${row('Less advance', 'அட்வான்ஸ் கழித்து', inr(-r.advance))}</table>${verdict}`)}
      </div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:26px;font-size:11px;color:${C.mute}"><div style="border-top:1px solid ${C.ink};padding-top:5px">Driver signature / டிரைவர் கையொப்பம்</div><div style="border-top:1px solid ${C.ink};padding-top:5px">Office signature / ஆபிஸ் கையொப்பம்</div></div>
    <div style="margin-top:10px;font-size:10px;color:${C.mute}">Line-by-line details of diesel, RTO, PC, other expenses, payments and advances are on the next page. / விவரங்கள் அடுத்த பக்கத்தில்.</div>`)

  // ---------- page 2: details ----------
  const tbl = (cols: [string, string, boolean][], rows: string, foot = '') =>
    `<table style="${tb}"><tr>${cols.map((c) => `<th style="${th};${c[2] ? nr : ''}">${L(c[0], c[1])}</th>`).join('')}</tr>${rows}${foot}</table>`
  const tot = (span: number, label: string, v: string, span2 = 0) =>
    `<tr><td colspan="${span}" style="${td};font-weight:800">${label}</td><td style="${td};${nr};font-weight:800">${v}</td>${span2 ? `<td colspan="${span2}" style="${td}"></td>` : ''}</tr>`
  const lineTable = (k: CatKey) => {
    const ls = s.lines[k] || []
    if (!ls.length) return ''
    const c = CATS.find((x) => x.k === k)!
    return `<div>${sec(c.en, c.ta)}${tbl([['#', '', false], [c.place ? 'Location' : 'Details', c.place ? 'இடம்' : 'விவரம்', false], ['Amount', 'ரூ.', true], ['By', 'யார்', false]],
      ls.map((x, i) => `<tr><td style="${td}">${i + 1}</td><td style="${td}">${e(x.desc || '')}</td><td style="${td};${nr}">${inr(num(x.amount))}</td><td style="${td};color:${C.mute}">${x.by === 'driver' ? 'D' : 'O'}</td></tr>`).join(''),
      tot(2, 'Total / மொத்தம்', inr(r.cat[k]), 1))}</div>`
  }
  const pays = s.loads.flatMap((l, i) => (l.payments || []).map((p) => `<tr><td style="${td}">${i + 1}. ${e(l.from || '—')} → ${e(l.to || '—')}</td><td style="${td}">${fmtDate(p.date)}</td><td style="${td}">${PM[p.mode] || e(p.mode)}</td><td style="${td}">${e(p.note || '')}</td><td style="${td};${nr}">${inr(num(p.amount))}</td></tr>`)).join('')
  const dies = (s.lines.diesel || []).map((x, i) => `<tr><td style="${td}">${i + 1}</td><td style="${td}">${fmtDate(x.date)}</td><td style="${td}">${e(x.desc || '')}</td><td style="${td};${nr}">${x.litres ? nf(num(x.litres)) + ' L' : ''}</td><td style="${td};${nr}">${x.rate || ''}</td><td style="${td};${nr}">${inr(num(x.amount))}</td><td style="${td}">${by(x.by)}</td></tr>`).join('')
  const advs = (s.advances || []).map((a, i) => `<tr><td style="${td}">${i + 1}</td><td style="${td}">${fmtDate(a.date)}</td><td style="${td}">${e(a.mode)}</td><td style="${td}">${e(a.note || '')}</td><td style="${td};${nr}">${inr(num(a.amount))}</td></tr>`).join('')
    + (r.drvRecv ? `<tr><td style="${td}"></td><td style="${td}"></td><td style="${td}" colspan="2">Rent collected by driver (from loads) / டிரைவர் வசூல்</td><td style="${td};${nr}">${inr(r.drvRecv)}</td></tr>` : '')
  const drvItems = r.driverItems.map((x) => row(x[0], x[1], inr(x[2]), 'color:' + C.mute)).join('')
  const grid2 = (a: string, b: string) => (a || b ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">${a || '<div></div>'}${b || '<div></div>'}</div>` : '')
  const grid3 = (...xs: string[]) => {
    xs = xs.filter(Boolean)
    return xs.length ? `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start">${xs.join('')}</div>` : ''
  }
  const p2 = page(`${header('DETAILS · விவரங்கள்')}
    <div style="font-size:9.5px;color:${C.mute};margin-top:6px">By: D = Driver paid / டிரைவர், O = Office paid / ஆபிஸ்</div>
    ${grid3(lineTable('rto'), lineTable('pc'), lineTable('other'))}
    ${grid3(lineTable('toll'), lineTable('extra'), lineTable('naka'), lineTable('workshop'))}
    ${dies ? `<div>${sec('Diesel', 'டீசல்')}${tbl([['#', '', false], ['Date', 'தேதி', false], ['Place', 'ஊர்', false], ['Litres', 'லிட்டர்', true], ['Rate', 'விலை', true], ['Amount', 'ரூ.', true], ['Paid by', 'யார்', false]], dies, `<tr><td colspan="3" style="${td};font-weight:800">Total / மொத்தம்</td><td style="${td};${nr};font-weight:800">${nf(r.litres)} L</td><td style="${td}"></td><td style="${td};${nr};font-weight:800">${inr(r.cat.diesel)}</td><td style="${td}"></td></tr>`)}</div>` : ''}
    ${pays ? `<div>${sec('Rent payments', 'வாடகை வசூல்')}${tbl([['Load', 'லோடு', false], ['Date', 'தேதி', false], ['How received', 'எப்படி', false], ['Remarks', 'குறிப்பு', false], ['Amount', 'ரூ.', true]], pays, tot(4, `Received / வந்தது · still to come ${inr(r.pending)}`, inr(r.accRecv + r.drvRecv)))}</div>` : ''}
    ${grid2(advs ? `<div>${sec('Advance to driver', 'அட்வான்ஸ்')}${tbl([['#', '', false], ['Date', 'தேதி', false], ['Mode', 'முறை', false], ['Note', 'குறிப்பு', false], ['Amount', 'ரூ.', true]], advs, tot(4, 'Total advance / மொத்த அட்வான்ஸ்', inr(r.advance)))}</div>` : '',
      `<div>${sec('Driver account breakdown', 'டிரைவர் கணக்கு விவரம்')}${card(`<table style="width:100%;border-collapse:collapse;font-size:11.5px">${drvItems}${row('Driver spent', 'டிரைவர் செலவு', inr(r.driverSpent), bold)}${row('Less advance', 'அட்வான்ஸ் கழித்து', inr(-r.advance))}${row(settleEn, settleTa, inr(Math.abs(r.settle)), bold)}</table>`, 'padding:8px 12px')}</div>`)}`)
  return [p1, p2]
}

export async function downloadPdf(s: Sheet) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  try { await document.fonts.ready } catch { /* fonts are a nicety */ }
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()
  const parts = pdfPages(s)
  for (let i = 0; i < parts.length; i++) {
    const box = document.createElement('div')
    box.style.cssText = 'position:fixed;left:-12000px;top:0;z-index:-1'
    box.innerHTML = parts[i]
    document.body.appendChild(box)
    const canvas = await html2canvas(box.firstElementChild as HTMLElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
    box.remove()
    // always one page per part: full width, or shrunk to fit the page height when the content is long
    let w = pw
    let h = (canvas.height * pw) / canvas.width
    const maxH = ph - 18
    if (h > maxH) { w = (w * maxH) / h; h = maxH }
    if (i) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pw - w) / 2, 0, w, h)
    pdf.setFontSize(8)
    pdf.setTextColor(120)
    pdf.text(`${s.no || ''}  ·  Page ${i + 1} of ${parts.length}`, pw - 22, ph - 8, { align: 'right' })
  }
  const name = `${s.no || 'trip-sheet'}_${String(s.vehicle || '').replace(/\s+/g, '')}.pdf`.replace(/_\.pdf$/, '.pdf')
  pdf.save(name)
}
