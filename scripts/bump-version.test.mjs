import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, bumpCargoToml } from './bump-version.mjs'

describe('bumpCargoToml', () => {
  it('replaces only the [package] version line', () => {
    const toml = [
      '[package]',
      'name = "poiema-presenter"',
      'version = "0.1.0"',
      'edition = "2021"',
      '',
      '[dependencies]',
      'tauri = { version = "2.9" }',
      '',
    ].join('\n')

    const result = bumpCargoToml(toml, '0.2.0')

    expect(result).toContain('version = "0.2.0"')
    expect(result).toContain('tauri = { version = "2.9" }')
  })

  it('throws when there is no [package] section', () => {
    expect(() => bumpCargoToml('[dependencies]\n', '0.2.0')).toThrow()
  })
})

describe('run', () => {
  let dir

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bump-version-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', version: '0.1.0' }, null, 2),
    )
    writeFileSync(
      join(dir, 'Cargo.toml'),
      '[package]\nname = "x"\nversion = "0.1.0"\nedition = "2021"\n',
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('bumps both files together and returns the new version', () => {
    const newVersion = run({
      bumpType: 'minor',
      packageJsonPath: join(dir, 'package.json'),
      cargoTomlPath: join(dir, 'Cargo.toml'),
      log: () => {},
    })

    expect(newVersion).toBe('0.2.0')
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')).version).toBe('0.2.0')
    expect(readFileSync(join(dir, 'Cargo.toml'), 'utf-8')).toContain('version = "0.2.0"')
  })
})
