import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasCookieInfoAck, setCookieInfoAck } from '@/lib/rgpdStorage'

describe('rgpdStorage', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('hasCookieInfoAck is false before ack', () => {
    expect(hasCookieInfoAck()).toBe(false)
  })

  it('setCookieInfoAck then hasCookieInfoAck is true', () => {
    setCookieInfoAck()
    expect(hasCookieInfoAck()).toBe(true)
  })

  it('hasCookieInfoAck returns false if localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(hasCookieInfoAck()).toBe(false)
  })

  it('setCookieInfoAck ignores write errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => setCookieInfoAck()).not.toThrow()
  })
})
