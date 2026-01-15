/**
 * Focus Desktop - macOS Notarization Script
 * 
 * This script handles Apple notarization for production builds.
 * Notarization is required for distribution outside the Mac App Store
 * on macOS 10.15 (Catalina) and later.
 * 
 * Prerequisites:
 * 1. Apple Developer account
 * 2. Valid code signing certificate
 * 3. App-specific password generated at appleid.apple.com
 * 
 * Environment Variables:
 * - APPLE_ID: Apple Developer ID email address
 * - APPLE_ID_PASSWORD: App-specific password (NOT your Apple ID password)
 * - APPLE_TEAM_ID: Apple Developer Team ID (found in developer portal)
 * 
 * @author Focus Project
 * @version 1.0.0
 */

const { notarize } = require('@electron/notarize');
const path = require('path');

/**
 * Notarization hook called after code signing.
 * @param {Object} context - electron-builder context
 * @param {string} context.electronPlatformName - Target platform
 * @param {string} context.appOutDir - Output directory path
 * @param {Object} context.packager - Packager instance
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    console.log('[Notarize] Skipping: Not a macOS build');
    return;
  }

  // Check for required environment variables
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.log('[Notarize] Skipping: Apple credentials not configured');
    console.log('[Notarize] Set the following environment variables for notarization:');
    console.log('  - APPLE_ID');
    console.log('  - APPLE_ID_PASSWORD');
    console.log('  - APPLE_TEAM_ID');
    return;
  }

  // Get app name and path
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log('[Notarize] Starting notarization...');
  console.log(`[Notarize] App: ${appPath}`);
  console.log(`[Notarize] Apple ID: ${appleId}`);
  console.log(`[Notarize] Team ID: ${teamId}`);

  const startTime = Date.now();

  try {
    await notarize({
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Notarize] Complete (${duration}s)`);
  } catch (error) {
    console.error('[Notarize] Failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Could not find')) {
      console.error('[Notarize] The application bundle was not found. Ensure the build completed successfully.');
    } else if (error.message.includes('credentials')) {
      console.error('[Notarize] Invalid Apple credentials. Verify your APPLE_ID and APPLE_ID_PASSWORD.');
    } else if (error.message.includes('team')) {
      console.error('[Notarize] Invalid team ID. Verify your APPLE_TEAM_ID in the Apple Developer portal.');
    }
    
    throw error;
  }
};
