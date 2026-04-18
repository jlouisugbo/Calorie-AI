const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
// Parent repo sits two levels up from .worktrees/profile/
const parentRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Constrain Metro to only watch this worktree — prevents the parent repo's
// app/(tabs)/ from being discovered alongside the worktree's app/(tabs)/
config.watchFolders = [projectRoot];

// Block Metro from resolving source files inside the parent repo's app dir
const { BlockList } = require("metro-config");
config.resolver.blockList = BlockList([
  new RegExp(`^${parentRoot.replace(/\//g, "\\/")}\/app\/.*$`),
]);

module.exports = withNativeWind(config, { input: "./global.css" });
