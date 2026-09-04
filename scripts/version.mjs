const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/

export function bumpSemver(current, bumpType) {
  const match = SEMVER_RE.exec(current)
  if (!match) {
    throw new Error(`Invalid version "${current}", expected "x.y.z"`)
  }
  const [major, minor, patch] = match.slice(1).map(Number)

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type "${bumpType}", expected "major", "minor", or "patch"`)
  }
}
