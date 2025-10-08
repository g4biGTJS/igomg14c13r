// -----------------------------------------------------------------------------
// Glacier Executor - Offsets + WEAO Roblox Version Tracker
// -----------------------------------------------------------------------------

const ROBLOX_VERSION_KEY = 'roblox_current_version';
const UPDATE_TIMESTAMP_KEY = 'roblox_update_timestamp';

// Show “Recently Updated” for 15 seconds
const FLASH_DURATION_MS = 15000;

// WEAO API endpoint for live Roblox versions
const WEAO_API_URL = 'https://weao.xyz/api/versions/current';

// -----------------------------------------------------------------------------
// UI helpers
// -----------------------------------------------------------------------------
function setStatus(status, version, versionBox, versionStatus, versionText) {
  versionText.textContent = version;

  if (status === 'updated') {
    versionBox.className = 'version-box updated';
    versionStatus.textContent = 'Recently Updated';
  } else if (status === 'current') {
    versionBox.className = 'version-box current';
    versionStatus.textContent = 'Current Version';
  } else if (status === 'error') {
    versionBox.className = 'version-box error';
    versionStatus.textContent = 'Error';
    versionText.textContent = 'Failed to load';
  }
}

// -----------------------------------------------------------------------------
// Fetch Roblox Windows version from WEAO API
// -----------------------------------------------------------------------------
async function fetchRobloxVersion() {
  const versionBox = document.getElementById('versionBox');
  const versionText = document.getElementById('versionText');
  const versionStatus = document.getElementById('versionStatus');
  const lastChecked = document.getElementById('lastChecked');

  lastChecked.textContent = new Date().toLocaleString();

  try {
    const response = await fetch(WEAO_API_URL + '?t=' + Date.now(), {
      headers: { 'User-Agent': 'WEAO-3PService' },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`WEAO API error! Status: ${response.status}`);
    }

    const data = await response.json();
    const currentVersion = (data.Windows || '').trim();

    if (!currentVersion || currentVersion.length < 5) {
      throw new Error('Invalid or empty version string from WEAO.');
    }

    const storedVersion = localStorage.getItem(ROBLOX_VERSION_KEY);
    let updateTimestamp = parseInt(localStorage.getItem(UPDATE_TIMESTAMP_KEY)) || 0;
    let status = 'current';
    let remainingTime = 0;

    // Detect new version or first-time run
    if (!storedVersion || currentVersion !== storedVersion) {
      console.log(`🧊 New Windows version detected: ${currentVersion} (old: ${storedVersion || 'none'})`);
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
    setStatus('error', 'Failed to load', versionBox, versionStatus, versionText);
  }
}

// -----------------------------------------------------------------------------
// Syntax highlighting for offsets
// -----------------------------------------------------------------------------
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightCppSyntax(text) {
  let result = escapeHtml(text);

  result = result.replace(/\b(0x[0-9A-Fa-f]+)\b/g, '<span class="syntax-hex">$1</span>');
  result = result.replace(/\b(namespace|inline|constexpr)\b/g, '<span class="syntax-keyword">$1</span>');
  result = result.replace(/\b(uintptr_t)\b/g, '<span class="syntax-type">$1</span>');
  result = result.replace(/\b([A-Z][a-zA-Z0-9_]*)\b(\s*=)/g, '<span class="syntax-identifier">$1</span>$2');
  result = result.replace(/([{}])/g, '<span class="syntax-brace">$1</span>');

  return result;
}

// -----------------------------------------------------------------------------
// Load local offsets file
// -----------------------------------------------------------------------------
async function loadOffsets() {
  try {
    const response = await fetch('./offsets/windows-offsets.txt?t=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const highlightedText = highlightCppSyntax(text);
    document.getElementById('offsetsContent').innerHTML = highlightedText;
  } catch (error) {
    console.error('❌ Error loading offsets:', error);
    document.getElementById('offsetsContent').textContent =
      'Error loading offsets. Please ensure the file exists at "offsets/windows-offsets.txt".';
  }
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------
loadOffsets();
fetchRobloxVersion();

// Refresh every 5 seconds
setInterval(fetchRobloxVersion, 5000);
setInterval(loadOffsets, 5000);
