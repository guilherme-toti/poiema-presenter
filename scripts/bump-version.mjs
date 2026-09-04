#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { bumpSemver } from './version.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

export function bumpCargoToml(cargoToml, newVersion) {
  const lines = cargoToml.split('\n')
  const packageStart = lines.findIndex((line) => line.trim() === '[package]')
  if (packageStart === -1) {
    throw new Error('No [package] section found in Cargo.toml')
  }
  for (let i = packageStart + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\[/.test(line.trim())) break
    if (/^version\s*=/.test(line.trim())) {
      lines[i] = `version = "${newVersion}"`
      return lines.join('\n')
    }
  }
  throw new Error('No version field found in [package] section of Cargo.toml')
}

export function run({ bumpType, packageJsonPath, cargoTomlPath, log = console.error }) {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const newVersion = bumpSemver(pkg.version, bumpType)

  pkg.version = newVersion
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
  log(`package.json -> ${newVersion}`)

  const cargoRaw = readFileSync(cargoTomlPath, 'utf-8')
  writeFileSync(cargoTomlPath, bumpCargoToml(cargoRaw, newVersion))
  log(`Cargo.toml -> ${newVersion}`)

  return newVersion
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  const bumpType = process.argv[2]
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-version.mjs <patch|minor|major>')
    process.exit(1)
  }
  const newVersion = run({
    bumpType,
    packageJsonPath: resolve(repoRoot, 'package.json'),
    cargoTomlPath: resolve(repoRoot, 'src-tauri/Cargo.toml'),
  })
  console.log(newVersion)
}
