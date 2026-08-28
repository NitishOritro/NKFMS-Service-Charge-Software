'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  currentUser: () => ipcRenderer.invoke('auth:current'),
  changePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke('auth:change-password', { currentPassword, newPassword }),
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  paths: () => ipcRenderer.invoke('data:paths'),
  reveal: () => ipcRenderer.invoke('data:reveal'),
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  savePdf: (payload) => ipcRenderer.invoke('report:savePdf', payload),
  printReport: (payload) => ipcRenderer.invoke('report:print', payload),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath)
});
