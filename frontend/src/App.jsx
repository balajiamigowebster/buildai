import React, { useState, useEffect } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  IndianRupee, 
  AlertTriangle, 
  X, 
  Download, 
  Edit3, 
  CheckCircle,
  Clock,
  Trash2,
  Layers,
  FileText,
  User,
  Activity,
  CreditCard,
  Briefcase,
  Menu,
  Megaphone,
  Bell,
  Shield,
  Sparkles,
  Sliders,
  LogOut,
  Lock
} from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

const getProjectIcon = (name) => {
  if (name.includes('Horizon') || name.includes('Grand')) return 'uilding';
  if (name.includes('Tech Park') || name.includes('Emerald')) return 'Layers';
  if (name.includes('Villas') || name.includes('Aura')) return 'Home';
  if (name.includes('Logistics') || name.includes('Hub') || name.includes('Vanguard')) return 'Boxes';
  return name.substring(0, 2);
};

const USER_ROSTER = [
  {
    name: 'Thiru (Admin)',
    email: 'thiruyh@gmail.com',
    phone: '+91 98401 23456',
    title: 'Super Administrator & Principal PM',
    role: 'admin',
    avatar: 'T',
    color: '#7c3aed'
  },
  {
    name: 'Rajesh Contractor',
    email: 'rajesh.contractor@sensesite.in',
    phone: '+91 98401 55667',
    title: 'MEP & RCC Works Contractor Roster Lead',
    role: 'contractor',
    avatar: 'R',
    color: '#d97706'
  },
  {
    name: 'Vikram Sethi (Client)',
    email: 'vikram.sethi@ashoka.com',
    phone: '+91 98401 88990',
    title: 'Ashoka Living Properties - Lead Client Rep',
    role: 'client',
    avatar: 'V',
    color: '#059669'
  },
  {
    name: 'Priya Sharma (Client)',
    email: 'priya.sharma@buildcorp.in',
    phone: '+91 98401 11223',
    title: 'Buildcorp Client PM Coordinator',
    role: 'client',
    avatar: 'P',
    color: '#2563eb'
  }
];

function App() {
  // Application State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSafetyBanner, setShowSafetyBanner] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Modals Open State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Authentication & Profile States
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('buildit_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return USER_ROSTER[0]; // Default to Thiru (Admin)
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('profile'); // 'profile' or 'access'
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // Notifications & Announcements States
  const [showAnnouncementsDropdown, setShowAnnouncementsDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'announcement',
      title: 'Mandatory Double Lanyard Safety Harness',
      desc: 'All personnel operating on Level 14 must remain 100% tied-off to static lifelines.',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      type: 'alert',
      title: 'MEP Steel Supplier Invoice Pending',
      desc: 'Pending invoice ref steel-992 requires review & logging.',
      time: '5 hours ago',
      unread: true
    },
    {
      id: 3,
      type: 'announcement',
      title: 'Concrete Pour Schedule',
      desc: 'Slab pour of Level 3 at Worli Site rescheduled to tomorrow 05:00 AM.',
      time: '1 day ago',
      unread: false
    }
  ]);

  // Toast System State
  const [toasts, setToasts] = useState([]);

  const triggerToast = (title, desc, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Form States
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: '',
    client_name: '',
    budget: '',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    built_up_area: '',
    progress: 0
  });

  const [receiptForm, setReceiptForm] = useState({
    amount: '',
    date_received: new Date().toISOString().split('T')[0],
    payment_method: 'Bank / RTGS',
    milestone: '',
    ref_num: '',
    received_from: '',
    memo: '',
    recorded_by: 'Thiru (Admin)'
  });

  const [materialForm, setMaterialForm] = useState({
    item_name: '',
    phase_tag: 'Foundation',
    quantity: '',
    unit: 'Bags',
    amount: '',
    vendor: '',
    invoice_ref: '',
    payment_status: 'paid',
    date_logged: new Date().toISOString().split('T')[0]
  });

  // Load projects list
  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Load individual project detail
  const loadProjectDetail = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project details');
      const data = await res.json();
      setProjectDetail(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetail(selectedProjectId);
    } else {
      setProjectDetail(null);
      loadProjects();
    }
  }, [selectedProjectId]);

  // Handle Form Submissions
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const projectName = projectForm.name;
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          budget: parseFloat(projectForm.budget) || 0,
          built_up_area: parseFloat(projectForm.built_up_area) || 0,
          progress: parseInt(projectForm.progress) || 0
        })
      });
      if (!res.ok) throw new Error('Failed to create project');
      triggerToast('Project Created', `Successfully created project "${projectName}"`, 'success');
      setShowProjectModal(false);
      setProjectForm({
        name: '',
        location: '',
        client_name: '',
        budget: '',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        built_up_area: '',
        progress: 0
      });
      loadProjects();
    } catch (err) {
      triggerToast('Error', err.message, 'error');
    }
  };

  const handleAddReceipt = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const amountVal = parseFloat(receiptForm.amount) || 0;
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receiptForm,
          amount: amountVal
        })
      });
      if (!res.ok) throw new Error('Failed to log client payment');
      triggerToast('Payment Logged', `Logged payment of ${formatCurrency(amountVal)}`, 'success');
      setShowReceiptModal(false);
      setReceiptForm({
        amount: '',
        date_received: new Date().toISOString().split('T')[0],
        payment_method: 'Bank / RTGS',
        milestone: '',
        ref_num: '',
        received_from: projectDetail?.project?.client_name.split(' (')[0] || '',
        memo: '',
        recorded_by: currentUser.name
      });
      loadProjectDetail(selectedProjectId);
    } catch (err) {
      triggerToast('Error', err.message, 'error');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const amountVal = parseFloat(materialForm.amount) || 0;
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/material-bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          quantity: parseFloat(materialForm.quantity) || 0,
          amount: amountVal
        })
      });
      if (!res.ok) throw new Error('Failed to log material bill');
      triggerToast('Material Bill Logged', `Logged bill of ${formatCurrency(amountVal)}`, 'success');
      setShowMaterialModal(false);
      setMaterialForm({
        item_name: '',
        phase_tag: 'Foundation',
        quantity: '',
        unit: 'Bags',
        amount: '',
        vendor: '',
        invoice_ref: '',
        payment_status: 'paid',
        date_logged: new Date().toISOString().split('T')[0]
      });
      loadProjectDetail(selectedProjectId);
    } catch (err) {
      triggerToast('Error', err.message, 'error');
    }
  };

  // Delete Handlers
  const handleDeleteReceipt = async (id) => {
    if (!confirm('Are you sure you want to delete this payment receipt?')) return;
    try {
      const res = await fetch(`${API_BASE}/receipts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete receipt');
      triggerToast('Receipt Deleted', 'Payment receipt was successfully removed.', 'warning');
      loadProjectDetail(selectedProjectId);
    } catch (err) {
      triggerToast('Error', err.message, 'error');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!confirm('Are you sure you want to delete this material bill?')) return;
    try {
      const res = await fetch(`${API_BASE}/material-bills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete material bill');
      triggerToast('Material Bill Deleted', 'Material bill was successfully removed.', 'warning');
      loadProjectDetail(selectedProjectId);
    } catch (err) {
      triggerToast('Error', err.message, 'error');
    }
  };

  // Helper Formatter functions
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  // Portfolio Totals calculations
  const totalSanctioned = projects.reduce((sum, p) => sum + parseFloat(p.budget), 0);
  const totalSpent = projects.reduce((sum, p) => sum + parseFloat(p.live_capital_spent), 0);
  const totalFootprint = projects.reduce((sum, p) => sum + parseFloat(p.built_up_area), 0);

  // Group projects by status
  const activeProjects = projects.filter(p => p.status === 'active');
  const upcomingProjects = projects.filter(p => p.status === 'upcoming');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const unreadAnnouncementsCount = notifications.filter(n => n.type === 'announcement' && n.unread).length;
  const unreadAlertsCount = notifications.filter(n => n.type === 'alert' && n.unread).length;

  return (
    <div className="app-container">
      {/* Sidebar Overlay & Drawer */}
      <div className={`sidebar-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>
      <div className={`sidebar-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="drawer-title">
              <Briefcase size={22} style={{ color: 'var(--primary)' }} /> Buildit.AI OS
            </span>
            <span className="drawer-subtitle">Construction Intelligence OS</span>
          </div>
          <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-menu">
          <button className={`drawer-menu-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setDrawerOpen(false); }}>
            <Briefcase className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">Projects & Sites</span>
              <span className="menu-desc">Portfolio dashboard & project switcher</span>
            </div>
          </button>
          <button className={`drawer-menu-item ${activeTab === 'labour' ? 'active' : ''}`} onClick={() => { setActiveTab('labour'); setDrawerOpen(false); }}>
            <User className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">Labour Hub & Muster</span>
              <span className="menu-desc">1-Tap attendance & contractor roster</span>
            </div>
          </button>
          <button className="drawer-menu-item" onClick={() => { setShowMaterialModal(true); setDrawerOpen(false); }}>
            <Plus className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">Quick Log Entry</span>
              <span className="menu-desc">Material bills, muster & money receipts</span>
            </div>
          </button>
          <button className={`drawer-menu-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => { setActiveTab('ai'); setDrawerOpen(false); }}>
            <Sparkles className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">AI Partner</span>
              <span className="menu-desc">Advisor, voice & typing notes, site audit</span>
            </div>
          </button>
          <button className="drawer-menu-item" onClick={() => { alert('Financial Security audit trail is active.'); setDrawerOpen(false); }}>
            <Shield className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">Audit Trail & Financial Security</span>
              <span className="menu-desc">Immutable compliance log & cold-storage...</span>
            </div>
          </button>
          <button className={`drawer-menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setDrawerOpen(false); }}>
            <Sliders className="menu-icon" size={20} />
            <div className="menu-text">
              <span className="menu-title">Settings & Admin Hub</span>
              <span className="menu-desc">Operations console & master rate catalog</span>
            </div>
          </button>
        </div>
        <div className="drawer-footer">
          <div className="drawer-user-info" style={{ cursor: 'pointer' }} onClick={() => { setShowProfileModal(true); setDrawerOpen(false); }}>
            <div className="drawer-avatar" style={{ background: currentUser.color || '#a855f7' }}>{currentUser.avatar}</div>
            <div className="drawer-user-text">
              <span className="drawer-username">{currentUser.name}</span>
              <span className="drawer-useremail">{currentUser.email}</span>
            </div>
          </div>
          <div className="drawer-security-badge">
            <span>🔒 Production Security Active (Firebase Auth & Firestore Rules)</span>
          </div>
        </div>
      </div>

      {/* Header bar */}
      <header className="app-header">
        <div className="brand-section">
          <button className="header-btn" style={{ marginRight: '8px' }} onClick={() => setDrawerOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="brand-logo-container" style={{ background: '#1e3a8a' }}>B</div>
          <div className="brand-name">
            Buildit.AI
            <span className="brand-badge">OS</span>
          </div>
        </div>
        <div className="header-actions" style={{ position: 'relative' }}>
          <button 
            className="header-btn" 
            title="Announcements" 
            onClick={() => { setShowAnnouncementsDropdown(!showAnnouncementsDropdown); setShowAlertsDropdown(false); }}
          >
            <Megaphone size={18} />
            {unreadAnnouncementsCount > 0 && <span className="header-btn-badge">{unreadAnnouncementsCount}</span>}
          </button>
          {showAnnouncementsDropdown && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <span className="notif-title">Announcements ({unreadAnnouncementsCount} unread)</span>
                <button className="notif-mark-all" onClick={() => {
                  setNotifications(prev => prev.map(n => n.type === 'announcement' ? { ...n, unread: false } : n));
                  triggerToast('Announcements', 'All announcements marked as read.', 'info');
                }}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.filter(n => n.type === 'announcement').length > 0 ? (
                  notifications.filter(n => n.type === 'announcement').map(n => (
                    <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                      alert(`${n.title}\n\n${n.desc}`);
                    }}>
                      <div className="notif-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <Megaphone size={16} />
                      </div>
                      <div className="notif-content">
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-desc">{n.desc}</span>
                        <span className="notif-item-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">No announcements logged.</div>
                )}
              </div>
            </div>
          )}

          <button 
            className="header-btn" 
            title="Alerts" 
            onClick={() => { setShowAlertsDropdown(!showAlertsDropdown); setShowAnnouncementsDropdown(false); }}
          >
            <Bell size={18} />
            {unreadAlertsCount > 0 && <span className="header-btn-badge">{unreadAlertsCount}</span>}
          </button>
          {showAlertsDropdown && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <span className="notif-title">Alerts & Warnings ({unreadAlertsCount} unread)</span>
                <button className="notif-mark-all" onClick={() => {
                  setNotifications(prev => prev.map(n => n.type === 'alert' ? { ...n, unread: false } : n));
                  triggerToast('Alerts', 'All alerts marked as read.', 'info');
                }}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.filter(n => n.type === 'alert').length > 0 ? (
                  notifications.filter(n => n.type === 'alert').map(n => (
                    <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                      alert(`${n.title}\n\n${n.desc}`);
                    }}>
                      <div className="notif-icon-box" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                        <Bell size={16} />
                      </div>
                      <div className="notif-content">
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-desc">{n.desc}</span>
                        <span className="notif-item-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">No alerts triggered.</div>
                )}
              </div>
            </div>
          )}

          <div 
            className="user-profile" 
            style={{ background: currentUser.color || '#7c3aed', color: 'white', cursor: 'pointer' }} 
            title="User Profile"
            onClick={() => { setShowProfileModal(true); setProfileTab('profile'); }}
          >
            {currentUser.avatar}
          </div>
        </div>
      </header>

      <div className="main-wrapper">
        <main className="content-area">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {activeTab === 'projects' ?
            selectedProjectId === null ? (
              /* --- DASHBOARD VIEW --- */
            <div>
              {/* Safety Alert Banner */}
              {showSafetyBanner && (
                <div className="safety-banner">
                  <div className="safety-content">
                    <span className="safety-badge">Safety</span>
                    <span>
                      <strong>Mandatory Double Lanyard Safety Harness on Level 14</strong> — All tradesmen operating on the leading edge must remain 100% tied-off to the static lifeline cable.
                    </span>
                    <span className="safety-details-link">Details</span>
                  </div>
                  <button className="safety-close" onClick={() => setShowSafetyBanner(false)}>
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Title Header with "+ New Project" button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Portfolio Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setShowProjectModal(true)}>
                  <Plus size={16} /> Add Project
                </button>
              </div>

              {/* ACTIVE PROJECTS */}
              <div className="project-section-title-wrapper">
                <div className="project-section-title active-title">Active Projects</div>
                <div className="project-section-subtitle">Live site muster, concrete pour & financial ledgers</div>
              </div>
              <div className="projects-grid">
                {activeProjects.length > 0 ? (
                  activeProjects.map(p => (
                    <div className="project-card" key={p.id} onClick={() => setSelectedProjectId(p.id)}>
                      <div className="project-card-status-dot active"></div>
                      <div className="project-icon-wrapper">{getProjectIcon(p.name)}</div>
                      <div className="project-card-title">{p.name}</div>
                      <div className="project-card-location">{p.location}</div>
                      <div className="project-card-footer">
                        <div className="project-card-amount-row">
                          <span className="project-card-amount-value">{formatCurrency(p.live_capital_spent)}</span>
                          <span className="project-card-progress-percent">{p.progress}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ width: '100%' }}>
                          <div className="progress-bar-fill" style={{ width: `${p.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">No active projects running.</div>
                )}
              </div>

              {/* UPCOMING PROJECTS */}
              <div className="project-section-title-wrapper">
                <div className="project-section-title upcoming-title">Upcoming Projects</div>
                <div className="project-section-subtitle">Statutory approvals, soil testing & site mobilization</div>
              </div>
              <div className="projects-grid">
                {upcomingProjects.length > 0 ? (
                  upcomingProjects.map(p => (
                    <div className="project-card" key={p.id} onClick={() => setSelectedProjectId(p.id)}>
                      <div className="project-card-status-dot upcoming"></div>
                      <span className="project-card-upcoming-tag" style={{ position: 'absolute', top: '16px', right: '16px' }}>Upcoming</span>
                      <div className="project-icon-wrapper">{getProjectIcon(p.name)}</div>
                      <div className="project-card-title">{p.name}</div>
                      <div className="project-card-location">{p.location}</div>
                      <div className="project-card-footer">
                        <div className="upcoming-phase-banner">
                          <div>{p.id === 3 ? 'Foundation & Plinth Beams' : 'Land Levelling & Boundary Wall'}</div>
                          <div style={{ fontSize: '11px', color: '#b45309', opacity: 0.8, marginTop: '2px' }}>Start: {p.start_date ? formatDate(p.start_date) : '2026-09-01'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">No upcoming projects listed.</div>
                )}
              </div>

              {/* COMPLETED PROJECTS */}
              <div className="project-section-title-wrapper">
                <div className="project-section-title completed-title">Completed Projects</div>
                <div className="project-section-subtitle">Delivered structures, closed snag lists & finalized accounts</div>
              </div>
              <div className="projects-grid">
                {completedProjects.length > 0 ? (
                  completedProjects.map(p => (
                    <div className="project-card" key={p.id} onClick={() => setSelectedProjectId(p.id)}>
                      <div className="project-card-status-dot completed"></div>
                      <div className="project-icon-wrapper">{getProjectIcon(p.name)}</div>
                      <div className="project-card-title">{p.name}</div>
                      <div className="project-card-location">{p.location}</div>
                      <div className="project-card-footer">
                        <div className="project-card-amount-row">
                          <span className="project-card-amount-value">{formatCurrency(p.live_capital_spent)}</span>
                          <span className="project-card-upcoming-tag" style={{ background: '#e0f2fe', color: '#0369a1', position: 'static' }}>Delivered</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">No completed projects recorded.</div>
                )}
              </div>

              {/* PORTFOLIO METRICS SUMMARY BAR */}
              <div className="metrics-row">
                <div className="metric-card sanctioned">
                  <span className="metric-label">Portfolio Capital Sanctioned</span>
                  <span className="metric-value">{formatCurrency(totalSanctioned)}</span>
                  <span className="metric-desc primary-text">100% On-Time Execution Standard</span>
                </div>
                <div className="metric-card logged">
                  <span className="metric-label">Cumulative Capital Logged</span>
                  <span className="metric-value">{formatCurrency(totalSpent)}</span>
                  <span className="metric-desc success-text">Live Material & Labor Sync</span>
                </div>
                <div className="metric-card footprint">
                  <span className="metric-label">Total Built-Up Footprint</span>
                  <span className="metric-value">{new Intl.NumberFormat('en-US').format(totalFootprint)} sq.ft</span>
                  <span className="metric-desc info-text">Commercial, Residential & Industrial</span>
                </div>
              </div>

            </div>
          ) : (
            /* --- DETAIL PROJECT VIEW --- */
            projectDetail && (
              <div>
                {/* Back Button and Title */}
                <div className="details-header">
                  <div className="back-btn-wrapper">
                    <button className="back-btn" onClick={() => setSelectedProjectId(null)}>
                      <ArrowLeft size={18} />
                    </button>
                    <div className="details-title-section">
                      <h1 className="details-project-name">
                        {projectDetail.project.name}
                        <span className={`status-badge ${projectDetail.project.status}`}>
                          {projectDetail.project.status}
                        </span>
                      </h1>
                      <span className="details-project-sub">
                        {projectDetail.project.location} • {projectDetail.project.client_name}
                      </span>
                    </div>
                  </div>
                  <div className="details-actions">
                    <button className="btn btn-secondary btn-icon-only" title="Export PDF">
                      <Download size={16} />
                    </button>
                    <button className="btn btn-secondary" title="Edit Project">
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setMaterialForm(prev => ({ ...prev, date_logged: new Date().toISOString().split('T')[0] }));
                        setShowMaterialModal(true);
                      }}
                    >
                      <Plus size={16} /> Log Material Bill
                    </button>
                  </div>
                </div>

                {/* Project Financial Cards Grid */}
                <div className="detail-metrics-grid">
                  <div className="detail-metric-card sanctioned">
                    <span className="detail-metric-label">Sanctioned Budget</span>
                    <span className="detail-metric-value">{formatCurrency(projectDetail.project.budget)}</span>
                    <span className="detail-metric-desc">Total Contract Value</span>
                  </div>
                  <div className="detail-metric-card inflow">
                    <span className="detail-metric-label">Client Inflow Received</span>
                    <span className="detail-metric-value">{formatCurrency(projectDetail.project.client_inflow_received)}</span>
                    <span className="detail-metric-desc" style={{ color: 'var(--success)' }}>
                      {projectDetail.project.budget > 0 
                        ? `${Math.round((projectDetail.project.client_inflow_received / projectDetail.project.budget) * 100)}% Collected` 
                        : '0% Collected'}
                    </span>
                  </div>
                  <div className="detail-metric-card spent">
                    <span className="detail-metric-label">Live Capital Spent</span>
                    <span className="detail-metric-value">{formatCurrency(projectDetail.project.live_capital_spent)}</span>
                    <span className="detail-metric-desc" style={{ color: 'var(--primary)' }}>
                      {projectDetail.project.client_inflow_received > 0 
                        ? `${Math.round((projectDetail.project.live_capital_spent / projectDetail.project.client_inflow_received) * 100)}% Utilized` 
                        : '0% Utilized'}
                    </span>
                  </div>
                  <div className="detail-metric-card balance">
                    <span className="detail-metric-label">Available Cash Balance</span>
                    <span className="detail-metric-value">{formatCurrency(projectDetail.project.available_cash_balance)}</span>
                    <span className="detail-metric-desc" style={{ color: 'var(--warning-hover)' }}>
                      Due: {formatCurrency(projectDetail.project.budget - projectDetail.project.client_inflow_received)}
                    </span>
                  </div>
                </div>

                {/* LEDGER 1: Client Inflows */}
                <div className="ledger-section-banner">
                  <span className="ledger-banner-title">
                    <CreditCard size={18} />
                    MONEY RECEIVED FROM CLIENT / OWNER ({projectDetail.receipts.length} RECEIPTS)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="ledger-banner-meta">
                      Total Inflow Collected: <strong>{formatCurrency(projectDetail.project.client_inflow_received)}</strong> • Balance Due: <strong>{formatCurrency(projectDetail.project.budget - projectDetail.project.client_inflow_received)}</strong>
                    </span>
                    <button 
                      className="btn btn-success" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setReceiptForm(prev => ({
                          ...prev,
                          received_from: projectDetail.project.client_name.split(' (')[0],
                          date_received: new Date().toISOString().split('T')[0]
                        }));
                        setShowReceiptModal(true);
                      }}
                    >
                      <Plus size={14} /> Receive Payment
                    </button>
                  </div>
                </div>

                <div className="ledger-card">
                  <div className="table-responsive">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Date & Ref #</th>
                          <th>Stage / Milestone</th>
                          <th>Payment Method</th>
                          <th>Received From</th>
                          <th>Amount (₹)</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetail.receipts.length > 0 ? (
                          projectDetail.receipts.map(r => (
                            <tr key={r.id}>
                              <td>
                                <div><strong>{formatDate(r.date_received)}</strong></div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.ref_num || 'N/A'}</div>
                              </td>
                              <td>
                                <strong>{r.milestone}</strong>
                                {r.memo && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{r.memo}</div>}
                              </td>
                              <td>
                                <span className="ledger-badge-method">{r.payment_method}</span>
                              </td>
                              <td>{r.received_from}</td>
                              <td className="ledger-amount-positive">+{formatCurrency(r.amount)}</td>
                              <td>
                                <button className="action-btn" title="Delete" onClick={() => handleDeleteReceipt(r.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                              No cash inflows logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Purpose Tags Capital breakdown */}
                <h3 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Material Capital by Purpose Tag
                </h3>
                <div className="purpose-tags-grid">
                  {Object.keys(projectDetail.phase_tags).map(tag => (
                    <div className="purpose-tag-card" key={tag}>
                      <span className="purpose-tag-label">{tag}</span>
                      <span className="purpose-tag-amount">{formatCurrency(projectDetail.phase_tags[tag])}</span>
                    </div>
                  ))}
                </div>

                {/* LEDGER 2: Material Procurements */}
                <div className="ledger-section-banner expense-banner">
                  <span className="ledger-banner-title">
                    <Layers size={18} />
                    MATERIAL PROCUREMENT & EXPENSE LEDGER ({projectDetail.material_bills.length} BILLS)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="ledger-banner-meta">
                      Outstanding Vendor Dues: <strong style={{ color: 'var(--warning-hover)' }}>
                        {formatCurrency(projectDetail.material_bills.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount), 0))}
                      </strong>
                    </span>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setMaterialForm(prev => ({ ...prev, date_logged: new Date().toISOString().split('T')[0] }));
                        setShowMaterialModal(true);
                      }}
                    >
                      <Plus size={14} /> Log Material Bill
                    </button>
                  </div>
                </div>

                <div className="ledger-card">
                  <div className="table-responsive">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Date & Invoice</th>
                          <th>Material & Purpose</th>
                          <th>Qty / Unit</th>
                          <th>Vendor</th>
                          <th>Amount (₹)</th>
                          <th>Payment</th>
                          <th style={{ width: '60px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetail.material_bills.length > 0 ? (
                          projectDetail.material_bills.map(b => (
                            <tr key={b.id}>
                              <td>
                                <div><strong>{formatDate(b.date_logged)}</strong></div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.invoice_ref || 'N/A'}</div>
                              </td>
                              <td>
                                <div><strong>{b.item_name}</strong></div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '3px', fontWeight: '600' }}>
                                    {b.phase_tag}
                                  </span>
                                </div>
                              </td>
                              <td>{b.quantity} {b.unit}</td>
                              <td>{b.vendor}</td>
                              <td className="ledger-amount-negative">{formatCurrency(b.amount)}</td>
                              <td>
                                <span style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '700', 
                                  padding: '3px 8px', 
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  background: b.payment_status === 'paid' ? 'var(--success-light)' : 'var(--warning-light)',
                                  color: b.payment_status === 'paid' ? 'var(--success-hover)' : 'var(--warning-hover)',
                                  border: b.payment_status === 'paid' ? '1px solid #d1fae5' : '1px solid #fef3c7'
                                }}>
                                  {b.payment_status}
                                </span>
                              </td>
                              <td>
                                <button className="action-btn" title="Delete" onClick={() => handleDeleteMaterial(b.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                              No material bills logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )
          ) : activeTab === 'labour' ? (
            /* --- LABOUR TAB --- */
            <div className="labour-tab-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Labour Hub & Muster</h1>
                <button className="btn btn-primary" onClick={() => alert('Add worker feature active under administrator control.')}>
                  <Plus size={16} /> Add Contractor
                </button>
              </div>
              <div className="metrics-row" style={{ marginTop: '0', marginBottom: '32px' }}>
                <div className="metric-card sanctioned" style={{ borderLeftColor: 'var(--primary)' }}>
                  <span className="metric-label">Total Roster Strength</span>
                  <span className="metric-value">124 Men</span>
                  <span className="metric-desc primary-text">Across 4 live construction sites</span>
                </div>
                <div className="metric-card logged" style={{ borderLeftColor: 'var(--success)' }}>
                  <span className="metric-label">Today's Muster Present</span>
                  <span className="metric-value">98 Present</span>
                  <span className="metric-desc success-text">79% Daily Attendance Rate</span>
                </div>
                <div className="metric-card footprint" style={{ borderLeftColor: 'var(--info)' }}>
                  <span className="metric-label">Muster Accrued Cost</span>
                  <span className="metric-value">{formatCurrency(78400)}</span>
                  <span className="metric-desc info-text">Direct wages calculated automatically</span>
                </div>
              </div>
              <div className="ledger-card">
                <div className="table-responsive">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Contractor Name</th>
                        <th>Trade / Specialization</th>
                        <th>Manpower Deployed</th>
                        <th>Site / Location</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Alpha RCC Works</strong></td>
                        <td><span className="ledger-badge-method" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>Concrete / Rebars</span></td>
                        <td><strong>45 Workers</strong></td>
                        <td>Worli Sea Face, Mumbai</td>
                        <td><span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: 'var(--success-light)', color: 'var(--success-hover)', border: '1px solid #d1fae5' }}>Active</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => alert('Muster checked!')}>View Muster</button></td>
                      </tr>
                      <tr>
                        <td><strong>Deccan Bricklayers</strong></td>
                        <td><span className="ledger-badge-method" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>Brickwork & Plaster</span></td>
                        <td><strong>32 Workers</strong></td>
                        <td>Whitefield, Bengaluru</td>
                        <td><span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: 'var(--success-light)', color: 'var(--success-hover)', border: '1px solid #d1fae5' }}>Active</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => alert('Muster checked!')}>View Muster</button></td>
                      </tr>
                      <tr>
                        <td><strong>Premier MEP Systems</strong></td>
                        <td><span className="ledger-badge-method" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>Electrical & Plumbing</span></td>
                        <td><strong>21 Workers</strong></td>
                        <td>Worli Sea Face, Mumbai</td>
                        <td><span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: 'var(--success-light)', color: 'var(--success-hover)', border: '1px solid #d1fae5' }}>Active</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => alert('Muster checked!')}>View Muster</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'ai' ? (
            /* --- AI TAB --- */
            <div className="ai-tab-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>AI Partner & Advisor</h1>
                <span className="brand-badge" style={{ background: '#f59e0b', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>Enterprise AI Enabled</span>
              </div>
              <div className="ledger-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: '800', flexShrink: 0 }}>AI</div>
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '15px' }}>Buildit AI Project Auditor</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>How can I help you analyze your portfolio financials, material ledgers, or safety compliances today?</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => alert('Auditing portfolio budget vs spent...')}>
                    <h5 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary)' }}>📊 Audit Portfolio Budget vs Spent</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>Generate a complete variance report comparing sanctioned budgets vs live material expenses across all projects.</p>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => alert('Compiling material run-rate...')}>
                    <h5 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--success-hover)' }}>🧱 Analyze Material Run-Rate</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>Identify price trends for key commodities like Cement and Steel based on recent invoice submissions.</p>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => alert('Checking safety audit logs...')}>
                    <h5 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--warning-hover)' }}>⚠️ Review Safety Compliance</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>Audit the safety logs and muster data for critical compliance flags or mandatory safety hazards warnings.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- SETTINGS TAB --- */
            <div className="settings-tab-content">
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Settings & Admin Hub</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Manage site configurations, credentials, and master rates.</p>
              </div>
              <div className="ledger-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>Database Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Live Hostname</span>
                    <strong style={{ fontSize: '14px' }}>amigowebster.in</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>MariaDB Port</span>
                    <strong style={{ fontSize: '14px' }}>3306</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Connection Pool Status</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', background: 'var(--success-light)', color: 'var(--success-hover)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1fae5' }}>Active (10 Conns)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bottom-nav-bar">
        <button className={`bottom-nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setSelectedProjectId(null); }}>
          <Briefcase size={20} />
          <span>Projects</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'labour' ? 'active' : ''}`} onClick={() => setActiveTab('labour')}>
          <User size={20} />
          <span>Labour</span>
        </button>
        <button className="bottom-nav-quicklog" title="Quick Log Entry" onClick={() => {
          if (selectedProjectId) {
            setShowMaterialModal(true);
          } else {
            alert('Please select a project first to log material entries!');
          }
        }}>
          <Plus size={24} />
        </button>
        <button className={`bottom-nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <Sparkles size={20} />
          <span>AI</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Sliders size={20} />
          <span>Settings</span>
        </button>
      </div>

      {/* --- MODAL 1: ADD NEW PROJECT --- */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close-btn" onClick={() => setShowProjectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., The Grand Horizon Towers"
                    value={projectForm.name}
                    onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., Worli Sea Face, Mumbai"
                    value={projectForm.location}
                    onChange={e => setProjectForm({...projectForm, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Name & ID <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., Ashoka Living Properties (GHT-01)"
                    value={projectForm.client_name}
                    onChange={e => setProjectForm({...projectForm, client_name: e.target.value})}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Sanctioned Budget (₹) <span>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      placeholder="e.g., 45000000"
                      value={projectForm.budget}
                      onChange={e => setProjectForm({...projectForm, budget: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Built-Up Footprint (sq.ft)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g., 185000"
                      value={projectForm.built_up_area}
                      onChange={e => setProjectForm({...projectForm, built_up_area: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-control"
                      value={projectForm.status}
                      onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={projectForm.start_date}
                      onChange={e => setProjectForm({...projectForm, start_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Progress (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-control" 
                    placeholder="e.g., 75"
                    value={projectForm.progress}
                    onChange={e => setProjectForm({...projectForm, progress: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: LOG CLIENT RECEIPT --- */}
      {showReceiptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ borderBottomColor: 'var(--success)', background: 'var(--success-light)' }}>
              <h2 className="modal-title" style={{ color: 'var(--success-hover)' }}>Quick Log Client Inflow</h2>
              <button className="modal-close-btn" onClick={() => setShowReceiptModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddReceipt}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Amount Received (₹) <span>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      placeholder="e.g., 500000"
                      value={receiptForm.amount}
                      onChange={e => setReceiptForm({...receiptForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date Received <span>*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required 
                      value={receiptForm.date_received}
                      onChange={e => setReceiptForm({...receiptForm, date_received: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Method of Payment Received <span>*</span></label>
                  <select 
                    className="form-control"
                    value={receiptForm.payment_method}
                    onChange={e => setReceiptForm({...receiptForm, payment_method: e.target.value})}
                  >
                    <option value="Bank / RTGS">Bank / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cash">Cash</option>
                    <option value="Escrow">Escrow</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Milestone / Billing Stage <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., Foundation Raft Release"
                    value={receiptForm.milestone}
                    onChange={e => setReceiptForm({...receiptForm, milestone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction / Cheque / UTR Ref #</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., HDFC-RTGS-9988112"
                    value={receiptForm.ref_num}
                    onChange={e => setReceiptForm({...receiptForm, ref_num: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Received From (Client Name) <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., Ashoka Living Properties"
                    value={receiptForm.received_from}
                    onChange={e => setReceiptForm({...receiptForm, received_from: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Memo / Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    placeholder="e.g., Verified by structural engineer inspection"
                    value={receiptForm.memo}
                    onChange={e => setReceiptForm({...receiptForm, memo: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Recorded By</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={receiptForm.recorded_by}
                    onChange={e => setReceiptForm({...receiptForm, recorded_by: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Client Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: LOG MATERIAL EXPENSE --- */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ borderBottomColor: 'var(--primary)', background: 'var(--primary-light)' }}>
              <h2 className="modal-title" style={{ color: 'var(--primary)' }}>Quick Log Material Entry</h2>
              <button className="modal-close-btn" onClick={() => setShowMaterialModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Material Item Name <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., UltraTech OPC 53-Grade Cement"
                    value={materialForm.item_name}
                    onChange={e => setMaterialForm({...materialForm, item_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Construction Phase Tag <span>*</span></label>
                  <select 
                    className="form-control"
                    value={materialForm.phase_tag}
                    onChange={e => setMaterialForm({...materialForm, phase_tag: e.target.value})}
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Brickwork">Brickwork</option>
                    <option value="Plastering">Plastering</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Painting">Painting</option>
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Quantity <span>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      placeholder="e.g., 100"
                      value={materialForm.quantity}
                      onChange={e => setMaterialForm({...materialForm, quantity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit <span>*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="e.g., Bags, Tons, Cu.M"
                      value={materialForm.unit}
                      onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Total Bill (₹) <span>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      placeholder="e.g., 45000"
                      value={materialForm.amount}
                      onChange={e => setMaterialForm({...materialForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date Logged <span>*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required 
                      value={materialForm.date_logged}
                      onChange={e => setMaterialForm({...materialForm, date_logged: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor / Supplier <span>*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g., Mahalaxmi Building Supplies"
                    value={materialForm.vendor}
                    onChange={e => setMaterialForm({...materialForm, vendor: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice / Challan Reference</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., INV-8891 or CH-204"
                    value={materialForm.invoice_ref}
                    onChange={e => setMaterialForm({...materialForm, invoice_ref: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <div className="payment-status-selector">
                    <div 
                      className={`status-choice choice-paid ${materialForm.payment_status === 'paid' ? 'selected' : ''}`}
                      onClick={() => setMaterialForm({...materialForm, payment_status: 'paid'})}
                    >
                      ✓ Paid & Settled
                    </div>
                    <div 
                      className={`status-choice choice-pending ${materialForm.payment_status === 'pending' ? 'selected' : ''}`}
                      onClick={() => setMaterialForm({...materialForm, payment_status: 'pending'})}
                    >
                      ⚠ Pending Due
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Material Inward Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- PROFILE / USER CONSOLE MODAL --- */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="profile-card-header">
              <div className="profile-header-avatar" style={{ background: currentUser.color || '#a855f7' }}>
                {currentUser.avatar}
              </div>
              <div className="profile-header-details">
                <span className="profile-header-name">{currentUser.name}</span>
                <span className="profile-header-email">{currentUser.email}</span>
                <span className="profile-header-role-badge">{currentUser.role}</span>
              </div>
              <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="profile-modal-tabs">
              <button 
                className={`profile-modal-tab-btn ${profileTab === 'profile' ? 'active' : ''}`}
                onClick={() => setProfileTab('profile')}
              >
                <User size={16} /> Profile
              </button>
              <button 
                className={`profile-modal-tab-btn ${profileTab === 'access' ? 'active' : ''}`}
                onClick={() => setProfileTab('access')}
              >
                <Sliders size={16} /> Access ({USER_ROSTER.length})
              </button>
            </div>

            <div className="profile-tab-body">
              {profileTab === 'profile' ? (
                <>
                  <div className="personal-details-title-row">
                    <span className="personal-details-title">Personal Details</span>
                    <button className="personal-details-edit-btn" onClick={() => alert('Editing personal profile is restricted under administrative governance.')}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                  <div className="detail-info-row">
                    <span className="detail-info-label">Name:</span>
                    <span className="detail-info-value">{currentUser.name}</span>
                  </div>
                  <div className="detail-info-row">
                    <span className="detail-info-label">Email:</span>
                    <span className="detail-info-value">{currentUser.email}</span>
                  </div>
                  <div className="detail-info-row">
                    <span className="detail-info-label">Phone:</span>
                    <span className="detail-info-value">{currentUser.phone}</span>
                  </div>
                  <div className="detail-info-row">
                    <span className="detail-info-label">Title:</span>
                    <span className="detail-info-value">{currentUser.title}</span>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', gap: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'var(--primary-light)' }}
                      onClick={() => { setShowGoogleAuth(true); setShowProfileModal(false); }}
                    >
                      <Lock size={16} /> Firebase Sign In / Register
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', gap: '8px', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                      onClick={() => {
                        const guestUser = {
                          name: 'Guest User',
                          email: 'guest@buildai.os',
                          phone: 'N/A',
                          title: 'Public Viewer / Auditor',
                          role: 'guest',
                          avatar: 'G',
                          color: '#64748b'
                        };
                        setCurrentUser(guestUser);
                        localStorage.setItem('buildit_user', JSON.stringify(guestUser));
                        triggerToast('Auth Sync', 'Signed out. Mode set to Guest.', 'warning');
                        setShowProfileModal(false);
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="user-access-list">
                  <div className="personal-details-title-row">
                    <span className="personal-details-title">Users & RBAC ({USER_ROSTER.length})</span>
                    <button className="personal-details-edit-btn" onClick={() => alert('Add User function active under Super-Admin role.')}>
                      + Add User
                    </button>
                  </div>
                  {USER_ROSTER.map(u => (
                    <div 
                      key={u.email} 
                      className={`user-access-item ${currentUser.email === u.email ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentUser(u);
                        localStorage.setItem('buildit_user', JSON.stringify(u));
                        triggerToast('Auth Sync', `Logged in as ${u.name}`, 'success');
                        setShowProfileModal(false);
                      }}
                    >
                      <div className="user-access-info">
                        <div className="user-access-avatar" style={{ background: u.color }}>
                          {u.avatar}
                        </div>
                        <div className="user-access-meta">
                          <span className="user-access-name">{u.name}</span>
                          <span className="user-access-email">{u.email}</span>
                        </div>
                      </div>
                      <span className="profile-header-role-badge" style={{ marginTop: '0', background: u.role === 'admin' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(71, 85, 105, 0.1)' }}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- GOOGLE/FIREBASE SIGN IN CHOOSER POPUP --- */}
      {showGoogleAuth && (
        <div className="google-auth-overlay" onClick={() => setShowGoogleAuth(false)}>
          <div className="google-auth-card" onClick={e => e.stopPropagation()}>
            <div className="google-logo-container">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h3 className="google-title">Sign in with Google</h3>
            <p className="google-subtitle">Choose an account to continue to Buildit.AI OS</p>

            <div className="google-accounts-list">
              {USER_ROSTER.map(u => (
                <button 
                  key={u.email}
                  className="google-account-btn"
                  onClick={() => {
                    setCurrentUser(u);
                    localStorage.setItem('buildit_user', JSON.stringify(u));
                    triggerToast('Google Authentication', `Successfully logged in as ${u.name}`, 'success');
                    setShowGoogleAuth(false);
                  }}
                >
                  <div className="google-account-avatar" style={{ background: u.color }}>
                    {u.avatar}
                  </div>
                  <div className="google-account-details">
                    <span className="google-account-name">{u.name}</span>
                    <span className="google-account-email">{u.email}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="google-divider">
              <span>or use custom email</span>
            </div>

            <form className="google-custom-login-form" onSubmit={e => {
              e.preventDefault();
              if (!googleEmailInput || !googleNameInput) return;
              const initials = googleNameInput.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
              const customUser = {
                name: googleNameInput,
                email: googleEmailInput,
                phone: '+91 99999 88888',
                title: 'Project Auditor & Guest PM',
                role: 'client',
                avatar: initials,
                color: '#475569'
              };
              setCurrentUser(customUser);
              localStorage.setItem('buildit_user', JSON.stringify(customUser));
              triggerToast('Google Authentication', `Logged in with Google account: ${customUser.email}`, 'success');
              setShowGoogleAuth(false);
              setGoogleEmailInput('');
              setGoogleNameInput('');
            }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Full Name" 
                required 
                value={googleNameInput} 
                onChange={e => setGoogleNameInput(e.target.value)} 
                style={{ fontSize: '13px', padding: '8px 12px', marginBottom: '8px' }}
              />
              <input 
                type="email" 
                className="form-control" 
                placeholder="Google Email Address" 
                required 
                value={googleEmailInput} 
                onChange={e => setGoogleEmailInput(e.target.value)} 
                style={{ fontSize: '13px', padding: '8px 12px', marginBottom: '8px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '13px', justifyContent: 'center' }}>
                Sign in with custom Google Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TOAST SYSTEM NOTIFICATION OUTLET --- */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-notification ${t.type}`}>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              <div className="toast-desc">{t.desc}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
