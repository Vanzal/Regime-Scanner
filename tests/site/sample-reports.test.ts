import { describe, expect, it } from 'vitest'
import { buildAllSampleReports, buildSampleReport } from '@/lib/sample-reports'
import { isLiveScanEnabled, isPricingLive, isProductReady, scanModeLabel } from '@/lib/flags'

describe('sample reports (fixture mapping engine)', () => {
  it('builds three synthetic DACH profiles from fixtures', () => {
    const reports = buildAllSampleReports()
    expect(reports.map((r) => r.id)).toEqual(['mittelstand-de', 'service-at', 'ch-eu-subsidiary'])
    for (const report of reports) {
      expect(report.synthetic).toBe(true)
      expect(report.regimes.map((r) => r.code)).toEqual(['DE', 'AT', 'CH'])
      expect(report.disclaimer).toMatch(/not legal advice/i)
      expect(report.gaps.length).toBeGreaterThan(0)
    }
  })

  it('DE mid-market manufacturing is IN for Germany and OUT for Austria', () => {
    const report = buildSampleReport('mittelstand-de')
    const de = report.regimes.find((r) => r.code === 'DE')
    const at = report.regimes.find((r) => r.code === 'AT')
    const ch = report.regimes.find((r) => r.code === 'CH')
    expect(de?.status).toBe('in')
    expect(at?.status).toBe('out')
    expect(ch?.status).toBe('out')
    expect(de?.reason.length).toBeGreaterThan(20)
    expect(de?.deadlines.some((d) => d.hours === 24)).toBe(true)
  })

  it('Austrian IT provider is IN for Austria and OUT for Germany', () => {
    const report = buildSampleReport('service-at')
    expect(report.regimes.find((r) => r.code === 'AT')?.status).toBe('in')
    expect(report.regimes.find((r) => r.code === 'DE')?.status).toBe('out')
    expect(report.gaps.some((g) => /DMARC/i.test(g.title))).toBe(true)
  })

  it('Swiss digital-infra entity with DE subsidiary keeps independent verdicts', () => {
    const report = buildSampleReport('ch-eu-subsidiary')
    const statuses = Object.fromEntries(report.regimes.map((r) => [r.code, r.status]))
    expect(statuses.CH).toBe('in')
    expect(statuses.AT).toBe('out')
    expect(['in', 'unclear']).toContain(statuses.DE)
    expect(report.regimes.every((r) => r.traceSummary.length > 0)).toBe(true)
  })
})

describe('product flags', () => {
  it('defaults waitlist-first (product and pricing gated)', () => {
    expect(isProductReady()).toBe(false)
    expect(isPricingLive()).toBe(false)
    expect(isLiveScanEnabled()).toBe(false)
    expect(scanModeLabel()).toBe('fixture')
  })

  it('isPricingLive follows NEXT_PUBLIC_PRICING_LIVE', () => {
    const prev = process.env.NEXT_PUBLIC_PRICING_LIVE
    process.env.NEXT_PUBLIC_PRICING_LIVE = 'true'
    expect(isPricingLive()).toBe(true)
    if (prev === undefined) delete process.env.NEXT_PUBLIC_PRICING_LIVE
    else process.env.NEXT_PUBLIC_PRICING_LIVE = prev
    expect(isPricingLive()).toBe(false)
  })
})
