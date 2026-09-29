import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onPairingInfo: (callback: (info: any) => void) => ipcRenderer.on('pairing-info', (_event, value) => callback(value)),
  setUid: (uid: string) => ipcRenderer.send('set-uid', uid),
})
