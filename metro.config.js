const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
// Parent repo sits two levels up from .worktrees/profile/
const parentRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Constrain Metro to only watch this worktree — prevents the parent repo's
// app/(tabs)/ from being discovered alongside the worktree's app/(tabs)/
config.watchFolders = [projectRoot];

// Block the parent repo's app/ from Metro's resolver so it doesn't
// double-discover routes alongside the worktree's app/
const escapedParent = parentRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = new RegExp(`^${escapedParent}/app/.*$`);

module.exports = withNativeWind(config, { input: './global.css' });
