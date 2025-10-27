// Halagel Helpdesk - Ultra Simple Version
console.log('Halagel Helpdesk loading...');

class HalagelHelpdesk {
    constructor() {
        this.config = {
            ADMIN_PASSWORD: 'admin123',
            WEB_APP_URL: ''
        };
        this.loadConfig();
        this.init();
    }

    loadConfig() {
        const saved = localStorage.getItem('halagel_config');
        if (saved) {
            Object.assign(this.config, JSON.parse(saved));
        }
    }

    saveConfig() {
        localStorage.setItem('halagel_config', JSON.stringify(this.config));
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(note => note.remove());

        const notification = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : 
                        type === 'success' ? 'bg-green-500' : 'bg-blue-500';
        
        notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 ${bgColor}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    createElement(tag, classes = '', content = '') {
        const element = document.createElement(tag);
        if (classes) element.className = classes;
        if (content) element.innerHTML = content;
        return element;
    }

    createHeader() {
        const header = this.createElement('header', 'bg-slate-900 text-white p-4 shadow-lg');
        const container = this.createElement('div', 'container mx-auto flex justify-between items-center');
        
        const title = this.createElement('h1', 'text-2xl font-bold flex items-center gap-2', 
            '<i data-feather="headphones"></i> Halagel Helpdesk');
        
        const nav = this.createElement('nav', 'flex gap-4');
        
        const userLink = this.createElement('button', 'btn-secondary', '<i data-feather="plus"></i> Submit Ticket');
        userLink.onclick = () => this.renderUserView();
        
        const adminLink = this.createElement('button', 'btn-outline', '<i data-feather="lock"></i> Admin');
        adminLink.onclick = () => this.renderAdminLogin();
        
        nav.appendChild(userLink);
        nav.appendChild(adminLink);
        container.appendChild(title);
        container.appendChild(nav);
        header.appendChild(container);
        
        return header;
    }

    createTicketForm() {
        const form = this.createElement('form', 'bg-white p-6 rounded-lg shadow-md space-y-4');
        
        form.innerHTML = `
            <h3 class="text-xl font-semibold mb-4">Create New Support Ticket</h3>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" id="ticketTitle" required 
                       class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea id="ticketDescription" required rows="4"
                          class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" id="ticketEmail" required 
                       class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select id="ticketPriority" class="w-full p-2 border border-gray-300 rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>
            
            <button type="submit" class="btn-primary w-full">
                <i data-feather="plus"></i> Create Ticket
            </button>
        `;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            this.showNotification('Ticket form would be submitted here. Configure your Web App URL in settings.', 'info');
        };
        
        return form;
    }

    renderUserView() {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        
        const container = this.createElement('div', 'container mx-auto p-4 space-y-6');
        
        const hero = this.createElement('div', 'text-center py-8');
        hero.innerHTML = `
            <h2 class="text-4xl font-bold text-gray-800 mb-4">IT Support Helpdesk</h2>
            <p class="text-xl text-gray-600">Submit and track your support tickets</p>
        `;
        
        const grid = this.createElement('div', 'grid md:grid-cols-2 gap-8');
        
        const formSection = this.createElement('div');
        formSection.appendChild(this.createTicketForm());
        
        const infoSection = this.createElement('div', 'bg-blue-50 p-6 rounded-lg');
        infoSection.innerHTML = `
            <h3 class="text-xl font-semibold mb-4">Getting Started</h3>
            <div class="space-y-3 text-sm text-gray-700">
                <p>🚀 <strong>Your helpdesk is live!</strong> Now you need to:</p>
                <ol class="list-decimal list-inside space-y-2 ml-2">
                    <li>Configure your Google Apps Script URL in Settings</li>
                    <li>Test creating a ticket</li>
                    <li>Login as admin to manage tickets</li>
                </ol>
                <p class="mt-4">Default admin password: <code>admin123</code></p>
            </div>
        `;
        
        grid.appendChild(formSection);
        grid.appendChild(infoSection);
        container.appendChild(hero);
        container.appendChild(grid);
        main.appendChild(container);
        
        this.refreshIcons();
    }

    renderAdminLogin() {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        
        const container = this.createElement('div', 'container mx-auto p-4 max-w-md');
        
        const loginCard = this.createElement('div', 'bg-white p-8 rounded-lg shadow-md space-y-6');
        loginCard.innerHTML = `
            <div class="text-center">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
                <p class="text-gray-600">Enter admin password</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" id="adminPassword" 
                       class="w-full p-3 border border-gray-300 rounded-lg"
                       placeholder="Enter admin password" value="admin123">
            </div>
            
            <button onclick="app.handleAdminLogin()" class="btn-primary w-full">
                <i data-feather="log-in"></i> Login
            </button>
            
            <div class="text-center text-sm text-gray-500">
                Default password: <code>admin123</code>
            </div>
        `;
        
        container.appendChild(loginCard);
        main.appendChild(container);
        this.refreshIcons();
    }

    handleAdminLogin() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.config.ADMIN_PASSWORD) {
            localStorage.setItem('halagel_admin', 'true');
            this.showNotification('Admin login successful!', 'success');
            this.renderAdminView();
        } else {
            this.showNotification('Invalid password!', 'error');
        }
    }

    renderAdminView() {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        
        const container = this.createElement('div', 'container mx-auto p-4');
        
        const header = this.createElement('div', 'flex justify-between items-center mb-6');
        header.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
            <button onclick="app.logoutAdmin()" class="btn-outline">
                <i data-feather="log-out"></i> Logout
            </button>
        `;
        
        const message = this.createElement('div', 'bg-green-50 border border-green-200 rounded-lg p-6 text-center');
        message.innerHTML = `
            <h3 class="text-lg font-semibold text-green-800 mb-2">Admin Panel Ready!</h3>
            <p class="text-green-700">Configure your Web App URL to start managing tickets.</p>
            <button onclick="app.renderSettings()" class="btn-primary mt-4">
                <i data-feather="settings"></i> Configure Settings
            </button>
        `;
        
        container.appendChild(header);
        container.appendChild(message);
        main.appendChild(container);
        
        this.refreshIcons();
    }

    renderSettings() {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        
        const container = this.createElement('div', 'container mx-auto p-4 max-w-2xl');
        
        const settingsCard = this.createElement('div', 'bg-white p-6 rounded-lg shadow-md space-y-6');
        settingsCard.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-4">System Configuration</h2>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
                <input type="password" id="configPassword" value="${this.config.ADMIN_PASSWORD}"
                       class="w-full p-3 border border-gray-300 rounded-lg">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Web App URL (Apps Script)</label>
                <input type="text" id="configWebAppUrl" value="${this.config.WEB_APP_URL}"
                       class="w-full p-3 border border-gray-300 rounded-lg"
                       placeholder="https://script.google.com/macros/s/.../exec">
                <p class="text-xs text-gray-500 mt-1">Paste your Google Apps Script deployment URL here</p>
            </div>
            
            <div class="flex gap-3">
                <button onclick="app.saveConfiguration()" class="btn-primary">
                    <i data-feather="save"></i> Save Configuration
                </button>
                <button onclick="app.renderUserView()" class="btn-outline">
                    <i data-feather="arrow-left"></i> Back
                </button>
            </div>
        `;
        
        container.appendChild(settingsCard);
        main.appendChild(container);
        this.refreshIcons();
    }

    saveConfiguration() {
        this.config.ADMIN_PASSWORD = document.getElementById('configPassword').value;
        this.config.WEB_APP_URL = document.getElementById('configWebAppUrl').value;
        this.saveConfig();
        this.showNotification('Configuration saved successfully!', 'success');
    }

    logoutAdmin() {
        localStorage.removeItem('halagel_admin');
        this.renderUserView();
        this.showNotification('Admin logged out successfully!', 'success');
    }

    refreshIcons() {
        if (typeof feather !== 'undefined') {
            setTimeout(() => feather.replace(), 100);
        }
    }

    init() {
        console.log('Initializing Halagel Helpdesk...');
        const appContainer = this.createElement('div', 'min-h-screen bg-gray-50');
        
        appContainer.appendChild(this.createHeader());
        
        const main = this.createElement('main');
        main.id = 'main-content';
        appContainer.appendChild(main);
        
        const appElement = document.getElementById('app');
        appElement.innerHTML = '';
        appElement.appendChild(appContainer);
        
        this.renderUserView();
        console.log('Halagel Helpdesk initialized successfully!');
    }
}

// Global app instance
let app;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new HalagelHelpdesk();
    });
} else {
    app = new HalagelHelpdesk();
}
