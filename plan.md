# Implementation Plan: Remote PC Deck Controller

## Goal Description
Build a "Deck" mobile application and a companion PC server that allows the user to remotely control their computer. The app will feature a joystick/slider for mouse control and customizable shortcut buttons organized into folders (e.g., "YouTube", "System"). The devices will pair seamlessly using a one-time QR code scan, remember each other for future sessions, and communicate via a secure, low-latency command channel over the local Wi-Fi. It will incorporate Firebase Authentication (Google Login) to secure the system and sync user configurations. The PC server will run efficiently in the background as a system tray application that launches on startup.

## Architecture & Tech Stack (Approved)

1.  **PC Server (Host): Electron + Node.js**
    *   **Auth:** Firebase Authentication (Google Login) to ensure only the owner can control the PC.
    *   **Background Service:** Runs as a system tray application.
    *   **Startup:** Configured to launch automatically when Windows starts.
    *   **UI:** A modern, lightweight window that can be toggled from the tray to display the pairing QR code and connection status.
    *   **Control:** Uses `nut.js` (or similar) to efficiently simulate keyboard and mouse events.
    *   **Network:** Hosts a local WebSocket server (`ws`) for zero-latency communication over the local Wi-Fi.

2.  **Mobile Client (Controller): React Native (Expo)**
    *   **UI:** Modern, sleek interface with a virtual joystick/trackpad and customizable shortcut grids.
    *   **Pairing:** Scans the PC's QR code to get the local IP, port, and security token.
    *   **Auth:** Firebase Authentication (Google Login) to authenticate the user and sync their custom shortcut folders across devices.

3.  **Communication Protocol:**
    *   **WebSockets (Local Network):** Commands (e.g., `{"type": "KEY", "keys": ["shift", "n"]}`) are sent directly over the local network. 
    *   **Acknowledgments:** The PC sends ACKs back to the phone for visual feedback (e.g., a subtle haptic bump or checkmark on the button).

## Proposed Changes (Phases of Implementation)

### Phase 1: PC Server (Electron Tray App)
*   [ ] Initialize an Electron + React/Vite project for the PC host.
*   [ ] Integrate Firebase Authentication (Google Sign-In).
*   [ ] Implement system tray behavior (hide to tray, run on startup).
*   [ ] Integrate `nut.js` for mouse/keyboard control.
*   [ ] Set up a local WebSocket server that generates a QR code containing connection info.

### Phase 2: Mobile App Foundation (React Native)
*   [ ] Initialize React Native (Expo) app.
*   [ ] Integrate Firebase Authentication (Google Sign-In).
*   [ ] Build the core UI components: Virtual Joystick, Shortcut Grid, and Folder navigation.
*   [ ] Implement Firebase Firestore to save and load user-defined shortcuts.

### Phase 3: Pairing & Local Network Connection
*   [ ] Implement QR Code scanning in the mobile app.
*   [ ] Establish WebSocket connection using the IP/Port from the QR code.
*   [ ] Implement Identity Verification: The PC server verifies the Firebase Auth token from the mobile app. The connection is ONLY allowed if the logged-in user on the phone exactly matches the logged-in user on the PC.
*   [ ] Save the paired PC details locally on the phone so it auto-connects next time it's on the same Wi-Fi.

### Phase 4: Integration & Polish
*   [ ] Map mobile UI actions (joystick drag, button press) to WebSocket messages.
*   [ ] Handle command execution on the PC and send ACKs.
*   [ ] Add modern UI polish (animations, haptics on the mobile side, clean dark mode UI).

## Verification Plan

### Automated Tests
*   Unit tests for WebSocket message parsing and formatting.

### Manual Verification
*   **Startup & Tray:** Verify PC app runs on Windows startup, hides to the system tray, and reopens when the tray icon is clicked.
*   **Pairing Flow:** Generate QR on PC, scan with phone, verify successful WebSocket connection over Wi-Fi.
*   **Control Test:** Use phone joystick; verify PC mouse moves smoothly with minimal latency. Press a shortcut button; verify PC executes the keystroke.
*   **Security & Auth:** Verify Google Login works on both devices. Verify that scanning a QR code from a PC logged into a *different* Google Account rejects the connection.
*   **Persistence:** Restart both apps; verify they reconnect automatically without rescanning. Verify custom shortcuts are restored from Firebase.
