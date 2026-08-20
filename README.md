# Scrcpy Hub

Scrcpy Hub is a modern, elegant macOS desktop UI wrapper for **scrcpy** and **ADB** (Android Debug Bridge). It provides a professional interface to mirror and control your Android devices with ease, supporting both USB and Wireless connections.

![Banner](https://ai.google.dev/static/site-assets/images/share-ais-513315318.png)

## ✨ Features

- **Device Management**: Automatically scan and detect connected Android devices (USB & Wi-Fi).
- **Wireless ADB Pairing**: Simple workflow to pair and connect devices over the network without cables.
- **Advanced Mirroring Controls**: 
  - Adjust Resolution (Max Size) and FPS.
  - Set Video Bitrate and Codec (H.264, H.265, AV1).
  - Audio Source selection (Internal, Mic, or Disabled).
  - Toggle options like "Stay Awake", "Turn Screen Off", "Always on Top", and "Show Touches".
- **Hardware Action Triggers**: Send hardware events like Home, Back, App Switcher, Power, and Volume controls directly from the UI.
- **Real-time Logs**: Integrated console to monitor `scrcpy` and `adb` output.
- **Keyboard Shortcuts**: Built-in cheat sheet for essential `scrcpy` keyboard controls.
- **Onboarding Experience**: Guided setup for first-time users to enable USB debugging and authorize their Mac.
- **Elegant Dark Theme**: A high-contrast, professional design optimized for macOS.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **ADB** installed and available in your PATH.
- **scrcpy** installed and available in your PATH.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/scrcpy-hub.git
   cd scrcpy-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   # Run the Electron app in development
   npm run electron:dev
   ```

### Building the App

To generate a production-ready macOS application:

```bash
npm run electron:build
```
The output will be located in the `release` directory.

## 📖 Usage Guide

1. **Enable USB Debugging**: On your Android device, go to *Settings > Developer Options* and enable *USB Debugging*. (If hidden, tap *Build Number* 7 times in *About Phone*).
2. **Connect Device**: Plug your device into your Mac via USB.
3. **Authorize**: Tap "Allow" on the "Allow USB debugging?" prompt on your phone.
4. **Start Mirroring**: Select your device from the dropdown in the header and click **Start Screen Mirroring**.
5. **Wireless Mode**: 
   - Connect via USB first.
   - Click the **Wireless** button in the header.
   - Enter your device's IP address and click **Connect**.
   - Once connected, you can unplug the USB cable.

## ⌨️ Common Keyboard Shortcuts (MOD = Alt/Super)

- `MOD + F`: Toggle Fullscreen
- `MOD + H`: Home Button
- `MOD + B`: Back Button
- `MOD + S`: App Switcher (Recents)
- `MOD + P`: Power Button
- `MOD + O`: Turn device screen OFF (mirroring stays ON)
- `Right-Click`: Back
- `Middle-Click`: Home

## 🛠️ Built With

- **Electron**: Cross-platform desktop framework.
- **React**: UI library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Beautifully simple icons.
- **Vite**: Next-generation frontend tooling.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
