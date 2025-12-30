/**
 * Electron Forge Configuration (Optional alternative to electron-builder)
 * 
 * This file is provided as an alternative configuration if you want to use
 * Electron Forge instead of electron-builder.
 * 
 * To use Electron Forge:
 * 1. npm install --save-dev @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip @electron-forge/maker-deb @electron-forge/maker-rpm
 * 2. npx electron-forge import
 * 3. npm run make
 */

module.exports = {
  packagerConfig: {
    name: 'Project Management',
    executableName: 'project-management',
    icon: './resources/icon',
    appBundleId: 'com.projectmanagement.desktop',
    appCategoryType: 'public.app-category.productivity',
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'project_management',
        setupIcon: './resources/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './resources/icon.png',
          categories: ['Office', 'Productivity'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './resources/icon.png',
        },
      },
    },
  ],
  plugins: [],
};

