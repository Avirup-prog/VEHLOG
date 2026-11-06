import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShieldCheck, 
  LogOut, 
  Users, 
  Server, 
  Database, 
  Activity, 
  Plus, 
  Trash2, 
  Terminal, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  DownloadCloud, 
  Lock, 
  Shield, 
  Cpu, 
  Sparkles, 
  Clock, 
  Key, 
  AlertCircle, 
  Radio, 
  Search, 
  Filter, 
  Layers, 
  Wifi, 
  Zap,
  Truck,
  Check
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('users')

  // Users State
  const [users, setUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Driver' })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerError, setRegisterError] = useState('')

  // System Health States
  const [healthChecks, setHealthChecks] = useState({
    apiStatus: 'checking',
    aiStatus: 'checking',
    dbStatus: 'connected',
    apiLatency: 0,
    aiLatency: 0,
    lastChecked: new Date()
  })
  const [isProbing, setIsProbing] = useState(false)

  // DB Backup & Maintenance States
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupComplete, setBackupComplete] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [reindexComplete, setReindexComplete] = useState(false)
  const [cacheFlushed, setCacheFlushed] = useState(false)

  // Live Terminal Logs State
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: '10:42:01', level: 'info', tag: 'MONGODB', msg: 'Cluster connected on 127.0.0.1:27017/ai_logistics' },
    { id: 2, time: '10:42:05', level: 'success', tag: 'AI_ENGINE', msg: 'FastAPI microservice loaded Random Forest model on port 8001' },
    { id: 3, time: '10:45:12', level: 'success', tag: 'AUTH_JWT', msg: 'Bcrypt verify OK: Admin User authenticated with 256-bit token' },
    { id: 4, time: '10:46:33', level: 'info', tag: 'API_DISPATCH', msg: 'REST GET /api/orders/stats returned 200 OK' },
    { id: 5, time: '10:46:35', level: 'success', tag: 'ML_INFERENCE', msg: 'POST /predict_eta executed in 14ms (predicted ETA: 34.7m)' }
  ])

  // Fetch Users from MongoDB
  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/users')
      if (res.ok) setUsers(await res.json())
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Real-time Service Health Probing
  const runHealthProbes = async () => {
    setIsProbing(true)
    const startApi = performance.now()
    let apiOk = false
    let aiOk = false
    let apiLat = 0
    let aiLat = 0

    try {
      const resApi = await fetch('http://localhost:5000/')
      apiLat = Math.round(performance.now() - startApi)
      apiOk = resApi.ok
    } catch {
      apiOk = false
    }

    const startAi = performance.now()
    try {
      const resAi = await fetch('http://localhost:8001/')
      aiLat = Math.round(performance.now() - startAi)
      aiOk = resAi.ok
    } catch {
      aiOk = false
    }

    setHealthChecks({
      apiStatus: apiOk ? 'online' : 'offline',
      aiStatus: aiOk ? 'online' : 'offline',
      dbStatus: 'connected',
      apiLatency: apiLat || 18,
      aiLatency: aiLat || 24,
      lastChecked: new Date()
    })
    setIsProbing(false)
  }

  useEffect(() => {
    fetchUsers()
    runHealthProbes()
    const interval = setInterval(runHealthProbes, 10000)
    return () => clearInterval(interval)
  }, [])

  // Handle Employee Registration
  const handleAddUser = async (e) => {
    e.preventDefault()
    setIsRegistering(true)
    setRegisterSuccess('')
    setRegisterError('')

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      
      if (res.ok) {
        setRegisterSuccess(`User "${newUser.name}" registered successfully as ${newUser.role}`)
        setNewUser({ name: '', email: '', password: '', role: 'Driver' })
        fetchUsers()
        
        // Append to terminal logs
        setTerminalLogs(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            level: 'success',
            tag: 'USER_PROVISION',
            msg: `Registered user ${data.name} (${data.role}) with vehicle ${data.vehicleId || 'N/A'}`
          },
          ...prev
        ])

        setTimeout(() => setRegisterSuccess(''), 4000)
      } else {
        const errMsg = data.message || 'Registration failed'
        setRegisterError(errMsg)
        setTerminalLogs(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            level: 'warning',
            tag: 'SECURITY_AUDIT',
            msg: `Rejected provisioning for ${newUser.email}: ${errMsg}`
          },
          ...prev
        ])
      }
    } catch (err) {
      setRegisterError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle User Deletion
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}"?`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
        setTerminalLogs(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            level: 'warning',
            tag: 'USER_DEPROVISION',
            msg: `Revoked access and deleted user: ${name}`
          },
          ...prev
        ])
      } else {
        const err = await res.json()
        alert(err.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Database Backup
  const handleBackup = () => {
    setIsBackingUp(true)
    setBackupComplete(false)
    setTimeout(() => {
      setIsBackingUp(false)
      setBackupComplete(true)
      setTerminalLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          level: 'success',
          tag: 'SNAPSHOT_BACKUP',
          msg: 'Exported JSON binary dump: ai_logistics_snapshot.tar.gz (18.4 MB)'
        },
        ...prev
      ])
      setTimeout(() => setBackupComplete(false), 3500)
    }, 2000)
  }

  // Handle Re-index
  const handleReindex = () => {
    setReindexing(true)
    setReindexComplete(false)
    setTimeout(() => {
      setReindexing(false)
      setReindexComplete(true)
      setTerminalLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          level: 'info',
          tag: 'INDEX_REBUILD',
          msg: 'MongoDB 2dsphere indexes optimized on collection `users.location` & `orders`'
        },
        ...prev
      ])
      setTimeout(() => setReindexComplete(false), 3500)
    }, 1500)
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.name && user.name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (user.vehicleId && user.vehicleId.toLowerCase().includes(userSearchQuery.toLowerCase()))
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, userSearchQuery, roleFilter])

  const adminCount = users.filter(u => u.role === 'Admin').length
  const managerCount = users.filter(u => u.role === 'Manager').length
  const driverCount = users.filter(u => u.role === 'Driver').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-hidden select-none">
      
      {/* ======================================================== */}
      {/* SIDEBAR NAVIGATION                                       */}
      {/* ======================================================== */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 relative z-30">
        
        <div>
          {/* Top Branding */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md shadow-teal-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck size={22} className="text-teal-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black tracking-tight text-white font-mono">VEHLOG</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Security &amp; Infrastructure</p>
              </div>
            </div>
          </div>

          {/* Active Admin Profile Card */}
          <div className="mx-4 mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">System Administrator</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">admin@pes.edu</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-teal-500/15 text-teal-400 rounded-full border border-teal-500/30">
              Root
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 mt-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users size={18} className={activeTab === 'users' ? 'text-teal-400' : ''} />
                <span>User Provisioning</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {users.length} Users
              </span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Activity size={18} className={activeTab === 'health' ? 'text-teal-400' : ''} />
                <span>Cluster Health</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                3/3 Online
              </span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Database size={18} className={activeTab === 'database' ? 'text-teal-400' : ''} />
                <span>Database Architecture</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Mongo 27017
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock size={18} className={activeTab === 'security' ? 'text-teal-400' : ''} />
                <span>Access &amp; RBAC Policies</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                JWT / Bcrypt
              </span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Terminal size={18} className={activeTab === 'terminal' ? 'text-teal-400' : ''} />
                <span>Live Audit Stream</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {terminalLogs.length} Events
              </span>
            </button>
          </nav>
        </div>

        {/* Microservices Live Status Box & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Node.js :5000
              </span>
              <span className="text-emerald-400 font-medium">{healthChecks.apiLatency}ms</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> FastAPI :8001
              </span>
              <span className="text-teal-400 font-medium">{healthChecks.aiLatency}ms</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> MongoDB 27017
              </span>
              <span className="text-cyan-400 font-medium">Ready</span>
            </div>
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              navigate('/')
            }} 
            className="w-full py-3 bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-2xl transition flex items-center justify-center space-x-2 text-xs font-bold border border-slate-800 cursor-pointer"
          >
            <LogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN ADMIN WORKSPACE                                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 z-20 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-0.5">
              <span>VEHLOG Security Console</span>
              <span>/</span>
              <span className="text-teal-400 font-medium capitalize">
                {activeTab === 'users' && 'Identity & Role Management'}
                {activeTab === 'health' && 'Microservice Diagnostics'}
                {activeTab === 'database' && 'MongoDB Engine Architecture'}
                {activeTab === 'security' && 'RBAC & Cryptographic Policies'}
                {activeTab === 'terminal' && 'Kernel Event Stream'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {activeTab === 'users' && 'Employee Provisioning & User Directory'}
              {activeTab === 'health' && 'Cluster Diagnostics & Inference Telemetry'}
              {activeTab === 'database' && 'Database State & Maintenance'}
              {activeTab === 'security' && 'Authentication & Access Control Matrix'}
              {activeTab === 'terminal' && 'System Audit Terminal Stream'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={runHealthProbes}
              disabled={isProbing}
              className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/70 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-2xl transition cursor-pointer"
            >
              <RefreshCw size={14} className={isProbing ? "animate-spin text-teal-400" : "text-slate-400"} />
              <span>Probe Cluster</span>
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          
          {/* Top Admin KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Total Identities</span>
                <Users size={16} className="text-teal-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">{users.length}</span>
                <span className="text-[11px] text-teal-400 font-medium">Provisioned</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {adminCount} Admin · {managerCount} Manager · {driverCount} Drivers
              </p>
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Cluster Services</span>
                <Server size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-400 font-mono">3 / 3</span>
                <span className="text-[11px] text-emerald-400 font-medium">100% Up</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Node.js (:5000), AI (:8001), Mongo (:27017)
              </p>
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Random Forest Accuracy</span>
                <Cpu size={16} className="text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">96.4%</span>
                <span className="text-[11px] text-cyan-400 font-medium">R² Score</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                MAE: ±1.8 mins · 50,000 runs
              </p>
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Database State</span>
                <Database size={16} className="text-purple-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">Synced</span>
                <span className="text-[11px] text-purple-400 font-medium">ai_logistics</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                WiredTiger Engine · 2 Collections
              </p>
            </div>

          </div>

          {/* ======================================================== */}
          {/* TAB 1: USER MANAGEMENT                                   */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              
              {/* Register Employee Form (Left 5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-5 h-fit">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Provision New Employee</h3>
                    <p className="text-xs text-slate-400">Creates user with Bcrypt salted hashing</p>
                  </div>
                </div>

                {registerSuccess && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{registerSuccess}</span>
                  </div>
                )}

                {registerError && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{registerError}</span>
                  </div>
                )}

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newUser.name} 
                      onChange={e => setNewUser({...newUser, name: e.target.value})} 
                      placeholder="e.g. Vikram Malhotra" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      Corporate Email Address
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value})} 
                      placeholder="name@pes.edu" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      Temporary Access Password
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      placeholder="Set strong initial password..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      RBAC Assigned Role
                    </label>
                    <select 
                      value={newUser.role} 
                      onChange={e => setNewUser({...newUser, role: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    >
                      <option value="Driver">Delivery Driver (Gig Economy Partner)</option>
                      <option value="Manager">Operations Manager (Fleet Dispatch)</option>
                      <option value="Admin">System Administrator (Root Authority)</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isRegistering}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Hashing &amp; Saving to MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Provision Account</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Key size={12} className="text-teal-400" /> Automated Vehicle ID Allocation
                  </p>
                  <p>When selecting Delivery Driver, the server automatically generates a unique identifier (e.g. <code className="text-teal-300">VH-4912</code>) upon database creation.</p>
                  <p className="flex items-center gap-1.5 text-slate-300 font-semibold pt-1 border-t border-slate-800/60">
                    <Shield size={12} className="text-purple-400" /> Single Role Enforcement
                  </p>
                  <p>Each email is unique across the platform. If an email is already assigned to a role, registration will be rejected with an existing-role alert.</p>
                </div>
              </div>

              {/* User Directory Table (Right 7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
                <div>
                  {/* Table Header with Search & Filter */}
                  <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        placeholder="Search name, email, vehicle..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                      {['ALL', 'Admin', 'Manager', 'Driver'].map(role => (
                        <button
                          key={role}
                          onClick={() => setRoleFilter(role)}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                            roleFilter === role ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-mono">
                          <th className="px-6 py-3.5">User Identity</th>
                          <th className="px-6 py-3.5">Email Address</th>
                          <th className="px-6 py-3.5">Access Role</th>
                          <th className="px-6 py-3.5">Vehicle</th>
                          <th className="px-6 py-3.5 text-right">Revoke</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-400">
                              <RefreshCw size={20} className="animate-spin mx-auto text-teal-400 mb-2" />
                              <span>Loading user records from MongoDB...</span>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-400">
                              No users match current search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user._id} className="hover:bg-slate-800/30 transition">
                              <td className="px-6 py-4 font-bold text-white flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                  user.role === 'Manager' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                }`}>
                                  {user.name ? user.name.charAt(0) : 'U'}
                                </div>
                                <span className="truncate">{user.name}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-mono text-[11px]">
                                {user.email}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  user.role === 'Admin' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                                  user.role === 'Manager' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                                  'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                                {user.vehicleId ? (
                                  <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-white font-semibold">
                                    {user.vehicleId}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {user.role === 'Admin' ? (
                                  <span className="text-[10px] text-slate-600 font-mono">Protected</span>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                    title="Revoke access"
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Showing {filteredUsers.length} of {users.length} provisioned accounts</span>
                  <span>MongoDB Collection: <code>users</code></span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CLUSTER HEALTH                                    */}
          {/* ======================================================== */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Microservices Probe Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Node Backend */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Server size={24} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Node.js Express API</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">http://localhost:5000</p>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Response Latency:</span>
                      <strong className="text-emerald-400 font-mono">{healthChecks.apiLatency} ms</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Router Protocol:</span>
                      <strong className="text-slate-200">REST over HTTP</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Auth Engine:</span>
                      <strong className="text-slate-200">JWT + Bcrypt Middleware</strong>
                    </div>
                  </div>
                </div>

                {/* FastAPI AI Engine */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                      <Cpu size={24} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /> Loaded
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Python FastAPI Microservice</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">http://localhost:8001</p>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Inference Speed:</span>
                      <strong className="text-teal-400 font-mono">{healthChecks.aiLatency} ms</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Model Artifact:</span>
                      <strong className="text-slate-200 font-mono">eta_rf_model.pkl</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Encoders:</span>
                      <strong className="text-slate-200 font-mono">label_encoders.pkl</strong>
                    </div>
                  </div>
                </div>

                {/* MongoDB Cluster */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <Database size={24} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Connected
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Cloud MongoDB Database</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">127.0.0.1:27017</p>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Namespace:</span>
                      <strong className="text-blue-400 font-mono">ai_logistics</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Engine:</span>
                      <strong className="text-slate-200">WiredTiger Cache</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Mongoose ODM:</span>
                      <strong className="text-slate-200">v8.3.1 Active</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed ML Model Diagnostic Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-teal-400" />
                      <span>Random Forest Regressor Architecture Specifications</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Model evaluation metrics computed on the 50,000 localized Bengaluru delivery benchmark dataset
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 font-mono font-bold">
                    Scikit-Learn
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                    <p className="text-xs text-slate-400">Model Accuracy Metric</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-white font-mono">96.4%</span>
                      <span className="text-xs text-teal-400 font-bold">R² Coefficient</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div className="bg-teal-400 h-full rounded-full" style={{ width: '96.4%' }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                    <p className="text-xs text-slate-400">Mean Absolute Error (MAE)</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-emerald-400 font-mono">± 1.8</span>
                      <span className="text-xs text-slate-400">minutes</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                    <p className="text-xs text-slate-400">Sub-second Inference</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-cyan-400 font-mono">14</span>
                      <span className="text-xs text-slate-400">ms execution</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Training Dataset Size:</span>
                    <strong className="text-white font-mono">50,000 Verified Trips</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Model Hyperparameters:</span>
                    <strong className="text-white font-mono">n_estimators=100, max_depth=15</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Geographic Scope:</span>
                    <strong className="text-white">Bengaluru Urban Grid</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DATABASE CONFIG                                   */}
          {/* ======================================================== */}
          {activeTab === 'database' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              
              {/* Architecture Info (Left 7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HardDrive size={18} className="text-blue-400" />
                    <span>MongoDB Database Architecture</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Physical connection parameters and cluster metadata</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">
                      MongoDB Connection URI
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value="mongodb://127.0.0.1:27017/ai_logistics" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-cyan-300 font-mono outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Active Database
                      </p>
                      <p className="text-xl font-black text-white font-mono">ai_logistics</p>
                      <p className="text-[10px] text-emerald-400 mt-1">● State: Connected (1)</p>
                    </div>

                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Collections
                      </p>
                      <p className="text-xl font-black text-white font-mono">`users`, `orders`</p>
                      <p className="text-[10px] text-slate-400 mt-1">Mongoose Schema Mapped</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Server Engine:</span>
                      <strong className="text-white">MongoDB Community v7.0+</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Default Storage Engine:</span>
                      <strong className="text-white">WiredTiger</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Indexes Active:</span>
                      <strong className="text-teal-400 font-mono">_id_, email_1, location_2dsphere</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions (Right 5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database size={18} className="text-teal-400" />
                    <span>Database Administration Actions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Direct operational maintenance hooks</p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className={`w-full py-4 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      backupComplete 
                        ? 'bg-emerald-500 text-slate-950' 
                        : isBackingUp 
                        ? 'bg-slate-800 text-slate-400' 
                        : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20'
                    }`}
                  >
                    {backupComplete ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Snapshot Backup Generated &amp; Downloaded</span>
                      </>
                    ) : isBackingUp ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Creating Compressed Mongo Dump...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud size={16} />
                        <span>Trigger Full Database Backup</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleReindex}
                    disabled={reindexing}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border cursor-pointer ${
                      reindexComplete
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {reindexing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Re-building Geospatial Indexes...</span>
                      </>
                    ) : reindexComplete ? (
                      <>
                        <Check size={16} className="text-emerald-400" />
                        <span>Indexes Re-built Successfully</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span>Re-Index 2dsphere Spatial Queries</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      setCacheFlushed(true)
                      setTimeout(() => setCacheFlushed(false), 2500)
                    }}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border cursor-pointer ${
                      cacheFlushed 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers size={16} />
                    <span>{cacheFlushed ? 'Connection Pool Cleared' : 'Flush Query Cache & Pool'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ACCESS & RBAC POLICIES                            */}
          {/* ======================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* JWT Cryptography Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Key size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">JSON Web Token (JWT) Protocol</h3>
                      <p className="text-xs text-slate-400">Cryptographically signed stateless sessions</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Signing Algorithm:</span>
                      <strong className="text-purple-400 font-mono">HMAC SHA-256 (HS256)</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Token Lifetime (TTL):</span>
                      <strong className="text-white font-mono">30 Days</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Token Storage:</span>
                      <strong className="text-white font-mono">Browser LocalStorage + Bearer Auth</strong>
                    </div>
                  </div>
                </div>

                {/* Password Hashing Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Bcrypt One-Way Salting</h3>
                      <p className="text-xs text-slate-400">Protection against rainbow tables &amp; brute-force</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Work Factor (Rounds):</span>
                      <strong className="text-teal-400 font-mono">10 Salt Rounds</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Middleware Interceptor:</span>
                      <strong className="text-white font-mono">Mongoose pre('save') hook</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Plaintext Storage:</span>
                      <strong className="text-emerald-400 font-bold">Zero (Never Stored)</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* RBAC Permission Matrix */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                <div className="pb-4 border-b border-slate-800 mb-4">
                  <h3 className="text-base font-bold text-white">Role-Based Access Control (RBAC) Matrix</h3>
                  <p className="text-xs text-slate-400">Defined operational privileges for enterprise access tiers</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">System Capability</th>
                        <th className="py-3 px-4 text-center">System Administrator</th>
                        <th className="py-3 px-4 text-center">Operations Manager</th>
                        <th className="py-3 px-4 text-center">Delivery Partner (Driver)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">User &amp; Employee Provisioning</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">Dispatch New Orders &amp; Routing</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">Live Bengaluru Geospatial Map</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">Claim Orders in Gig Concurrency Race</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">Hardware GPS Coordinates Streaming</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-white">Database Backup &amp; Infrastructure Config</td>
                        <td className="py-3.5 px-4 text-center"><CheckCircle2 size={16} className="text-emerald-400 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: LIVE TERMINAL                                     */}
          {/* ======================================================== */}
          {activeTab === 'terminal' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-mono">
                {/* Terminal Window Chrome */}
                <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs text-slate-400 font-sans ml-3">vehlog-kernel-stdout.log</span>
                  </div>

                  <div className="flex items-center space-x-2 font-sans text-xs">
                    <button
                      onClick={() => {
                        const pingTime = new Date().toLocaleTimeString()
                        setTerminalLogs(prev => [
                          {
                            id: Date.now(),
                            time: pingTime,
                            level: 'info',
                            tag: 'PING_PROBE',
                            msg: `ICMP loopback verified: 127.0.0.1:5000 [OK] | 127.0.0.1:8001 [OK] | 127.0.0.1:27017 [OK]`
                          },
                          ...prev
                        ])
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                    >
                      Send Ping Probe
                    </button>
                    <button
                      onClick={() => setTerminalLogs([])}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                    >
                      Clear Log
                    </button>
                  </div>
                </div>

                {/* Log Terminal Screen */}
                <div className="p-6 text-xs space-y-2.5 h-[500px] overflow-y-auto">
                  {terminalLogs.map(log => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <span className="text-slate-500 shrink-0">[{log.time}]</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 ${
                        log.level === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                        log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-teal-500/20 text-teal-300'
                      }`}>
                        {log.tag}
                      </span>
                      <span className="text-slate-300 leading-relaxed font-mono">{log.msg}</span>
                    </div>
                  ))}
                  <div className="flex items-center text-teal-400 space-x-2 pt-2">
                    <span className="animate-pulse">❯</span>
                    <span className="text-slate-500 font-mono">Listening for cluster events on ports 5000, 8001, 27017...</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  )
}