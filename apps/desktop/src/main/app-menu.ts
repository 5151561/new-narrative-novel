import { app, Menu, type MenuItemConstructorOptions } from 'electron'

import type { RecentProjectRecord } from './recent-projects.js'

export interface ApplicationMenuOptions {
  isDev: boolean
  onCreateProject?: () => Promise<void> | void
  onOpenProject?: () => Promise<void> | void
  onOpenRecentProject?: (projectRoot: string) => Promise<void> | void
  onCreateProjectBackup?: () => Promise<void> | void
  onExportProjectArchive?: () => Promise<void> | void
  onRestartLocalApi?: () => Promise<void> | void
  onRestartWorker?: () => Promise<void> | void
  platform?: NodeJS.Platform
  recentProjects?: RecentProjectRecord[]
}

export function buildApplicationMenuTemplate({
  isDev,
  onCreateProject,
  onOpenProject,
  onOpenRecentProject,
  onCreateProjectBackup,
  onExportProjectArchive,
  onRestartLocalApi,
  onRestartWorker,
  platform = process.platform,
  recentProjects = [],
}: ApplicationMenuOptions): MenuItemConstructorOptions[] {
  const recentProjectsSubmenu: MenuItemConstructorOptions[] = recentProjects.length > 0
    ? recentProjects.map((project) => ({
      click: () => {
        void onOpenRecentProject?.(project.projectRoot)
      },
      label: `${project.projectTitle} (${project.projectRoot})`,
    }))
    : [{
      enabled: false,
      label: 'No Recent Projects',
    }]
  const template: MenuItemConstructorOptions[] = [
    {
      label: platform === 'darwin' ? app.name : 'App',
      submenu: [{ role: 'about' }],
    },
    {
      label: 'File',
      submenu: [
        {
          click: () => {
            void onCreateProject?.()
          },
          label: 'Create Project...',
        },
        {
          click: () => {
            void onOpenProject?.()
          },
          label: 'Open Project...',
        },
        {
          label: 'Recent Projects',
          submenu: recentProjectsSubmenu,
        },
        { type: 'separator' },
        {
          click: () => {
            void onCreateProjectBackup?.()
          },
          label: 'Create Backup',
        },
        {
          click: () => {
            void onExportProjectArchive?.()
          },
          label: 'Export Project Archive',
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Runtime',
      submenu: [
        {
          click: () => {
            void onRestartLocalApi?.()
          },
          label: 'Restart Local API',
        },
        {
          click: () => {
            void onRestartWorker?.()
          },
          label: 'Restart Worker',
        },
      ],
    },
  ]

  if (isDev) {
    template.push({
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }],
    })
  }

  return template
}

export function setApplicationMenu(options: ApplicationMenuOptions): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildApplicationMenuTemplate(options)))
}
