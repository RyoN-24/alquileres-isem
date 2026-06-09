import { describe, expect, it } from 'vitest'
import { serviceOrderDays } from '../src/contracts/contract.service'

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

describe('serviceOrderDays', () => {
  it('counts daily service dates inclusively', () => {
    expect(serviceOrderDays(utcDate('2026-01-01'), utcDate('2026-01-31'))).toBe(31)
  })

  it('counts a same-day service as one billable day', () => {
    expect(serviceOrderDays(utcDate('2026-01-01'), utcDate('2026-01-01'))).toBe(1)
  })
})
