# Deck: Remote PC Controller

Deck is a secure, low-latency mobile application and companion PC server that allows you to remotely control your computer. It features a virtual joystick for mouse control and highly customizable shortcut folders.

## Architecture

The system consists of two parts:
1. **PC Server (Host):** An Electron + React application running in the system tray. It hosts a local WebSocket server to receive commands and uses `@nut-tree-fork/nut-js` to simulate keyboard and mouse events.
2. **Mobile Client (Controller):** A React Native application that connects to the PC over local Wi-Fi.

### Security & Pairing
To ensure absolute security on the local network, the pairing process does **not** expose the PC's IP address.
1. The user logs into the same Google Account via Firebase on both the PC and the Phone.
2. The PC securely uploads its IP, Port, and a temporary `session_secret` to Firebase Firestore under the user's private document.
3. The PC displays a QR code containing only a random `sessionId` and the user's `uid`.
4. The Phone scans the QR code, verifies the `uid`, downloads the connection info from Firestore, and connects to the PC using the `session_secret`.

---

## Development Journey & Troubleshooting

During the development of **Phase 1 (The PC Server)**, we encountered and resolved several technical challenges:

### 1. Electron & Vite ESM Compatibility
*   **Error:** `SyntaxError: The requested module 'electron' does not provide an export named 'BrowserWindow'`
*   **Cause:** Vite's React TS template sets `"type": "module"` in `package.json`, forcing all `.js` files to be treated as ES Modules. However, the Electron binary uses CommonJS internally for its built-in modules, causing import failures.
*   **Solution:** We removed `"type": "module"` from `package.json` to allow the Electron main process (`main.ts`) to be properly compiled and executed as a CommonJS module by `vite-plugin-electron`.

### 2. Electron Binary Path Resolution
*   **Error:** The server crashed with `TypeError: Cannot read properties of undefined (reading 'requestSingleInstanceLock')` and outputted `Node.js v24.x`.
*   **Cause:** A global environment variable `ELECTRON_RUN_AS_NODE=1` was set on the system. This variable forces the Electron executable to run as a standard Node.js process instead of the Electron runtime, which strips out all Electron-specific APIs (like `app`, `BrowserWindow`).
*   **Solution:** We created a `dev.js` script that explicitly deletes `process.env.ELECTRON_RUN_AS_NODE` before spawning the Vite dev server, ensuring Electron boots correctly.

### 3. TypeScript Type Imports in Vite
*   **Error:** `Uncaught SyntaxError: The requested module '...firebase_auth.js' does not provide an export named 'User'`
*   **Cause:** We imported the `User` interface from `firebase/auth` alongside standard functions. Vite's fast refresh bundler (esbuild) attempted to import it as a runtime JavaScript object, which doesn't exist.
*   **Solution:** We separated the type import using the `type` keyword: `import type { User } from 'firebase/auth'`, allowing the bundler to safely strip it out during compilation.

---

## Future Features Planned
*   **Linux/Custom Shortcut Parsing:** A feature to upload configuration files (e.g., Linux keybindings) directly into the app. The app will parse these files, extract the shortcuts, and sync them to the mobile device.
*   **Shortcut File System:** An intuitive folder-based organization system on the mobile app to sort and manage different shortcut profiles (e.g., "System", "Media", "Gaming").
