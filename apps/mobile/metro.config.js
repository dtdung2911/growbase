const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// pnpm monorepo: resolve symlinked workspace packages (@growbase/shared)
// and honor their package.json "exports" subpaths.
config.resolver.unstable_enableSymlinks = true
config.resolver.unstable_enablePackageExports = true

module.exports = config
