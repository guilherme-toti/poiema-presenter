import { describe, it, expect } from 'vitest'
import { bumpSemver } from './version.mjs'

describe('bumpSemver', () => {
  it('bumps patch', () => {
    expect(bumpSemver('1.2.3', 'patch')).toBe('1.2.4')
  })

  it('bumps minor and resets patch', () => {
    expect(bumpSemver('1.2.3', 'minor')).toBe('1.3.0')
  })

  it('bumps major and resets minor and patch', () => {
    expect(bumpSemver('1.2.3', 'major')).toBe('2.0.0')
  })

  it('throws on an invalid current version', () => {
    expect(() => bumpSemver('not-a-version', 'patch')).toThrow()
  })

  it('throws on an invalid bump type', () => {
    expect(() => bumpSemver('1.2.3', 'huge')).toThrow()
  })
})
