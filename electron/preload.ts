import { contextBridge, ipcRenderer } from "electron"

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Call methods
  makeCall: (phoneNumber: string) => ipcRenderer.invoke("make-call", phoneNumber),
  endCall: () => ipcRenderer.invoke("end-call"),

  // SMS methods
  sendSMS: (to: string, message: string) => ipcRenderer.invoke("send-sms", { to, message }),

  // WebRTC methods
  webrtcReady: () => ipcRenderer.invoke("webrtc-ready"),

  // Event listeners
  onIncomingCall: (callback: (data: any) => void) => {
    ipcRenderer.on("incoming-call", (_, data) => callback(data))
    return () => {
      ipcRenderer.removeAllListeners("incoming-call")
    }
  },

  onIncomingSMS: (callback: (data: any) => void) => {
    ipcRenderer.on("incoming-sms", (_, data) => callback(data))
    return () => {
      ipcRenderer.removeAllListeners("incoming-sms")
    }
  },
})
