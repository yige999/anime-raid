// Content Management System for Anime Raid Wiki
// Handles dynamic updates for codes, character data, and other content

class CMSManager {
    constructor() {
        this.codesData = this.loadCodesData();
        this.characterData = this.loadCharacterData();
        this.lastUpdate = this.getLastUpdate();
        this.init();
    }

    init() {
        this.setupAutoUpdate();
        this.setupCodeManagement();
        this.setupSearchFunctionality();
        this.setupNotificationSystem();
        console.log('CMS initialized successfully');
    }

    // Codes Management
    loadCodesData() {
        const savedData = localStorage.getItem('animeRaidCodes');
        if (savedData) {
            return JSON.parse(savedData);
        }

        // Default codes data
        return {
            active: [
                {
                    id: 'animeraid2025',
                    code: 'ANIMERAID2025',
                    rewards: '💎 Diamonds x5000',
                    description: 'New player welcome package with diamonds, gold, and experience potions',
                    expires: '2025-12-31',
                    status: 'active',
                    priority: 'high'
                },
                {
                    id: 'summergift500',
                    code: 'SUMMERGIFT500',
                    rewards: '💰 Gold x100,000',
                    description: 'Summer special event rewards with lots of gold and rare materials',
                    expires: '2025-10-31',
                    status: 'active',
                    priority: 'high'
                },
                {
                    id: 'raidnewyear',
                    code: 'RAIDNEWYEAR',
                    rewards: '🎁 Mystery Chest x5',
                    description: 'New Year limited rewards, redeem quickly',
                    expires: '2025-10-20',
                    status: 'expiring',
                    priority: 'medium'
                },
                {
                    id: 'welcomeback',
                    code: 'WELCOMEBACK',
                    rewards: '⚔️ SR Weapon x1',
                    description: 'Return player exclusive rewards',
                    expires: '2025-11-30',
                    status: 'active',
                    priority: 'medium'
                },
                {
                    id: 'levelup100',
                    code: 'LEVELUP100',
                    rewards: '📖 Experience Books x100',
                    description: 'Level progression gift package',
                    expires: '2025-12-15',
                    status: 'active',
                    priority: 'low'
                }
            ],
            expired: [
                {
                    id: 'summer2024',
                    code: 'SUMMER2024',
                    rewards: 'Various rewards',
                    description: 'Summer 2024 event',
                    expired: '2024-08-31'
                },
                {
                    id: 'christmas2024',
                    code: 'CHRISTMAS2024',
                    rewards: 'Holiday rewards',
                    description: 'Christmas 2024 special',
                    expired: '2024-12-31'
                }
            ]
        };
    }

    saveCodesData() {
        localStorage.setItem('animeRaidCodes', JSON.stringify(this.codesData));
        this.lastUpdate = new Date().toISOString();
        localStorage.setItem('animeRaidLastUpdate', this.lastUpdate);
    }

    getLastUpdate() {
        return localStorage.getItem('animeRaidLastUpdate') || new Date().toISOString();
    }

    // Character Data Management
    loadCharacterData() {
        const savedData = localStorage.getItem('animeRaidCharacters');
        if (savedData) {
            return JSON.parse(savedData);
        }

        return {
            characters: [
                {
                    id: 'shadow-assassin',
                    name: 'Shadow Assassin',
                    tier: 'S',
                    role: 'DPS',
                    element: 'Dark',
                    rating: 98,
                    lastUpdated: '2025-10-16'
                },
                {
                    id: 'holy-priest',
                    name: 'Holy Priest',
                    tier: 'S',
                    role: 'Healer',
                    element: 'Light',
                    rating: 96,
                    lastUpdated: '2025-10-16'
                }
            ]
        };
    }

    // Auto Update System
    setupAutoUpdate() {
        // Check for updates every 30 minutes
        setInterval(() => {
            this.checkForUpdates();
        }, 30 * 60 * 1000);

        // Check on page load
        this.checkForUpdates();
    }

    async checkForUpdates() {
        try {
            // In a real implementation, this would fetch from a server
            // For demo purposes, we'll simulate update checks

            const mockUpdateResponse = {
                hasUpdates: Math.random() > 0.8, // 20% chance of updates
                data: {
                    newCodes: [],
                    updatedCharacters: [],
                    lastUpdate: new Date().toISOString()
                }
            };

            if (mockUpdateResponse.hasUpdates) {
                this.processUpdates(mockUpdateResponse.data);
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
        }
    }

    processUpdates(updateData) {
        if (updateData.newCodes.length > 0) {
            updateData.newCodes.forEach(code => {
                this.addNewCode(code);
            });
        }

        if (updateData.updatedCharacters.length > 0) {
            updateData.updatedCharacters.forEach(character => {
                this.updateCharacterData(character);
            });
        }

        this.showNotification('Content updated successfully!');
    }

    // Code Management Functions
    addNewCode(codeData) {
        const newCode = {
            id: codeData.code.toLowerCase().replace(/[^a-z0-9]/g, ''),
            code: codeData.code,
            rewards: codeData.rewards,
            description: codeData.description,
            expires: codeData.expires,
            status: this.determineCodeStatus(codeData.expires),
            priority: codeData.priority || 'medium',
            dateAdded: new Date().toISOString()
        };

        this.codesData.active.unshift(newCode);
        this.saveCodesData();
        this.updateCodesDisplay();
    }

    determineCodeStatus(expiresDate) {
        const now = new Date();
        const expires = new Date(expiresDate);
        const daysUntilExpiry = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) return 'expired';
        if (daysUntilExpiry <= 7) return 'expiring';
        return 'active';
    }

    updateCodesDisplay() {
        // Update codes page if we're on it
        if (window.location.pathname.includes('/codes/')) {
            this.renderCodesList();
        }
    }

    renderCodesList() {
        const codesContainer = document.getElementById('codes-list');
        if (!codesContainer) return;

        const sortedCodes = this.sortCodesByPriority();

        codesContainer.innerHTML = sortedCodes.map(code => this.createCodeCard(code)).join('');

        // Add click handlers for copy functionality
        this.setupCodeCopyHandlers();
    }

    sortCodesByPriority() {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };

        return [...this.codesData.active].sort((a, b) => {
            // First sort by priority
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Then sort by status (expiring codes first)
            const statusOrder = { 'expiring': 3, 'active': 2, 'expired': 1 };
            return statusOrder[b.status] - statusOrder[a.status];
        });
    }

    createCodeCard(code) {
        const statusClass = {
            'active': 'border-green-500',
            'expiring': 'border-yellow-500',
            'expired': 'border-red-500'
        }[code.status];

        const statusBadge = {
            'active': '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>',
            'expiring': '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Expiring Soon</span>',
            'expired': '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Expired</span>'
        }[code.status];

        const daysUntilExpiry = Math.ceil((new Date(code.expires) - new Date()) / (1000 * 60 * 60 * 24));
        const expiryText = daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired';

        return `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 ${statusClass} code-card" data-code-id="${code.id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="font-mono text-xl font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors" onclick="copyCode('${code.code}')">
                            ${code.code}
                        </div>
                        <div class="text-sm text-green-600 mt-2">${code.rewards}</div>
                    </div>
                    <div class="text-right">
                        ${statusBadge}
                        <div class="text-sm text-gray-500 mt-1">${expiryText}</div>
                    </div>
                </div>
                <div class="text-sm text-gray-600">${code.description}</div>
                <div class="mt-3 flex items-center text-xs text-gray-400">
                    <span>Added: ${new Date(code.dateAdded || Date.now()).toLocaleDateString()}</span>
                    ${code.priority !== 'medium' ? `<span class="ml-3 bg-purple-100 text-purple-700 px-2 py-1 rounded">Priority: ${code.priority.toUpperCase()}</span>` : ''}
                </div>
            </div>
        `;
    }

    setupCodeCopyHandlers() {
        // Copy functionality is handled by onclick in the createCodeCard function
        // but we could add additional handlers here if needed
    }

    // Search Functionality
    setupSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) {
            this.showAllResults();
            return;
        }

        const results = this.searchContent(query.toLowerCase());
        this.displaySearchResults(results);
    }

    searchContent(query) {
        const results = {
            codes: [],
            characters: [],
            guides: []
        };

        // Search codes
        results.codes = this.codesData.active.filter(code =>
            code.code.toLowerCase().includes(query) ||
            code.description.toLowerCase().includes(query) ||
            code.rewards.toLowerCase().includes(query)
        );

        // Search characters
        results.characters = this.characterData.characters.filter(character =>
            character.name.toLowerCase().includes(query) ||
            character.role.toLowerCase().includes(query) ||
            character.element.toLowerCase().includes(query)
        );

        return results;
    }

    displaySearchResults(results) {
        // Implementation would depend on the current page
        console.log('Search results:', results);
    }

    showAllResults() {
        // Reset display to show all content
        console.log('Showing all results');
    }

    // Notification System
    setupNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'fixed top-20 right-4 z-50 space-y-2';
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');

        const bgColor = {
            'info': 'bg-blue-500',
            'success': 'bg-green-500',
            'warning': 'bg-yellow-500',
            'error': 'bg-red-500'
        }[type];

        notification.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        notification.textContent = message;

        this.notificationContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // Character Data Updates
    updateCharacterData(characterData) {
        const index = this.characterData.characters.findIndex(c => c.id === characterData.id);
        if (index !== -1) {
            this.characterData.characters[index] = {
                ...this.characterData.characters[index],
                ...characterData,
                lastUpdated: new Date().toISOString()
            };
        } else {
            this.characterData.characters.push({
                ...characterData,
                lastUpdated: new Date().toISOString()
            });
        }

        localStorage.setItem('animeRaidCharacters', JSON.stringify(this.characterData));
    }

    // Code Management for Admin (simplified)
    setupCodeManagement() {
        // This would be expanded for actual admin functionality
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            this.renderAdminPanel();
        }
    }

    renderAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (!adminPanel) return;

        adminPanel.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-xl font-semibold mb-4">Code Management</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">New Code</label>
                        <input type="text" id="new-code-input" class="w-full border rounded-lg px-3 py-2" placeholder="Enter new code">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rewards</label>
                        <input type="text" id="new-rewards-input" class="w-full border rounded-lg px-3 py-2" placeholder="Enter rewards">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="new-description-input" class="w-full border rounded-lg px-3 py-2" placeholder="Enter description"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input type="date" id="new-expiry-input" class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <button onclick="cms.addNewCodeFromForm()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Add New Code
                    </button>
                </div>
            </div>
        `;
    }

    addNewCodeFromForm() {
        const codeInput = document.getElementById('new-code-input');
        const rewardsInput = document.getElementById('new-rewards-input');
        const descriptionInput = document.getElementById('new-description-input');
        const expiryInput = document.getElementById('new-expiry-input');

        if (!codeInput.value || !rewardsInput.value || !descriptionInput.value || !expiryInput.value) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const newCode = {
            code: codeInput.value.toUpperCase(),
            rewards: rewardsInput.value,
            description: descriptionInput.value,
            expires: expiryInput.value,
            priority: 'medium'
        };

        this.addNewCode(newCode);

        // Clear form
        codeInput.value = '';
        rewardsInput.value = '';
        descriptionInput.value = '';
        expiryInput.value = '';

        this.showNotification('Code added successfully!', 'success');
    }
}

// Global copy function for codes
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        // Show feedback
        const event = new CustomEvent('codeCopied', { detail: { code } });
        document.dispatchEvent(event);

        // Temporarily show success message
        const originalText = event.target?.textContent;
        if (event.target) {
            event.target.textContent = 'Copied!';
            event.target.classList.add('bg-green-100');
            setTimeout(() => {
                event.target.textContent = originalText;
                event.target.classList.remove('bg-green-100');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy code:', err);
    });
}

// Initialize CMS when DOM is loaded
let cms;
document.addEventListener('DOMContentLoaded', () => {
    cms = new CMSManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMSManager;
}