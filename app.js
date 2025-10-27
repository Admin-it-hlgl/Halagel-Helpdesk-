// Use React from global scope
const { createElement: h, useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Configuration and Storage Management
const CONFIG_KEY = 'halagel_config';
const ERROR_LOG_KEY = 'halagel_errors';

// Error Logger
class ErrorLogger {
  static log(error, context = '') {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || String(error),
      stack: error.stack || 'No stack trace',
      url: window.location.href
    };
    
    console.error('Error logged:', errorLog);
    
    try {
      const logs = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
      logs.push(errorLog);
      if (logs.length > 50) logs.shift();
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Could not save error log:', e);
    }
    
    return errorLog;
  }

  static getAll() {
    try {
      return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  static clear() {
    localStorage.removeItem(ERROR_LOG_KEY);
  }
}

// Configuration Manager
class ConfigManager {
  static get() {
    try {
      const config = localStorage.getItem(CONFIG_KEY);
      if (!config) {
        console.warn('No configuration found, using defaults');
        return this.getDefaults();
      }
      return JSON.parse(config);
    } catch (error) {
      ErrorLogger.log(error, 'ConfigManager.get');
      return this.getDefaults();
    }
  }

  static set(config) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      ErrorLogger.log(error, 'ConfigManager.set');
      return false;
    }
  }

  static getDefaults() {
    return {
      adminPassword: 'admin123',
      sheetUrl: '',
      webAppUrl: ''
    };
  }

  static validate(config) {
    const errors = [];
    
    if (!config.adminPassword || config.adminPassword.length < 6) {
      errors.push('Admin password must be at least 6 characters');
    }
    
    if (config.sheetUrl && !config.sheetUrl.includes('docs.google.com/spreadsheets')) {
      errors.push('Invalid Google Sheet URL format');
    }
    
    if (config.webAppUrl && !config.webAppUrl.includes('script.google.com')) {
      errors.push('Invalid Web App URL format');
    }
    
    return errors;
  }
}

// API Manager with Error Handling
class APIManager {
  static async fetchTickets() {
    const config = ConfigManager.get();
    
    if (!config.webAppUrl) {
      throw new Error('Web App URL not configured. Please configure in Settings.');
    }

    try {
      const response = await fetch(config.webAppUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      return data.tickets || [];
    } catch (error) {
      ErrorLogger.log(error, 'APIManager.fetchTickets');
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Google Sheets. Check your internet connection and Web App URL.');
      }
      
      throw error;
    }
  }

  static async createTicket(ticket) {
    const config = ConfigManager.get();
    
    if (!config.webAppUrl) {
      throw new Error('Web App URL not configured');
    }

    try {
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ticket: {
            ...ticket,
            createdAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      return data;
    } catch (error) {
      ErrorLogger.log(error, 'APIManager.createTicket');
      throw error;
    }
  }

  static async updateTicket(id, status) {
    const config = ConfigManager.get();
    
    if (!config.webAppUrl) {
      throw new Error('Web App URL not configured');
    }

    try {
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          status
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update ticket');
      }

      return data;
    } catch (error) {
      ErrorLogger.log(error, 'APIManager.updateTicket');
      throw error;
    }
  }

  static async deleteTicket(id) {
    const config = ConfigManager.get();
    
    if (!config.webAppUrl) {
      throw new Error('Web App URL not configured');
    }

    try {
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete ticket');
      }

      return data;
    } catch (error) {
      ErrorLogger.log(error, 'APIManager.deleteTicket');
      throw error;
    }
  }
}

// Main App Component
function App() {
  const [view, setView] = useState('home');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedTickets = await APIManager.fetchTickets();
      setTickets(fetchedTickets);
      setSuccess('Tickets loaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    setLoading(true);
    setError(null);
    
    try {
      await APIManager.createTicket(ticketData);
      setSuccess('Ticket created successfully! Check your email for confirmation.');
      setView('home');
      if (isAdmin) {
        await loadTickets();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    
    try {
      await APIManager.updateTicket(id, status);
      setSuccess('Ticket status updated!');
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await APIManager.deleteTicket(id);
      setSuccess('Ticket deleted successfully!');
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (password) => {
    const config = ConfigManager.get();
    if (password === config.adminPassword) {
      setIsAdmin(true);
      setView('admin');
      setSuccess('Admin login successful!');
      loadTickets();
    } else {
      setError('Invalid admin password!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('home');
    setTickets([]);
    setSuccess('Logged out successfully!');
  };

  const handleSaveConfig = (newConfig) => {
    const errors = ConfigManager.validate(newConfig);
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }
    
    const saved = ConfigManager.set(newConfig);
    
    if (saved) {
      setSuccess('Configuration saved successfully!');
      setView(isAdmin ? 'admin' : 'home');
    } else {
      setError('Failed to save configuration. Check browser storage.');
    }
  };

  return h('div', { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' },
    // Header
    h('header', { className: 'bg-slate-900/50 backdrop-blur-sm border-b border-emerald-500/20' },
      h('div', { className: 'container mx-auto px-4 py-4' },
        h('div', { className: 'flex items-center justify-between' },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center' },
              h('span', { className: 'text-white font-bold text-xl' }, 'H')
            ),
            h('div', null,
              h('h1', { className: 'text-2xl font-bold text-white' }, 'Halagel Helpdesk'),
              h('p', { className: 'text-emerald-400 text-sm' }, 'IT Support System')
            )
          ),
          h('div', { className: 'flex items-center gap-2' },
            isAdmin && h('button', {
              onClick: () => setView('settings'),
              className: 'p-2 text-slate-400 hover:text-emerald-400 transition-colors'
            }, '⚙️'),
            isAdmin && h('button', {
              onClick: loadTickets,
              className: 'p-2 text-slate-400 hover:text-emerald-400 transition-colors',
              disabled: loading
            }, '🔄'),
            isAdmin && h('button', {
              onClick: handleLogout,
              className: 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors'
            }, 'Logout')
          )
        )
      )
    ),

    // Alert Messages
    (error || success) && h('div', { className: 'container mx-auto px-4 py-4' },
      error && h('div', { className: 'bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4' },
        h('div', { className: 'flex items-start gap-2' },
          h('span', null, '❌'),
          h('div', { className: 'flex-1' },
            h('p', { className: 'font-semibold' }, 'Error'),
            h('p', { className: 'text-sm mt-1' }, error)
          )
        )
      ),
      success && h('div', { className: 'bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-4 py-3 rounded-lg mb-4' },
        h('div', { className: 'flex items-start gap-2' },
          h('span', null, '✅'),
          h('div', { className: 'flex-1' },
            h('p', { className: 'font-semibold' }, 'Success'),
            h('p', { className: 'text-sm mt-1' }, success)
          )
        )
      )
    ),

    // Loading Overlay
    loading && h('div', { className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50' },
      h('div', { className: 'bg-slate-800 rounded-lg p-8 text-center' },
        h('div', { className: 'animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4' }),
        h('p', { className: 'text-white' }, 'Loading...')
      )
    ),

    // Main Content
    h('main', { className: 'container mx-auto px-4 py-8' },
      view === 'home' && h(HomeView, { onCreateTicket: () => setView('create'), onAdminLogin: () => setView('login') }),
      view === 'create' && h(CreateTicketView, { onSubmit: handleCreateTicket, onCancel: () => setView('home') }),
      view === 'login' && h(LoginView, { onLogin: handleAdminLogin, onCancel: () => setView('home') }),
      view === 'admin' && h(AdminView, { 
        tickets, 
        onUpdateStatus: handleUpdateStatus, 
        onDelete: handleDeleteTicket,
        onRefresh: loadTickets 
      }),
      view === 'settings' && h(SettingsView, { onSave: handleSaveConfig, onCancel: () => setView(isAdmin ? 'admin' : 'home') })
    )
  );
}

// Home View Component
function HomeView({ onCreateTicket, onAdminLogin }) {
  return h('div', { className: 'max-w-4xl mx-auto' },
    h('div', { className: 'text-center mb-12' },
      h('h2', { className: 'text-4xl font-bold text-white mb-4' }, 'Welcome to Halagel Helpdesk'),
      h('p', { className: 'text-slate-400 text-lg' }, 'Submit a support ticket or login as admin')
    ),
    h('div', { className: 'grid md:grid-cols-2 gap-6' },
      h('button', {
        onClick: onCreateTicket,
        className: 'group bg-slate-800 hover:bg-emerald-500/10 border-2 border-slate-700 hover:border-emerald-500 rounded-xl p-8 transition-all'
      },
        h('div', { className: 'text-5xl mb-4' }, '🎫'),
        h('h3', { className: 'text-2xl font-bold text-white mb-2' }, 'Create Ticket'),
        h('p', { className: 'text-slate-400' }, 'Submit a new support request')
      ),
      h('button', {
        onClick: onAdminLogin,
        className: 'group bg-slate-800 hover:bg-emerald-500/10 border-2 border-slate-700 hover:border-emerald-500 rounded-xl p-8 transition-all'
      },
        h('div', { className: 'text-5xl mb-4' }, '🔐'),
        h('h3', { className: 'text-2xl font-bold text-white mb-2' }, 'Admin Login'),
        h('p', { className: 'text-slate-400' }, 'Manage support tickets')
      )
    )
  );
}

// Create Ticket View
function CreateTicketView({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    priority: 'medium',
    status: 'pending'
  });

  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return h('div', { className: 'max-w-2xl mx-auto' },
    h('div', { className: 'bg-slate-800 rounded-xl p-8' },
      h('h2', { className: 'text-3xl font-bold text-white mb-6' }, 'Create Support Ticket'),
      h('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Title *'),
          h('input', {
            type: 'text',
            value: formData.title,
            onChange: (e) => setFormData({...formData, title: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'Brief description of your issue'
          }),
          validationErrors.title && h('p', { className: 'text-red-400 text-sm mt-1' }, validationErrors.title)
        ),
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Description *'),
          h('textarea', {
            value: formData.description,
            onChange: (e) => setFormData({...formData, description: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            rows: 5,
            placeholder: 'Detailed description of your issue'
          }),
          validationErrors.description && h('p', { className: 'text-red-400 text-sm mt-1' }, validationErrors.description)
        ),
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Email *'),
          h('input', {
            type: 'email',
            value: formData.email,
            onChange: (e) => setFormData({...formData, email: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'your.email@example.com'
          }),
          validationErrors.email && h('p', { className: 'text-red-400 text-sm mt-1' }, validationErrors.email)
        ),
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Priority'),
          h('select', {
            value: formData.priority,
            onChange: (e) => setFormData({...formData, priority: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none'
          },
            h('option', { value: 'low' }, 'Low'),
            h('option', { value: 'medium' }, 'Medium'),
            h('option', { value: 'high' }, 'High')
          )
        ),
        h('div', { className: 'flex gap-4' },
          h('button', {
            type: 'submit',
            className: 'flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Submit Ticket'),
          h('button', {
            type: 'button',
            onClick: onCancel,
            className: 'px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Cancel')
        )
      )
    )
  );
}

// Initialize and render the app
try {
  const root = createRoot(document.getElementById('root'));
  root.render(h(App));
  console.log('App rendered successfully!');
} catch (error) {
  console.error('Failed to render app:', error);
  ErrorLogger.log(error, 'App.render');
  document.getElementById('root').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); color: white; font-family: system-ui;">
      <div style="text-align: center; max-width: 500px; padding: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Error Loading App</h1>
        <p style="color: #94a3b8; margin-bottom: 1rem;">${error.message}</p>
        <button onclick="location.reload()" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}bg-slate-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Cancel')
        )
      )
    )
  );
}

// Login View
function LoginView({ onLogin, onCancel }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
    setPassword('');
  };

  return h('div', { className: 'max-w-md mx-auto' },
    h('div', { className: 'bg-slate-800 rounded-xl p-8' },
      h('h2', { className: 'text-3xl font-bold text-white mb-6' }, 'Admin Login'),
      h('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Password'),
          h('input', {
            type: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'Enter admin password'
          })
        ),
        h('div', { className: 'flex gap-4' },
          h('button', {
            type: 'submit',
            className: 'flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Login'),
          h('button', {
            type: 'button',
            onClick: onCancel,
            className: 'px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Cancel')
        )
      )
    )
  );
}

// Admin View
function AdminView({ tickets, onUpdateStatus, onDelete, onRefresh }) {
  const [filter, setFilter] = useState('all');

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.Status === filter);

  return h('div', null,
    h('div', { className: 'flex justify-between items-center mb-6' },
      h('h2', { className: 'text-3xl font-bold text-white' }, 'Ticket Management'),
      h('button', {
        onClick: onRefresh,
        className: 'px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors'
      }, '🔄 Refresh')
    ),
    h('div', { className: 'flex gap-2 mb-6' },
      ['all', 'pending', 'in-progress', 'done'].map(status =>
        h('button', {
          key: status,
          onClick: () => setFilter(status),
          className: `px-4 py-2 rounded-lg transition-colors ${filter === status ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`
        }, status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '))
      )
    ),
    filteredTickets.length === 0 
      ? h('div', { className: 'text-center py-12 bg-slate-800 rounded-xl' },
          h('p', { className: 'text-slate-400 text-lg' }, 'No tickets found')
        )
      : h('div', { className: 'grid gap-4' },
          filteredTickets.map(ticket =>
            h('div', { key: ticket.ID, className: 'bg-slate-800 rounded-lg p-6' },
              h('div', { className: 'flex justify-between items-start mb-4' },
                h('div', null,
                  h('h3', { className: 'text-xl font-bold text-white mb-2' }, ticket.Title),
                  h('p', { className: 'text-slate-400' }, ticket.Description)
                ),
                h('span', { 
                  className: `px-3 py-1 rounded-full text-sm ${
                    ticket.Priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    ticket.Priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`
                }, ticket.Priority)
              ),
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'text-sm text-slate-400' },
                  h('p', null, 'Email: ', ticket.Email),
                  h('p', null, 'ID: ', ticket.ID)
                ),
                h('div', { className: 'flex gap-2' },
                  h('select', {
                    value: ticket.Status,
                    onChange: (e) => onUpdateStatus(ticket.ID, e.target.value),
                    className: 'px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm'
                  },
                    h('option', { value: 'pending' }, 'Pending'),
                    h('option', { value: 'in-progress' }, 'In Progress'),
                    h('option', { value: 'done' }, 'Done')
                  ),
                  h('button', {
                    onClick: () => onDelete(ticket.ID),
                    className: 'px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors'
                  }, '🗑️')
                )
              )
            )
          )
        )
  );
}

// Settings View
function SettingsView({ onSave, onCancel }) {
  const [config, setConfig] = useState(ConfigManager.get());

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(config);
  };

  return h('div', { className: 'max-w-2xl mx-auto' },
    h('div', { className: 'bg-slate-800 rounded-xl p-8' },
      h('h2', { className: 'text-3xl font-bold text-white mb-6' }, 'Settings'),
      h('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Admin Password'),
          h('input', {
            type: 'password',
            value: config.adminPassword,
            onChange: (e) => setConfig({...config, adminPassword: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'Enter new admin password (min 6 characters)'
          })
        ),
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Google Sheet URL'),
          h('input', {
            type: 'url',
            value: config.sheetUrl,
            onChange: (e) => setConfig({...config, sheetUrl: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'https://docs.google.com/spreadsheets/d/...'
          })
        ),
        h('div', null,
          h('label', { className: 'block text-slate-300 mb-2' }, 'Web App URL'),
          h('input', {
            type: 'url',
            value: config.webAppUrl,
            onChange: (e) => setConfig({...config, webAppUrl: e.target.value}),
            className: 'w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none',
            placeholder: 'https://script.google.com/macros/s/.../exec'
          })
        ),
        h('div', { className: 'flex gap-4' },
          h('button', {
            type: 'submit',
            className: 'flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors'
          }, 'Save Configuration'),
          h('button', {
            type: 'button',
            onClick: onCancel,
            className: 'px-6 py-3 bg-slate-700 hover:
