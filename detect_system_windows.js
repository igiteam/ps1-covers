// Windows System Detection Function
function detectWindowsSystemInfo() {
  const systemInfo = {
    // Basic info
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,

    // Windows specific
    isWindows: process.platform === "win32",
    isWindows64: process.arch === "x64" || process.arch === "ia32",
    isWindowsARM: process.arch === "arm64",
    isWindows32bit: process.arch === "ia32",

    // Windows version detection
    windowsVersion: "",
    windowsBuild: "",
    isWindows10: false,
    isWindows11: false,
    isWindowsServer: false,

    // Performance
    cpuCount: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory || "unknown",

    // GPU info
    gpuVendor: "",
    gpuRenderer: "",
    gpuDriverVersion: "",

    // DirectX detection
    supportsDirectX: false,
    directXVersion: "",

    // Screen info
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    screenColorDepth: window.screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio,
    isHighDPI: window.devicePixelRatio > 1,

    // Browser/Engine
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    isEdge: navigator.userAgent.includes("Edg/"),
    isChrome: navigator.userAgent.includes("Chrome/"),

    // Feature detection
    supportsWebGL: false,
    supportsWebGL2: false,
    supportsWASM: !!window.WebAssembly,
    supportsWebAudio: !!window.AudioContext || !!window.webkitAudioContext,
    supportsAV1: false,
    supportsHEVC: false,

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

    // Input
    hasGamepad: "getGamepads" in navigator,
    hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    hasPen: "pointerEnabled" in navigator || "maxTouchPoints" in navigator,

    // Audio
    audioContextSampleRate: 0,
    maxAudioChannels: 0,
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

      // Try to extract driver version from renderer string
      const match = systemInfo.gpuRenderer.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        systemInfo.gpuDriverVersion = match[1];
      }
    }
    systemInfo.supportsWebGL = true;
    systemInfo.supportsWebGL2 = !!canvas.getContext("webgl2");
  }

  // Detect Windows version from user agent
  const ua = navigator.userAgent;
  const winVersionMatch = ua.match(/Windows NT (\d+\.\d+)/);
  if (winVersionMatch) {
    systemInfo.windowsVersion = winVersionMatch[1];
    systemInfo.isWindows10 = systemInfo.windowsVersion === "10.0";
    systemInfo.isWindows11 =
      parseFloat(systemInfo.windowsVersion) >= 10.0 &&
      ua.includes("Windows NT 10.0") &&
      ua.includes("Win64; x64");
  }

  // Detect Windows build number
  const buildMatch = ua.match(
    /Windows NT \d+\.\d+; Win64; x64; rv:\d+\.\d+\) Gecko\/\d+ Firefox\/\d+/
  );
  if (!buildMatch) {
    // Try alternative pattern
    const altMatch = ua.match(/Windows NT \d+\.\d+; (WOW64|Win64; x64)/);
    if (altMatch) {
      systemInfo.windowsBuild = "Unknown build";
    }
  }

  // Detect if it's Windows Server
  systemInfo.isWindowsServer =
    ua.includes("Windows Server") || ua.includes("Server");

  // Detect DirectX support (WebGL is our proxy for DirectX)
  systemInfo.supportsDirectX = systemInfo.supportsWebGL;
  if (systemInfo.supportsWebGL2) {
    systemInfo.directXVersion = "11+ (via WebGL2)";
  } else if (systemInfo.supportsWebGL) {
    systemInfo.directXVersion = "9+ (via WebGL)";
  }

  // Detect dark mode
  systemInfo.isDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Detect touch screen
  systemInfo.isTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Detect battery (if available - less common on Windows desktops)
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

  // Detect audio capabilities
  if (window.AudioContext || window.webkitAudioContext) {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    systemInfo.audioContextSampleRate = audioContext.sampleRate;
    systemInfo.maxAudioChannels = audioContext.destination.maxChannelCount || 2;
    audioContext.close();
  }

  // Detect video codec support
  const video = document.createElement("video");
  systemInfo.supportsAV1 =
    video.canPlayType('video/webm; codecs="av01.0.05M.08"') !== "";
  systemInfo.supportsHEVC =
    video.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') !== "";

  return systemInfo;
}

// Windows-specific performance monitoring
function monitorWindowsPerformance() {
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

    // Windows-specific metrics
    gpuMemory: null,
    vramUsage: null,

    // Input latency
    inputLatency: [],
  };

  return perf;
}

// Windows-optimized FPS counter
function startWindowsFPSCounter() {
  let frameCount = 0;
  let lastTime = performance.now();
  const frameTimes = [];
  const maxSamples = 60;

  function countFrames() {
    frameCount++;
    const currentTime = performance.now();
    frameTimes.push(currentTime - lastTime);

    if (frameTimes.length > maxSamples) {
      frameTimes.shift();
    }

    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

      // Calculate frame time statistics
      const avgFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const minFrameTime = Math.min(...frameTimes);

      console.log(
        `🎮 FPS: ${fps} | Frame Time: ${avgFrameTime.toFixed(
          2
        )}ms (min: ${minFrameTime.toFixed(2)}ms, max: ${maxFrameTime.toFixed(
          2
        )}ms)`
      );

      // Update UI if needed
      const fpsElement = document.getElementById("fps-counter");
      if (fpsElement) {
        fpsElement.textContent = `FPS: ${fps} (${avgFrameTime.toFixed(1)}ms)`;
      }

      // Reset counter
      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(countFrames);
  }

  requestAnimationFrame(countFrames);
}

// Windows system requirements check
function checkWindowsSystemRequirements() {
  const requirements = {
    meetsAll: true,
    issues: [],
    warnings: [],
    recommendations: [],
  };

  // Check platform
  if (process.platform !== "win32") {
    requirements.meetsAll = false;
    requirements.issues.push("This app is designed for Windows only");
  }

  // Check WebGL
  const canvas = document.createElement("canvas");
  if (!canvas.getContext("webgl") && !canvas.getContext("experimental-webgl")) {
    requirements.meetsAll = false;
    requirements.issues.push(
      "WebGL is required but not supported. Update your graphics drivers."
    );
    requirements.recommendations.push(
      "Update graphics drivers from NVIDIA/AMD/Intel website"
    );
  }

  // Check WebAssembly
  if (!window.WebAssembly) {
    requirements.meetsAll = false;
    requirements.issues.push("WebAssembly is required but not supported");
    requirements.recommendations.push(
      "Update to latest version of Windows 10/11"
    );
  }

  // Check Windows version
  const ua = navigator.userAgent;
  const winVersionMatch = ua.match(/Windows NT (\d+\.\d+)/);
  if (winVersionMatch) {
    const version = parseFloat(winVersionMatch[1]);
    if (version < 6.2) {
      // Windows 8 or earlier
      requirements.meetsAll = false;
      requirements.issues.push(
        `Windows ${version} is not supported. Requires Windows 8.1 or later.`
      );
      requirements.recommendations.push("Upgrade to Windows 10 or Windows 11");
    } else if (version < 10.0) {
      requirements.warnings.push(
        `Windows ${version} detected. For best performance, upgrade to Windows 10 or later.`
      );
    }
  }

  // Check memory
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory < 4) {
      requirements.meetsAll = false;
      requirements.issues.push("Minimum 4GB RAM required");
    } else if (navigator.deviceMemory < 8) {
      requirements.warnings.push(
        "8GB or more RAM recommended for optimal performance"
      );
    }
  }

  // Check CPU cores
  if (navigator.hardwareConcurrency < 2) {
    requirements.meetsAll = false;
    requirements.issues.push("Dual-core CPU minimum required");
  } else if (navigator.hardwareConcurrency < 4) {
    requirements.warnings.push(
      "Quad-core CPU recommended for optimal performance"
    );
  }

  // Check GPU capabilities
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      // Check for integrated graphics
      if (gpuVendor.includes("Intel") && gpuRenderer.includes("HD Graphics")) {
        requirements.warnings.push(
          "Intel integrated graphics detected. Dedicated GPU recommended."
        );
      }
    }
  }

  // Check for DirectX support via WebGL2
  if (!canvas.getContext("webgl2")) {
    requirements.warnings.push(
      "WebGL2/DirectX 11+ not available. Update graphics drivers for best performance."
    );
    requirements.recommendations.push(
      "Install latest graphics drivers from manufacturer website"
    );
  }

  // Check screen resolution
  if (window.screen.width < 1024 || window.screen.height < 768) {
    requirements.warnings.push("Minimum 1024x768 resolution recommended");
  }

  return requirements;
}

// Windows-specific usage
window.addEventListener("load", () => {
  const systemInfo = detectWindowsSystemInfo();
  console.log("🔍 Windows System Information:", systemInfo);

  // Send to main process if needed
  if (typeof ipcRenderer !== "undefined") {
    ipcRenderer.send("windows-system-info", systemInfo);
  }

  // Check system requirements
  const requirements = checkWindowsSystemRequirements();

  if (!requirements.meetsAll) {
    console.error(
      "❌ Windows system requirements not met:",
      requirements.issues
    );

    let message = "Windows System Requirements Not Met:\n\n";
    message += requirements.issues.join("\n");

    if (requirements.recommendations.length > 0) {
      message += "\n\nRecommendations:\n";
      message += requirements.recommendations.join("\n");
    }

    alert(message);
  } else if (requirements.warnings.length > 0) {
    console.warn("⚠️ Windows performance warnings:", requirements.warnings);

    if (requirements.warnings.length > 0) {
      let warningMessage = "Performance Warnings:\n\n";
      warningMessage += requirements.warnings.join("\n");

      if (confirm(warningMessage + "\n\nContinue anyway?")) {
        console.log("User chose to continue despite warnings");
      } else {
        console.log("User cancelled due to warnings");
        // Optionally close the app or show help
      }
    }
  }

  // Log Windows-specific info
  if (systemInfo.isWindows) {
    console.log("🪟 Windows detected");

    if (systemInfo.isWindows11) {
      console.log("🪟 Windows 11 detected - optimal support");
    } else if (systemInfo.isWindows10) {
      console.log("🪟 Windows 10 detected - good support");
    } else {
      console.log(
        `🪟 Windows ${systemInfo.windowsVersion} detected - may have limited support`
      );
    }

    if (systemInfo.isWindowsARM) {
      console.log("💻 Windows on ARM detected - running in compatibility mode");
    }

    if (systemInfo.isWindowsServer) {
      console.warn(
        "⚠️ Windows Server detected - not optimized for server environments"
      );
    }
  }

  // Start Windows-optimized FPS counter when game loads
  setTimeout(() => {
    startWindowsFPSCounter();
  }, 3000); // Start 3 seconds after load

  // Send detailed system info to main process
  if (typeof ipcRenderer !== "undefined") {
    const detailedInfo = ipcRenderer.sendSync("get-windows-detailed-info");
    if (detailedInfo) {
      console.log("Detailed Windows Info:", detailedInfo);
    }
  }
});

// Main process handlers for Windows (to add to src/main.js)
const os = require("os");
const { exec } = require("child_process");

// Windows-specific system info handler
ipcMain.on("get-windows-detailed-info", (event) => {
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

    // Windows specific info
    windowsEdition: "",
    windowsProductName: "",
    windowsInstallDate: "",
    windowsProductKey: "",
    windowsMachineGuid: "",

    // Hardware info
    biosVersion: "",
    motherboard: "",
    computerName: os.hostname(),
  };

  // Try to get Windows-specific info
  if (os.platform() === "win32") {
    // Get Windows edition
    exec("wmic os get caption", { shell: true }, (error, stdout) => {
      if (!error) {
        const lines = stdout.split("\n");
        if (lines.length > 1) systemInfo.windowsEdition = lines[1].trim();
      }
    });

    // Get Windows product name
    exec(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" /v ProductName',
      { shell: true },
      (error, stdout) => {
        if (!error) {
          const match = stdout.match(/ProductName\s+REG_SZ\s+(.+)/);
          if (match) systemInfo.windowsProductName = match[1];
        }
      }
    );

    // Get Windows install date
    exec(
      'systeminfo | find /i "Original Install Date"',
      { shell: true },
      (error, stdout) => {
        if (!error)
          systemInfo.windowsInstallDate = stdout
            .replace("Original Install Date:", "")
            .trim();
      }
    );

    // Get BIOS version
    exec(
      "wmic bios get smbiosbiosversion",
      { shell: true },
      (error, stdout) => {
        if (!error) {
          const lines = stdout.split("\n");
          if (lines.length > 1) systemInfo.biosVersion = lines[1].trim();
        }
      }
    );

    // Get motherboard info
    exec(
      "wmic baseboard get product,Manufacturer",
      { shell: true },
      (error, stdout) => {
        if (!error) {
          const lines = stdout.split("\n");
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            systemInfo.motherboard = parts.slice(0, 2).join(" ");
          }
        }
      }
    );

    // Get machine GUID
    exec(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { shell: true },
      (error, stdout) => {
        if (!error) {
          const match = stdout.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9\-]+)/);
          if (match) systemInfo.windowsMachineGuid = match[1];
        }
      }
    );
  }

  event.returnValue = systemInfo;
});

// Handle Windows system info from renderer
ipcMain.on("windows-system-info", (event, systemInfo) => {
  console.log("📊 Windows system info from renderer:", systemInfo);

  // Log warnings based on system
  if (systemInfo.isWindows) {
    if (systemInfo.isWindows11) {
      console.log("🪟 Windows 11 detected - optimal performance");
    } else if (systemInfo.isWindows10) {
      console.log("🪟 Windows 10 detected - good performance");
    } else {
      console.log(
        `⚠️ Older Windows version detected (${systemInfo.windowsVersion}) - performance may vary`
      );
    }

    if (systemInfo.isWindowsARM) {
      console.log("💻 Windows on ARM - running in compatibility mode");
    }

    if (systemInfo.isWindows32bit) {
      console.warn("⚠️ 32-bit Windows detected - limited memory access");
    }
  }

  if (!systemInfo.supportsWebGL) {
    console.warn("⚠️ WebGL not supported - emulator may fail");
  }

  if (systemInfo.isWindowsServer) {
    console.warn("⚠️ Windows Server detected - not optimized for gaming");
  }
});

// Windows performance optimization helper
function optimizeForWindows() {
  const optimizations = {
    applied: [],
    available: [],
    warnings: [],
  };

  // Check if we can enable hardware acceleration
  if (process.platform === "win32") {
    // Enable high-performance GPU preference for laptops
    optimizations.available.push("High-performance GPU preference");

    // Check for game mode
    if (navigator.userAgent.includes("Windows NT 10.0")) {
      optimizations.available.push("Windows Game Mode optimization");
    }

    // Check for fullscreen optimizations
    optimizations.available.push("Fullscreen optimizations");

    // Check for HDR support
    if (window.matchMedia("(dynamic-range: high)").matches) {
      optimizations.available.push("HDR display support");
    }
  }

  return optimizations;
}

// Use Windows optimizations
window.addEventListener("load", () => {
  if (process.platform === "win32") {
    const optimizations = optimizeForWindows();
    console.log("Windows optimizations available:", optimizations.available);

    // Apply some optimizations automatically
    if (optimizations.available.includes("Fullscreen optimizations")) {
      // Request fullscreen with Windows optimizations
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    }
  }
});
