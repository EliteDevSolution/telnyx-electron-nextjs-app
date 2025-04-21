import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  // In production, load the built Next.js app
  // In development, connect to the Next.js dev server
  const isDev = process.env.NODE_ENV === "development"
  const url = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../out/index.html")}`

  mainWindow.loadURL(url)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Handle IPC messages for system-level operations
ipcMain.handle("get-app-version", () => {
  return app.getVersion()
})

// Handle audio permissions
ipcMain.handle("request-microphone-permissions", async () => {
  try {
    // On macOS, this will trigger the permission dialog
    if (process.platform === "darwin") {
      const { systemPreferences } = require("electron")
      const status = await systemPreferences.getMediaAccessStatus("microphone")

      if (status !== "granted") {
        await systemPreferences.askForMediaAccess("microphone")
      }

      return { success: true }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to request microphone permissions:", error)
    return { success: false, error: error.message }
  }
})

// Handle notifications
ipcMain.handle("show-notification", (event, { title, body }) => {
  try {
    new Notification({ title, body }).show()
    return { success: true }
  } catch (error) {
    console.error("Failed to show notification:", error)
    return { success: false, error: error.message }
  }
})
