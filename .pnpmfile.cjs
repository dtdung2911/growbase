// Types-only fix for mixed @types/react majors in this monorepo
// (apps/web: React 18 types, apps/mobile: React 19 types).
//
// Packages whose .d.ts files reference React types get an optional
// @types/react peer injected, so pnpm links the CONSUMER's @types/react into
// each package's virtual dir. Without this, their .d.ts files resolve
// @types/react from pnpm's hidden hoist (node_modules/.pnpm/node_modules),
// which holds a single arbitrary version and breaks type-check for whichever
// app uses the other major.
//
// Covered: every package that peer-depends on `react`, plus packages that
// use React types in .d.ts without declaring a react peer (iconify packs).
const EXTRA_PACKAGES = new Set(["@iconify/css-react"])
const EXTRA_PREFIXES = ["@iconify-react/"]

function needsReactTypesPeer(pkg) {
  if (!pkg.name || pkg.name === "@types/react") return false
  if (pkg.peerDependencies?.react) return true
  if (EXTRA_PACKAGES.has(pkg.name)) return true
  return EXTRA_PREFIXES.some((prefix) => pkg.name.startsWith(prefix))
}

function readPackage(pkg) {
  if (needsReactTypesPeer(pkg) && !pkg.peerDependencies?.["@types/react"]) {
    pkg.peerDependencies = { ...pkg.peerDependencies, "@types/react": "*" }
    pkg.peerDependenciesMeta = {
      ...pkg.peerDependenciesMeta,
      "@types/react": { optional: true },
    }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }
