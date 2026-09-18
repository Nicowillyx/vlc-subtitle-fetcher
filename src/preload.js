const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  fetchSubtitle: () =>
    ipcRenderer.invoke('fetch-subtitle'),

  saveSettings: (settings) =>
    ipcRenderer.invoke('save-settings', settings),

  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  onStatus: (callback) =>
    ipcRenderer.on('status', (_, data) => callback(data)),

  onOpenSettings: (callback) =>
    ipcRenderer.on('open-settings', () => callback())

});