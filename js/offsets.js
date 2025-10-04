const ROBLOX_VERSION_KEY = 'roblox_current_version';
const UPDATE_TIMESTAMP_KEY = 'roblox_update_timestamp';
const FLASH_DURATION_MS = 15000; // 15 seconds
// -----------------------------------------------------------------------------
// FIX: This constant MUST match the "source" path in vercel.json
const VERSION_PROXY_PATH = '/api/version'; 
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

async function fetchRobloxVersion() {
    const versionBox = document.getElementById('versionBox');
    const versionText = document.getElementById('versionText');
    const versionStatus = document.getElementById('versionStatus');
    const lastChecked = document.getElementById('lastChecked');

    lastChecked.textContent = new Date().toLocaleString();

    try {
        // FIX: Use the local proxy path defined in vercel.json
        const apiUrl = VERSION_PROXY_PATH; 

        // Simple fetch is sufficient with Vercel proxy
        const response = await fetch(apiUrl); 

        if (!response.ok) {
            // Throw an error if the proxy or upstream API fails
            throw new Error(`Proxy error or upstream API error! Status: ${response.status}`);
        }

        // NOTE: Assuming the original API returns the version as plain text.
        // If it returns JSON, you will need to change this line to await response.json()
        const currentVersion = (await response.text()).trim();
        
        if (!currentVersion || currentVersion.length < 5) {
             throw new Error('Invalid or empty version string received from API.');
        }

        const storedVersion = localStorage.getItem(ROBLOX_VERSION_KEY);
        let updateTimestamp = parseInt(localStorage.getItem(UPDATE_TIMESTAMP_KEY)) || 0;

        let status = 'current';
        let remainingTime = 0;
        
        if (currentVersion && currentVersion !== storedVersion) {
            console.log(`New version detected: ${currentVersion}. Old: ${storedVersion}`);
            
            localStorage.setItem(ROBLOX_VERSION_KEY, currentVersion);
            updateTimestamp = Date.now();
            localStorage.setItem(UPDATE_TIMESTAMP_KEY, updateTimestamp);
        }

        const timeSinceUpdate = Date.now() - updateTimestamp;
        
        if (timeSinceUpdate < FLASH_DURATION_MS) {
            status = 'updated';
            remainingTime = FLASH_DURATION_MS - timeSinceUpdate;
        }

        setStatus(status, currentVersion || 'Unknown', versionBox, versionStatus, versionText);

        if (status === 'updated') {
            console.log(`Showing 'Recently Updated'. Transitioning in ${remainingTime}ms.`);
            setTimeout(() => {
                if (Date.now() - updateTimestamp >= FLASH_DURATION_MS) {
                    setStatus('current', currentVersion, versionBox, versionStatus, versionText);
                }
            }, remainingTime);
        }

    } catch (error) {
        console.error('Error fetching Roblox version:', error);
        setStatus('error', 'Failed to load', versionBox, versionStatus, versionText);
        // Do not clear the version if an error occurs, so we can display the last known version
        // localStorage.removeItem(ROBLOX_VERSION_KEY);
        // localStorage.removeItem(UPDATE_TIMESTAMP_KEY);
    }
}
// -----------------------------------------------------------------------------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightCppSyntax(text) {
    let result = escapeHtml(text);

    // Apply highlighting in order - most specific to least specific
    // 1. Hex values
    result = result.replace(/\b(0x[0-9A-Fa-f]+)\b/g, '<span class="syntax-hex">$1</span>');

    // 2. Keywords
    result = result.replace(/\b(namespace|inline|constexpr)\b/g, '<span class="syntax-keyword">$1</span>');

    // 3. Types
    result = result.replace(/\b(uintptr_t)\b/g, '<span class="syntax-type">$1</span>');

    // 4. Identifiers (capital letter word before =)
    result = result.replace(/\b([A-Z][a-zA-Z0-9_]*)\b(\s*=)/g, '<span class="syntax-identifier">$1</span>$2');

    // 5. Braces
    result = result.replace(/([{}])/g, '<span class="syntax-brace">$1</span>');

    return result;
}

async function loadOffsets() {
    try {
        // Ensuring local file path is correct
        const response = await fetch('./offsets/windows-offsets.txt?t=' + Date.now()); 
        const text = await response.text();

        const highlightedText = highlightCppSyntax(text);
        document.getElementById('offsetsContent').innerHTML = highlightedText;
    } catch (error) {
        console.error('Error loading offsets:', error);
        document.getElementById('offsetsContent').textContent = 'Error loading offsets. Please ensure the file exists at the path "offsets/windows-offsets.txt".';
    }
}

loadOffsets();
fetchRobloxVersion();
setInterval(fetchRobloxVersion, 5000); // Check every 5 seconds
setInterval(loadOffsets, 5000);
