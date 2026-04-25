import { app, Menu, type MenuItemConstructorOptions } from 'electron'

export interface ApplicationMenuOptions {
  isDev: boolean
  platform?: NodeJS.Platform
}

export function buildApplicationMenuTemplate({
  isDev,
  platform = process.platform,
}: ApplicationMenuOptions): MenuItemConstructorOptions[] {
  const template: MenuItemConstructorOptions[] = [
    {
      label: platform === 'darwin' ? app.name : 'App',
      submenu: [{ role: 'about' }],
    },
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
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
