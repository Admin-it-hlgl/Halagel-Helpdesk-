// Halagel Helpdesk System - Complete app.js
// Copy this ENTIRE file and paste it as app.js

const { Clock, CheckCircle, AlertCircle, Plus, X, Lock, LogOut, Settings, Database, RefreshCw, ExternalLink } = lucide;
const { createElement: h, useState, useEffect } = React;

function HelpdeskApp() {
  const [tickets, setTickets] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  const [config, setConfig] = useState({
    password: 'admin123',
    sheetUrl: '',
    webAppUrl: ''
  });
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    email: '',
    priority: 'medium'
  });

  useEffect(() => {
    const saved = localStorage.getItem('halagel-config');
    if (saved) setConfig(JSON.parse(saved));
    
    const adminStatus = sessionStorage.getItem('halagel-admin-status');
    if (adminStatus === 'true') setIsAdmin(true);
  }, []);

  useEffect(() => {
    if (isAdmin && config.webAppUrl) loadTickets();
  }, [isAdmin, config.webAppUrl]);

  const loadTickets = async () => {
    if (!config.webAppUrl) return alert('Configure Web App URL first');
    setLoading(true);
    try {
      const res = await fetch(config.webAppUrl);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error(error);
      alert('Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (loginPassword === config.password) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginPassword('');
      sessionStorage.setItem('halagel-admin-status', 'true');
    } else {
      alert('Incorrect password!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setTickets([]);
    sessionStorage.removeItem('halagel-admin-status');
  };

  const updateSettings = () => {
    const newConfig = {
      password: document.getElementById('admin-password').value || config.password,
      sheetUrl: document.getElementById('sheet-url').value || config.sheetUrl,
      webAppUrl: document.getElementById('webapp-url').value || config.webAppUrl
    };
    if (newConfig.password.length < 6) return alert('Password must be 6+ characters');
    localStorage.setItem('halagel-config', JSON.stringify(newConfig));
    setConfig(newConfig);
    setShowSettings(false);
    alert('Settings saved!');
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.email) return alert('Fill required fields');
    if (!config.webAppUrl) return alert('System not configured');
    
    setLoading(true);
    try {
      await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ticket: { ...newTicket, status: 'waiting', createdAt: new Date().toISOString() }
        })
      });
      alert('Ticket created!');
      setNewTicket({ title: '', description: '', email: '', priority: 'medium' });
      setShowNewTicket(false);
      if (isAdmin) setTimeout(loadTickets, 2000);
    } catch (error) {
      alert('Ticket submitted!');
      setShowNewTicket(false);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, status })
      });
      setTickets(tickets.map(t => t.ID === id ? { ...t, Status: status } : t));
      setTimeout(loadTickets, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const deleteTicket = async (id) => {
    if (!isAdmin || !confirm('Delete ticket?')) return;
    setLoading(true);
    try {
      await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      setTickets(tickets.filter(t => t.ID !== id));
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (status) => tickets.filter(t => t.Status === status);

  return h('div', { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden' },
    h('div', { className: 'absolute inset-0 overflow-hidden pointer-events-none' },
      h('div', { className: 'absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse' }),
      h('div', { className: 'absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse' }),
      h('div', { className: 'absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse' })
    ),
    
    h('div', { className: 'relative z-10 container mx-auto px-4 py-8' },
      // Header
      h('div', { className: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-slate-700/50' },
        h('div', { className: 'flex items-center justify-between mb-6 flex-wrap gap-4' },
          h('div', { className: 'flex items-center gap-6' },
            h('div', { className: 'relative' },
              h('div', { className: 'absolute inset-0 bg-green-500/20 blur-xl rounded-full' }),
              h('div', { className: 'relative z-10 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-3xl' }, 'H')
            ),
            h('div', {},
              h('h1', { className: 'text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent' }, 'Halagel Helpdesk'),
              h('p', { className: 'text-slate-400 mt-1 flex items-center gap-2' },
                h(Database, { size: 16 }),
                'IT Support Portal'
              )
            )
          ),
          
          h('div', { className: 'flex gap-3 flex-wrap' },
            !isAdmin && h('button', {
              onClick: () => setShowNewTicket(true),
              className: 'bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 shadow-lg'
            }, h(Plus, { size: 20 }), 'New Ticket'),
            
            isAdmin ? [
              h('button', {
                key: 'refresh',
                onClick: loadTickets,
                disabled: loading,
                className: 'bg-slate-700 text-white px-4 py-3 rounded-xl hover:bg-slate-600 transition-all flex items-center disabled:opacity-50'
              }, h(RefreshCw, { size: 20, className: loading ? 'animate-spin' : '' })),
              
              config.sheetUrl && h('a', {
                key: 'sheet',
                href: config.sheetUrl,
                target: '_blank',
                className: 'bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center'
              }, h(ExternalLink, { size: 20 })),
              
              h('button', {
                key: 'settings',
                onClick: () => setShowSettings(true),
                className: 'bg-slate-700 text-white px-4 py-3 rounded-xl hover:bg-slate-600 transition-all flex items-center'
              }, h(Settings, { size: 20 })),
              
              h('button', {
                key: 'logout',
                onClick: handleLogout,
                className: 'bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center'
              }, h(LogOut, { size: 20 }))
            ] : h('button', {
              onClick: () => setShowLogin(true),
              className: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-3 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all flex items-center gap-2 border border-slate-600'
            }, h(Lock, { size: 20 }), 'Admin')
          )
        ),
        
        isAdmin && h('div', { className: 'mb-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl text-green-400 font-semibold flex items-center justify-between' },
          h('span', {}, '✓ Administrator Mode'),
          lastSync && h('span', { className: 'text-xs text-slate-400' }, 'Synced: ' + lastSync.toLocaleTimeString())
        ),
        
        isAdmin && h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mt-6' },
          h('div', { className: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-6 rounded-2xl border border-yellow-500/30' },
            h('div', { className: 'flex items-center gap-3 text-yellow-400 mb-2' },
              h(Clock, { size: 24 }),
              h('span', { className: 'font-semibold text-lg' }, 'Waiting')
            ),
            h('p', { className: 'text-4xl font-bold text-yellow-300' }, filterByStatus('waiting').length)
          ),
          h('div', { className: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-2xl border border-blue-500/30' },
            h('div', { className: 'flex items-center gap-3 text-blue-400 mb-2' },
              h(AlertCircle, { size: 24 }),
              h('span', { className: 'font-semibold text-lg' }, 'In Progress')
            ),
            h('p', { className: 'text-4xl font-bold text-blue-300' }, filterByStatus('doing').length)
          ),
          h('div', { className: 'bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-2xl border border-green-500/30' },
            h('div', { className: 'flex items-center gap-3 text-green-400 mb-2' },
              h(CheckCircle, { size: 24 }),
              h('span', { className: 'font-semibold text-lg' }, 'Completed')
            ),
            h('p', { className: 'text-4xl font-bold text-green-300' }, filterByStatus('done').length)
          )
        )
      ),

      // Login Modal
      showLogin && h('div', { className: 'fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4' },
        h('div', { className: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-slate-700' },
          h('button', {
            onClick: () => { setShowLogin(false); setLoginPassword(''); },
            className: 'absolute top-4 right-4 text-slate-400 hover:text-white'
          }, h(X, { size: 24 })),
          
          h('div', { className: 'flex justify-center mb-6' },
            h('div', { className: 'p-4 bg-green-500/20 rounded-2xl' },
              h(Lock, { size: 48, className: 'text-green-400' })
            )
          ),
          
          h('h2', { className: 'text-3xl font-bold text-white mb-2 text-center' }, 'Admin Access'),
          h('p', { className: 'text-slate-400 text-center mb-6' }, 'Enter your credentials'),
          
          h('div', { className: 'space-y-4' },
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Password'),
              h('input', {
                type: 'password',
                value: loginPassword,
                onChange: (e) => setLoginPassword(e.target.value),
                onKeyPress: (e) => e.key === 'Enter' && handleLogin(),
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'Enter password'
              })
            ),
            h('button', {
              onClick: handleLogin,
              className: 'w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold'
            }, 'Login')
          )
        )
      ),

      // Settings Modal
      showSettings && h('div', { className: 'fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto' },
        h('div', { className: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative border border-slate-700 my-8' },
          h('button', {
            onClick: () => setShowSettings(false),
            className: 'absolute top-4 right-4 text-slate-400 hover:text-white'
          }, h(X, { size: 24 })),
          
          h('div', { className: 'flex justify-center mb-6' },
            h('div', { className: 'p-4 bg-blue-500/20 rounded-2xl' },
              h(Settings, { size: 48, className: 'text-blue-400' })
            )
          ),
          
          h('h2', { className: 'text-3xl font-bold text-white mb-6 text-center' }, 'Configuration'),
          
          h('div', { className: 'space-y-6' },
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Admin Password'),
              h('input', {
                id: 'admin-password',
                type: 'password',
                defaultValue: config.password,
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'Min 6 characters'
              })
            ),
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Google Sheet URL'),
              h('input', {
                id: 'sheet-url',
                type: 'url',
                defaultValue: config.sheetUrl,
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'https://docs.google.com/spreadsheets/...'
              }),
              h('p', { className: 'text-xs text-slate-500 mt-2' }, 'For quick access')
            ),
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Web App URL'),
              h('input', {
                id: 'webapp-url',
                type: 'url',
                defaultValue: config.webAppUrl,
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'https://script.google.com/macros/...'
              }),
              h('p', { className: 'text-xs text-slate-500 mt-2' }, 'Your deployed script URL')
            ),
            h('button', {
              onClick: updateSettings,
              className: 'w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold'
            }, 'Save Configuration')
          )
        )
      ),

      // New Ticket Modal
      showNewTicket && h('div', { className: 'fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4' },
        h('div', { className: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative border border-slate-700' },
          h('button', {
            onClick: () => setShowNewTicket(false),
            className: 'absolute top-4 right-4 text-slate-400 hover:text-white'
          }, h(X, { size: 24 })),
          
          h('h2', { className: 'text-3xl font-bold text-white mb-6' }, 'Create New Ticket'),
          
          h('div', { className: 'space-y-4' },
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Title *'),
              h('input', {
                type: 'text',
                value: newTicket.title,
                onChange: (e) => setNewTicket({ ...newTicket, title: e.target.value }),
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'Brief description'
              })
            ),
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Description'),
              h('textarea', {
                value: newTicket.description,
                onChange: (e) => setNewTicket({ ...newTicket, description: e.target.value }),
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white h-32 resize-none',
                placeholder: 'Details'
              })
            ),
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Email *'),
              h('input', {
                type: 'email',
                value: newTicket.email,
                onChange: (e) => setNewTicket({ ...newTicket, email: e.target.value }),
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white',
                placeholder: 'your.email@example.com'
              })
            ),
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-slate-300 mb-2' }, 'Priority'),
              h('select', {
                value: newTicket.priority,
                onChange: (e) => setNewTicket({ ...newTicket, priority: e.target.value }),
                className: 'w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-white'
              },
                h('option', { value: 'low' }, 'Low'),
                h('option', { value: 'medium' }, 'Medium'),
                h('option', { value: 'high' }, 'High')
              )
            ),
            h('button', {
              onClick: createTicket,
              disabled: loading,
              className: 'w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold disabled:opacity-50'
            }, loading ? 'Creating...' : 'Create Ticket')
          )
        )
      ),

      // Tickets List
      isAdmin && h('div', { className: 'space-y-4' },
        loading && tickets.length === 0 ? h('div', { className: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-slate-700/50' },
          h(RefreshCw, { size: 64, className: 'mx-auto text-slate-600 animate-spin mb-4' }),
          h('h3', { className: 'text-xl font-semibold text-slate-400 mb-2' }, 'Loading...'),
          h('p', { className: 'text-slate-500' }, 'Fetching from Google Sheets')
        ) : tickets.length === 0 ? h('div', { className: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-slate-700/50' },
          h(AlertCircle, { size: 64, className: 'mx-auto text-slate-600 mb-4' }),
          h('h3', { className: 'text-xl font-semibold text-slate-400 mb-2' }, 'No Tickets'),
          h('p', { className: 'text-slate-500' }, 'All requests will appear here')
        ) : tickets.map(ticket =>
          h('div', {
            key: ticket.ID,
            className: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all'
          },
            h('div', { className: 'flex items-start justify-between mb-4' },
              h('div', { className: 'flex-1' },
                h('div', { className: 'flex items-center gap-3 mb-2 flex-wrap' },
                  h('span', { className: 'text-sm font-mono text-slate-500' }, '#' + ticket.ID),
                  h('span', {
                    className: `text-xs font-semibold uppercase px-3 py-1 rounded-full ${
                      ticket.Priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      ticket.Priority === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`
                  }, ticket.Priority)
                ),
                h('h3', { className: 'text-xl font-bold text-white mb-2' }, ticket.Title),
                ticket.Description && h('p', { className: 'text-slate-400 mb-3' }, ticket.Description),
                h('p', { className: 'text-sm text-slate-500' }, ticket.Email),
                h('p', { className: 'text-xs text-slate-600 mt-1' }, new Date(ticket['Created At']).toLocaleString())
              ),
              h('button', {
                onClick: () => deleteTicket(ticket.ID),
                className: 'text-slate-500 hover:text-red-400 transition-colors'
              }, h(X, { size: 20 }))
            ),
            
            h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-3' },
              h('button', {
                onClick: () => updateStatus(ticket.ID, 'waiting'),
                className: `py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                  ticket.Status === 'waiting'
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-yellow-400/50'
                }`
              }, h(Clock, { size: 16 }), 'Waiting'),
              
              h('button', {
                onClick: () => updateStatus(ticket.ID, 'doing'),
                className: `py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                  ticket.Status === 'doing'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-blue-400/50'
                }`
              }, h(AlertCircle, { size: 16 }), 'In Progress'),
              
              h('button', {
                onClick: () => updateStatus(ticket.ID, 'done'),
                className: `py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                  ticket.Status === 'done'
                    ? 'bg-green-500/20 border-green-400 text-green-300'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-green-400/50'
                }`
              }, h(CheckCircle, { size: 16 }), 'Done')
            )
          )
        )
      )
    )
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(HelpdeskApp));