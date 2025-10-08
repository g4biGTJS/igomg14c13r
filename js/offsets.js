// -----------------------------------------------------------------------------
// Glacier Executor - Roblox Windows Version via Vercel Proxy to Official API
// -----------------------------------------------------------------------------

const ROBLOX_VERSION_KEY = 'roblox_current_version';
const UPDATE_TIMESTAMP_KEY = 'roblox_update_timestamp';
const FLASH_DURATION_MS = 15000; // 15 seconds

// Your Vercel proxy path (rewrites to the official Roblox API)
const VERSION_PROXY_PATH = '/api/version';

// ... (UI Helpers functions remain the same: setStatus, etc.)

// -----------------------------------------------------------------------------
// Fetch Roblox Windows Version (through proxy to Official API)
// -----------------------------------------------------------------------------
async function fetchRobloxVersion() {
  const versionBox = document.getElementById('versionBox');
  const versionText = document.getElementById('versionText');
  const versionStatus = document.getElementById('versionStatus');
  const lastChecked = document.getElementById('lastChecked');

  lastChecked.textContent = new Date().toLocaleString();

  try {
    // 💡 FIX: Using a standard User-Agent to try and bypass 403 blocks
    const response = await fetch(VERSION_PROXY_PATH + '?t=' + Date.now(), {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' 
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Proxy or upstream error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    // 💡 FIX: Extracting the specific 'clientVersionUpload' field as requested
    const currentVersion = (data.clientVersionUpload || '').trim(); 

    if (!currentVersion || currentVersion.length < 5 || !currentVersion.startsWith('version-')) {
      throw new Error('Invalid or unexpected version string from official Roblox API.');
    }

    // The rest of the logic remains the same: version storage, update flash, etc.
    const storedVersion = localStorage.getItem(ROBLOX_VERSION_KEY);
    let updateTimestamp = parseInt(localStorage.getItem(UPDATE_TIMESTAMP_KEY)) || 0;
    let status = 'current';
    let remainingTime = 0;

    // Detect first-time or updated version
    if (!storedVersion || currentVersion !== storedVersion) {
      console.log(`🧊 New version detected: ${currentVersion} (old: ${storedVersion || 'none'})`);
      localStorage.setItem(ROBLOX_VERSION_KEY, currentVersion);
      updateTimestamp = Date.now();
      localStorage.setItem(UPDATE_TIMESTAMP_KEY, updateTimestamp);
      status = 'updated';
    }

    const timeSinceUpdate = Date.now() - updateTimestamp;
    if (timeSinceUpdate < FLASH_DURATION_MS) {
      status = 'updated';
      remainingTime = FLASH_DURATION_MS - timeSinceUpdate;
    }

    setStatus(status, currentVersion, versionBox, versionStatus, versionText);

    if (status === 'updated') {
      setTimeout(() => {
        if (Date.now() - updateTimestamp >= FLASH_DURATION_MS) {
          setStatus('current', currentVersion, versionBox, versionStatus, versionText);
        }
      }, remainingTime);
    }

  } catch (error) {
    console.error('❌ Error fetching Roblox version:', error);
    // Try to retrieve the last known version from storage if the fetch fails
    const lastKnownVersion = localStorage.getItem(ROBLOX_VERSION_KEY) || 'Failed to load';
    setStatus('error', lastKnownVersion, versionBox, versionStatus, versionText);
  }
}

// ... (Syntax highlighting, loadOffsets, and Initialize blocks remain the same)
