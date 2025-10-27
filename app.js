// Configuration
let CONFIG = {
    ADMIN_PASSWORD: 'admin123',
    SHEET_URL: '',
    WEB_APP_URL: ''
};

// Load configuration from localStorage
function loadConfig() {
    const saved = localStorage.getItem('halagel_config');
    if (saved) {
        CONFIG = { ...CONFIG, ...JSON.parse(saved) };
    }
}

// Save configuration to localStorage
function saveConfig() {
    localStorage.setItem('halagel_config', JSON.stringify(CONFIG));
}

// API Functions
async function apiCall(endpoint, data = null) {
    try {
        const url = CONFIG.WEB_APP_URL;
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error connecting to server', 'error');
        return { success: false, error: error.message };
    }
}

// Get all tickets
async function getTickets() {
    return await apiCall();
}

// Create new ticket
async function createTicket(ticket) {
    return await apiCall(null, {
        action: 'create',
        ticket: {
            ...ticket,
            status: 'open',
            createdAt: new Date().toISOString()
        }
    });
}

// Update ticket status
async function updateTicketStatus(id, status) {
    return await apiCall(null, {
        action: 'update',
        id: id,
        status: status
    });
}

// Delete ticket
async function deleteTicket(id) {
    return await apiCall(null, {
        action: 'delete',
        id: id
    });
}

// UI Components
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'success' ? 'bg-green-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createElement(tag, classes = '', content = '') {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    if (content) element.textContent = content;
    return element;
}

// Main App Components
function createHeader() {
    const header = createElement('header', 'bg-slate-900 text-white p-4 shadow-lg');
    
    const container = createElement('div', 'container mx-auto flex justify-between items-center');
    
    const title = createElement('h1', 'text-2xl font-bold flex items-center gap-2');
    title.innerHTML = '<i data-lucide="headphones"></i> Halagel Helpdesk';
    
    const nav = createElement('nav', 'flex gap-4');
    
    const userLink = createElement('button', 'btn-secondary', 'Submit Ticket');
    userLink.onclick = () => renderUserView();
    
    const adminLink = createElement('button', 'btn-outline', 'Admin Login');
    adminLink.onclick = () => renderAdminLogin();
    
    const settingsLink = createElement('button', 'btn-outline');
    settingsLink.innerHTML = '<i data-lucide="settings"></i>';
    settingsLink.onclick = () => renderSettings();
    
    nav.appendChild(userLink);
    nav.appendChild(adminLink);
    nav.appendChild(settingsLink);
    
    container.appendChild(title);
    container.appendChild(nav);
    header.appendChild(container);
    
    return header;
}

function createTicketForm() {
    const form = createElement('form', 'bg-white p-6 rounded-lg shadow-md space-y-4');
    
    form.innerHTML = `
        <h3 class="text-xl font-semibold mb-4">Create New Support Ticket</h3>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" id="ticketTitle" required 
                   class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea id="ticketDescription" required rows="4"
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"></textarea>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" id="ticketEmail" required 
                   class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select id="ticketPriority" 
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>
        </div>
        
        <button type="submit" class="btn-primary w-full">
            <i data-lucide="plus"></i> Create Ticket
        </button>
    `;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const ticket = {
            title: document.getElementById('ticketTitle').value,
            description: document.getElementById('ticketDescription').value,
            email: document.getElementById('ticketEmail').value,
            priority: document.getElementById('ticketPriority').value
        };
        
        const result = await createTicket(ticket);
        
        if (result.success) {
            showNotification('Ticket created successfully! Check your email for confirmation.', 'success');
            form.reset();
        } else {
            showNotification('Failed to create ticket: ' + (result.error || 'Unknown error'), 'error');
        }
    };
    
    return form;
}

function createTicketCard(ticket) {
    const priorityColors = {
        low: 'bg-blue-100 text-blue-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
    };
    
    const statusColors = {
        open: 'bg-green-100 text-green-800',
        in_progress: 'bg-blue-100 text-blue-800',
        done: 'bg-gray-100 text-gray-800'
    };
    
    const card = createElement('div', 'bg-white p-4 rounded-lg shadow-md border-l-4 border-emerald-500');
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-lg">${ticket.Title || ticket.title}</h4>
            <span class="text-sm text-gray-500">#${ticket.ID || ticket.id}</span>
        </div>
        
        <p class="text-gray-600 mb-3">${ticket.Description || ticket.description}</p>
        
        <div class="flex flex-wrap gap-2 mb-3">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.Priority || ticket.priority] || 'bg-gray-100'}">
                ${(ticket.Priority || ticket.priority).charAt(0).toUpperCase() + (ticket.Priority || ticket.priority).slice(1)}
            </span>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.Status || ticket.status] || 'bg-gray-100'}">
                ${(ticket.Status || ticket.status).split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
        </div>
        
        <div class="flex justify-between items-center text-sm text-gray-500">
            <span>${ticket.Email || ticket.email}</span>
            <span>${new Date(ticket['Created At'] || ticket.createdAt).toLocaleDateString()}</span>
        </div>
    `;
    
    return card;
}

// View Renderers
function renderUserView() {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    
    const container = createElement('div', 'container mx-auto p-4 space-y-6');
    
    const hero = createElement('div', 'text-center py-8');
    hero.innerHTML = `
        <h2 class="text-4xl font-bold text-gray-800 mb-4">IT Support Helpdesk</h2>
        <p class="text-xl text-gray-600">Submit and track your support tickets</p>
    `;
    
    const grid = createElement('div', 'grid md:grid-cols-2 gap-8');
    
    const formSection = createElement('div');
    formSection.appendChild(createTicketForm());
    
    const ticketsSection = createElement('div', 'space-y-4');
    ticketsSection.innerHTML = '<h3 class="text-xl font-semibold mb-4">Recent Tickets</h3>';
    
    const ticketsList = createElement('div', 'space-y-4 max-h-96 overflow-y-auto');
    ticketsSection.appendChild(ticketsList);
    
    // Load and display tickets
    loadTicketsForUserView(ticketsList);
    
    grid.appendChild(formSection);
    grid.appendChild(ticketsSection);
    
    container.appendChild(hero);
    container.appendChild(grid);
    main.appendChild(container);
}

async function loadTicketsForUserView(container) {
    const result = await getTickets();
    
    if (result.success && result.tickets) {
        const recentTickets = result.tickets.slice(-5).reverse(); // Show 5 most recent
        
        if (recentTickets.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No tickets yet. Be the first to create one!</p>';
            return;
        }
        
        recentTickets.forEach(ticket => {
            container.appendChild(createTicketCard(ticket));
        });
    } else {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Unable to load tickets. Please check configuration.</p>';
    }
}

function renderAdminLogin() {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    
    const container = createElement('div', 'container mx-auto p-4 max-w-md');
    
    const loginCard = createElement('div', 'bg-white p-8 rounded-lg shadow-md space-y-6');
    loginCard.innerHTML = `
        <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
            <p class="text-gray-600">Enter admin password to continue</p>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="adminPassword" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   placeholder="Enter admin password">
        </div>
        
        <button onclick="handleAdminLogin()" class="btn-primary w-full">
            <i data-lucide="log-in"></i> Login
        </button>
    `;
    
    container.appendChild(loginCard);
    main.appendChild(container);
}

function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        localStorage.setItem('halagel_admin', 'true');
        renderAdminView();
        showNotification('Admin login successful!', 'success');
    } else {
        showNotification('Invalid password!', 'error');
    }
}

function renderAdminView() {
    if (!localStorage.getItem('halagel_admin')) {
        renderAdminLogin();
        return;
    }
    
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    
    const container = createElement('div', 'container mx-auto p-4 space-y-6');
    
    const header = createElement('div', 'flex justify-between items-center');
    header.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <div class="flex gap-2">
            <button onclick="refreshTickets()" class="btn-secondary">
                <i data-lucide="refresh-cw"></i> Refresh
            </button>
            <button onclick="logoutAdmin()" class="btn-outline">
                <i data-lucide="log-out"></i> Logout
            </button>
        </div>
    `;
    
    const stats = createElement('div', 'grid grid-cols-2 md:grid-cols-4 gap-4');
    
    const ticketsContainer = createElement('div', 'space-y-4');
    ticketsContainer.innerHTML = '<h3 class="text-xl font-semibold mb-4">All Tickets</h3>';
    
    const ticketsList = createElement('div', 'space-y-4');
    ticketsContainer.appendChild(ticketsList);
    
    container.appendChild(header);
    container.appendChild(stats);
    container.appendChild(ticketsContainer);
    main.appendChild(container);
    
    loadTicketsForAdmin(ticketsList, stats);
}

async function loadTicketsForAdmin(container, statsContainer) {
    const result = await getTickets();
    
    if (result.success && result.tickets) {
        const tickets = result.tickets.reverse();
        
        // Update stats
        const openTickets = tickets.filter(t => (t.Status || t.status) === 'open').length;
        const inProgressTickets = tickets.filter(t => (t.Status || t.status) === 'in_progress').length;
        const doneTickets = tickets.filter(t => (t.Status || t.status) === 'done').length;
        const totalTickets = tickets.length;
        
        statsContainer.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-600">${totalTickets}</div>
                <div class="text-sm text-blue-600">Total Tickets</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-600">${openTickets}</div>
                <div class="text-sm text-green-600">Open</div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-yellow-600">${inProgressTickets}</div>
                <div class="text-sm text-yellow-600">In Progress</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-gray-600">${doneTickets}</div>
                <div class="text-sm text-gray-600">Completed</div>
            </div>
        `;
        
        if (tickets.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No tickets found.</p>';
            return;
        }
        
        tickets.forEach(ticket => {
            container.appendChild(createAdminTicketCard(ticket));
        });
    } else {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Unable to load tickets. Please check configuration.</p>';
    }
}

function createAdminTicketCard(ticket) {
    const card = createElement('div', 'bg-white p-4 rounded-lg shadow-md border border-gray-200');
    
    const statusOptions = ['open', 'in_progress', 'done'];
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
                <h4 class="font-semibold text-lg">${ticket.Title || ticket.title}</h4>
                <p class="text-gray-600 text-sm mt-1">${ticket.Description || ticket.description}</p>
            </div>
            <span class="text-sm text-gray-500 ml-4">#${ticket.ID || ticket.id}</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
                <label class="block text-xs text-gray-500 mb-1">Email</label>
                <div class="text-sm">${ticket.Email || ticket.email}</div>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">Priority</label>
                <div class="text-sm capitalize">${ticket.Priority || ticket.priority}</div>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">Created</label>
                <div class="text-sm">${new Date(ticket['Created At'] || ticket.createdAt).toLocaleString()}</div>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-2 justify-between items-center">
            <select class="p-2 border border-gray-300 rounded-md text-sm" 
                    onchange="updateTicketStatusHandler(${ticket.ID || ticket.id}, this.value)">
                ${statusOptions.map(status => `
                    <option value="${status}" ${(ticket.Status || ticket.status) === status ? 'selected' : ''}>
                        ${status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                `).join('')}
            </select>
            
            <button onclick="deleteTicketHandler(${ticket.ID || ticket.id})" 
                    class="btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm">
                <i data-lucide="trash-2"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

async function updateTicketStatusHandler(id, status) {
    const result = await updateTicketStatus(id, status);
    
    if (result.success) {
        showNotification('Ticket status updated successfully!', 'success');
        setTimeout(() => refreshTickets(), 1000);
    } else {
        showNotification('Failed to update ticket status', 'error');
    }
}

async function deleteTicketHandler(id) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        const result = await deleteTicket(id);
        
        if (result.success) {
            showNotification('Ticket deleted successfully!', 'success');
            setTimeout(() => refreshTickets(), 1000);
        } else {
            showNotification('Failed to delete ticket', 'error');
        }
    }
}

function refreshTickets() {
    if (localStorage.getItem('halagel_admin')) {
        renderAdminView();
    } else {
        renderUserView();
    }
}

function logoutAdmin() {
    localStorage.removeItem('halagel_admin');
    renderUserView();
    showNotification('Admin logged out successfully!', 'success');
}

function renderSettings() {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    
    const container = createElement('div', 'container mx-auto p-4 max-w-2xl');
    
    const settingsCard = createElement('div', 'bg-white p-6 rounded-lg shadow-md space-y-6');
    settingsCard.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">System Configuration</h2>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
            <input type="password" id="configPassword" value="${CONFIG.ADMIN_PASSWORD}"
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   placeholder="Enter new admin password">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Google Sheet URL</label>
            <input type="text" id="configSheetUrl" value="${CONFIG.SHEET_URL}"
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   placeholder="https://docs.google.com/spreadsheets/d/...">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Web App URL (Apps Script)</label>
            <input type="text" id="configWebAppUrl" value="${CONFIG.WEB_APP_URL}"
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   placeholder="https://script.google.com/macros/s/.../exec">
            <p class="text-xs text-gray-500 mt-1">Make sure this URL has "Anyone" access in Apps Script deployment</p>
        </div>
        
        <div class="flex gap-3">
            <button onclick="saveConfiguration()" class="btn-primary">
                <i data-lucide="save"></i> Save Configuration
            </button>
            <button onclick="renderUserView()" class="btn-outline">
                <i data-lucide="arrow-left"></i> Back
            </button>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
            <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Web App URL must be from Apps Script deployment with "Anyone" access</li>
                <li>• Google Sheet must have proper column headers</li>
                <li>• Sheet name must be "Sheet1" (default)</li>
                <li>• Changes take effect immediately after saving</li>
            </ul>
        </div>
    `;
    
    container.appendChild(settingsCard);
    main.appendChild(container);
}

function saveConfiguration() {
    CONFIG.ADMIN_PASSWORD = document.getElementById('configPassword').value;
    CONFIG.SHEET_URL = document.getElementById('configSheetUrl').value;
    CONFIG.WEB_APP_URL = document.getElementById('configWebAppUrl').value;
    
    saveConfig();
    showNotification('Configuration saved successfully!', 'success');
}

// Initialize the application
function initApp() {
    loadConfig();
    
    const appContainer = createElement('div', 'min-h-screen bg-gray-50');
    
    appContainer.appendChild(createHeader());
    
    const main = createElement('main');
    main.id = 'main-content';
    appContainer.appendChild(main);
    
    document.getElementById('root').appendChild(appContainer);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Render initial view
    renderUserView();
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
