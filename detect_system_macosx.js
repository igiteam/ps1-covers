// System detection function
function detectSystemInfo() {
  const systemInfo = {
    // Basic info
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,

    // macOS specific
    isMacOS: process.platform === "darwin",
    isAppleSilicon: process.arch === "arm64",
    isIntel: process.arch === "x64",

    // Performance
    cpuCount: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory || "unknown",

    // GPU info
    gpuVendor: "",
    gpuRenderer: "",

    // Screen info
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    screenColorDepth: window.screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio,

    // Browser/Engine
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,

    // Feature detection
    supportsWebGL: false,
    supportsWebGL2: false,
    supportsWASM: !!window.WebAssembly,
    supportsWebAudio: !!window.AudioContext || !!window.webkitAudioContext,

    // Storage
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,

    // Network
    online: navigator.onLine,
    connection:
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection,
  };

  // Detect GPU info
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      systemInfo.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      systemInfo.gpuRenderer = gl.getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
    }
    systemInfo.supportsWebGL = true;
    systemInfo.supportsWebGL2 = !!canvas.getContext("webgl2");
  }

  // Detect Apple Silicon Rosetta
  if (systemInfo.isMacOS && systemInfo.isAppleSilicon) {
    // Check if running under Rosetta
    systemInfo.isRosetta = false;
    try {
      // This is a hacky way to detect Rosetta
      if (navigator.userAgent.includes("Intel")) {
        systemInfo.isRosetta = true;
      }
    } catch (e) {}
  }

  // Detect dark mode
  systemInfo.isDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Detect retina display
  systemInfo.isRetina = window.devicePixelRatio > 1;

  // Detect touch screen
  systemInfo.isTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Detect battery (if available)
  if (navigator.getBattery) {
    navigator.getBattery().then((battery) => {
      systemInfo.battery = {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    });
  }

  return systemInfo;
}

// Usage in your auto-load script
window.addEventListener("load", () => {
  const systemInfo = detectSystemInfo();
  console.log("🔍 System Information:", systemInfo);

  // Send to main process if needed
  if (typeof ipcRenderer !== "undefined") {
    ipcRenderer.send("system-info", systemInfo);
  }

  // Show warning if WebGL is not supported
  if (!systemInfo.supportsWebGL) {
    console.warn("⚠️ WebGL not supported - emulator may not work correctly");
    alert(
      "WebGL is required for the PlayStation emulator. Please enable WebGL in your browser settings."
    );
  }

  // Show warning for Intel Macs (performance)
  if (systemInfo.isMacOS && systemInfo.isIntel) {
    console.log("💻 Intel Mac detected - performance may vary");
  }

  // Log Apple Silicon status
  if (systemInfo.isMacOS && systemInfo.isAppleSilicon) {
    console.log("🍎 Apple Silicon Mac detected - optimal performance expected");
    if (systemInfo.isRosetta) {
      console.warn(
        "⚠️ Running under Rosetta 2 - native performance not available"
      );
    }
  }
});

// Performance monitoring
function monitorPerformance() {
  const perf = {
    // Memory usage
    memory: process.memoryUsage ? process.memoryUsage() : null,

    // CPU usage (requires main process)
    cpuUsage: null,

    // FPS counter for emulator
    fps: 0,
    frameTimes: [],

    // Load times
    loadTime: performance.now(),
    domReadyTime:
      performance.timing.domContentLoadedEventEnd -
      performance.timing.navigationStart,
  };

  return perf;
}

// FPS counter for the emulator
function startFPSCounter() {
  let frameCount = 0;
  let lastTime = performance.now();

  function countFrames() {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      console.log(`🎮 FPS: ${fps}`);

      // Update UI if needed
      const fpsElement = document.getElementById("fps-counter");
      if (fpsElement) {
        fpsElement.textContent = `FPS: ${fps}`;
      }

      // Reset counter
      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(countFrames);
  }

  requestAnimationFrame(countFrames);
}

// In the auto-load script, after window.addEventListener('load', ...)
window.addEventListener("load", () => {
  // Existing code...

  // Add system detection
  const systemInfo = detectSystemInfo();
  console.log("System Info:", systemInfo);

  // Start FPS counter when game loads
  setTimeout(() => {
    startFPSCounter();
  }, 5000); // Start 5 seconds after load

  // Send system info to main process
  if (typeof ipcRenderer !== "undefined") {
    ipcRenderer.send("system-detected", systemInfo);

    // Request more detailed system info from main process
    const detailedInfo = ipcRenderer.sendSync("get-detailed-system-info");
    if (detailedInfo) {
      console.log("Detailed System Info:", detailedInfo);
    }
  }
});

// In src/main.js, add to IPC handlers
const os = require("os");
const { exec } = require("child_process");

// System info handler
ipcMain.on("get-detailed-system-info", (event) => {
  const systemInfo = {
    // OS info
    platform: os.platform(),
    release: os.release(),
    type: os.type(),
    version: os.version(),

    // CPU info
    cpus: os.cpus(),
    cpuModel: os.cpus()[0].model,
    cpuSpeed: os.cpus()[0].speed,
    cpuCores: os.cpus().length,

    // Memory info
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    memoryUsage: process.memoryUsage(),

    // Network info
    networkInterfaces: os.networkInterfaces(),
    hostname: os.hostname(),

    // User info
    userInfo: os.userInfo(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),

    // Uptime
    uptime: os.uptime(),

    // Mac specific (only on macOS)
    macModel: "",
    macSerial: "",
    macUUID: "",
  };

  // Try to get Mac-specific info
  if (os.platform() === "darwin") {
    // Get Mac model
    exec("sysctl -n hw.model", (error, stdout) => {
      if (!error) systemInfo.macModel = stdout.trim();
    });

    // Get serial number
    exec(
      'system_profiler SPHardwareDataType | grep "Serial Number"',
      (error, stdout) => {
        if (!error)
          systemInfo.macSerial = stdout
            .replace("Serial Number (system):", "")
            .trim();
      }
    );

    // Get hardware UUID
    exec(
      'system_profiler SPHardwareDataType | grep "Hardware UUID"',
      (error, stdout) => {
        if (!error)
          systemInfo.macUUID = stdout.replace("Hardware UUID:", "").trim();
      }
    );
  }

  event.returnValue = systemInfo;
});

// Handle system info from renderer
ipcMain.on("system-info", (event, systemInfo) => {
  console.log("📊 System info from renderer:", systemInfo);

  // Log warnings based on system
  if (systemInfo.isMacOS) {
    if (systemInfo.isAppleSilicon) {
      console.log("🍎 Apple Silicon Mac detected - optimal performance");
    } else {
      console.log("💻 Intel Mac detected - performance may vary");
    }
  }

  if (!systemInfo.supportsWebGL) {
    console.warn("⚠️ WebGL not supported - emulator may fail");
  }
});

// Simple detection for our needs
function checkSystemRequirementsMinimal() {
  const requirements = {
    meetsAll: true,
    issues: [],
    warnings: [],
  };

  // Check platform
  if (process.platform !== "darwin") {
    requirements.meetsAll = false;
    requirements.issues.push("This app is designed for macOS only");
  }

  // Check WebGL
  const canvas = document.createElement("canvas");
  if (!canvas.getContext("webgl") && !canvas.getContext("experimental-webgl")) {
    requirements.meetsAll = false;
    requirements.issues.push("WebGL is required but not supported");
  }

  // Check WebAssembly
  if (!window.WebAssembly) {
    requirements.meetsAll = false;
    requirements.issues.push("WebAssembly is required but not supported");
  }

  // Check memory (rough estimate)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    requirements.warnings.push(
      "Low memory detected (< 4GB) - performance may be affected"
    );
  }

  // Check CPU cores
  if (navigator.hardwareConcurrency < 4) {
    requirements.warnings.push(
      "Limited CPU cores detected - performance may be affected"
    );
  }

  return requirements;
}

// Use it
const requirements = checkSystemRequirementsMinimal();
if (!requirements.meetsAll) {
  console.error("❌ System requirements not met:", requirements.issues);
  alert(`System requirements not met:\n${requirements.issues.join("\n")}`);
} else if (requirements.warnings.length > 0) {
  console.warn("⚠️ Performance warnings:", requirements.warnings);
}
