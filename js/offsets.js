const ROBLOX_VERSION_KEY = 'roblox_current_version';
const UPDATE_TIMESTAMP_KEY = 'roblox_update_timestamp';
const FLASH_DURATION_MS = 3600000; // CHANGED: 1 hour instead of 15 seconds

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
        // CHANGED: Direct URL for the version string
        const apiUrl = 'https://raw.githubusercontent.com/g4biGTJS/nythrixhub/refs/heads/main/helloka';

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain', // Requesting plain text
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // CHANGED: Read the response as plain text
        const responseText = await response.text();
        const currentVersion = responseText.trim(); 
        
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
        localStorage.removeItem(ROBLOX_VERSION_KEY);
        localStorage.removeItem(UPDATE_TIMESTAMP_KEY);
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
        const response = await fetch('offsets/windows-offsets.txt?t=' + Date.now());
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
setInterval(fetchRobloxVersion, 5000); // CHANGED: 5 seconds instead of 30
setInterval(loadOffsets, 5000);

