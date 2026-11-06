import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Truck, 
  ShieldCheck, 
  Navigation, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Lock, 
  Mail,
  Zap,
  Cpu,
  UserCheck
} from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('manager@pes.edu')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFillPreset = (presetEmail) => {
    setEmail(presetEmail)
    setPassword('password123')
    setError('')
  }

  // Listen for one-click credential fill events from VEHLOG AI Brand Concierge
  useEffect(() => {
    const handleCredentialFillEvent = (e) => {
      if (e.detail?.email) {
        handleFillPreset(e.detail.email)
      }
    }
    window.addEventListener('vehlog:fill-credentials', handleCredentialFillEvent)
    return () => window.removeEventListener('vehlog:fill-credentials', handleCredentialFillEvent)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Send credentials only - the backend identifies and returns the registered role
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Login failed')
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      
      // Automatic role-based routing based on the user's database role
      if (data.role === 'Manager') {
        navigate('/manager')
      } else if (data.role === 'Admin') {
        navigate('/admin')
      } else if (data.role === 'Driver') {
        navigate('/driver')
      } else {
        throw new Error(`Unrecognized role: ${data.role}`)
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-stretch overflow-hidden select-none">
      
      {/* ======================================================== */}
      {/* LEFT SPLIT PANEL: High-Tech AI & Visual Showcase         */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-r border-slate-800/80">
        
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-7000" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Subtle Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)', backgroundSize: '36px 36px' }}
        />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur rounded-[14px] flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">VEHLOG</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                  v2.4 Core
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Predictive Dispatch & Autonomous Logistics Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">Live Telemetry Active</span>
          </div>
        </div>

        {/* Middle Value Proposition & Telemetry Preview */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Random Forest ML Regressor (Bengaluru Fleet)</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            Next-generation delivery orchestration,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              powered by Machine Learning.
            </span>
          </h1>

          <p className="text-slate-400 text-sm xl:text-base leading-relaxed mb-8">
            Eliminate dispatch guesswork. Real-time ETA estimation, dynamic concurrency locking, and live GPS hardware tracking trained on 50,000+ local urban delivery runs.
          </p>

          {/* Live Simulated Telemetry Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">ORDER #DEL-9042</span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md font-mono">OSRM Geocoded</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live Dispatch
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/50">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium mb-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Route Zones</span>
                </div>
                <p className="text-xs font-bold text-white truncate">Indiranagar ➔ Whitefield</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">14.2 km · Heavy Traffic</p>
              </div>

              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/50">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium mb-1">
                  <Clock className="w-3 h-3 text-teal-400" />
                  <span>AI Predicted ETA</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-emerald-400 font-mono">34.7</span>
                  <span className="text-xs text-slate-400">min</span>
                </div>
                <p className="text-[10px] text-emerald-400/90 font-medium mt-0.5">Confidence 96.4%</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-teal-400" /> Model: <strong className="text-slate-300">FastAPI Random Forest</strong>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Inference: <strong className="text-slate-300">12ms</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sub-second Claims
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> HTML5 Geolocation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> OpenStreetMap OSRM
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">MongoDB Cluster 27017</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SPLIT PANEL: Autonomous Role-Detecting Login       */}
      {/* ======================================================== */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-slate-900 overflow-y-auto">
        
        {/* Mobile Header Branding (Visible on mobile/tablet only) */}
        <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <Truck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-mono tracking-tight">VEHLOG</h2>
              <p className="text-[11px] text-emerald-400">Autonomous Fleet Platform</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
            Online
          </span>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          
          <div className="mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Autonomous Role-Based Authentication</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm mt-1.5">
              Enter your credentials. Your portal workspace will be automatically identified from your account profile.
            </p>
          </div>

          {/* Autonomous Role Destination Guide Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-7 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                System Routing Destinations
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60 text-center">
                <span className="block text-emerald-400 font-bold">OpsCenter</span>
                <span className="text-[10px] text-slate-400">Manager</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60 text-center">
                <span className="block text-teal-400 font-bold">Admin Console</span>
                <span className="text-[10px] text-slate-400">Administrator</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60 text-center">
                <span className="block text-cyan-400 font-bold">Driver App</span>
                <span className="text-[10px] text-slate-400">Delivery Partner</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3.5 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-2 animate-shake">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Account Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pes.edu"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 transition-all font-medium"
                  required 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: <code className="text-emerald-400">password123</code></span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 transition-all font-medium font-mono"
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-3 py-4 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center space-x-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Detecting Role &amp; Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Open Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center pt-4 border-t border-slate-800/80 text-slate-400 text-[11px]">
          <span>Protected with Bcrypt Salting &amp; Signed JWT Sessions</span>
        </div>

      </div>

    </div>
  )
}
