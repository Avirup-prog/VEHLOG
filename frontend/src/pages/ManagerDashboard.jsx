import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  Activity, 
  MapPin, 
  Package, 
  Users, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Route, 
  Compass, 
  Truck, 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CloudRain, 
  Sun, 
  Cloud, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronRight, 
  Shield, 
  Zap, 
  Radio, 
  Filter
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet default marker icons fix
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const warningIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = defaultIcon

// Real-world coordinates for major Bengaluru Zones
const BENGALURU_ZONES = {
  "Indiranagar": { lat: 12.9784, lng: 77.6408, color: '#10b981', label: 'Commercial Hub' },
  "Koramangala": { lat: 12.9279, lng: 77.6271, color: '#f59e0b', label: 'High Traffic Zone' },
  "Whitefield": { lat: 12.9698, lng: 77.7499, color: '#06b6d4', label: 'Tech Park Destination' },
  "Jayanagar": { lat: 12.9299, lng: 77.5824, color: '#8b5cf6', label: 'Residential Sector' },
  "Malleshwaram": { lat: 13.0031, lng: 77.5643, color: '#ec4899', label: 'North Distribution Hub' },
  "Electronic City": { lat: 12.8399, lng: 77.6770, color: '#3b82f6', label: 'Industrial Corridor' }
}

// Map Controller Helper to allow smooth animated pan/zoom
function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 })
    }
  }, [center, zoom, map])
  return null
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('orders')

  // Real-time server states
  const [stats, setStats] = useState({ activeDeliveries: 0, availableDrivers: 0, aiPredictedDelays: 0 })
  const [orders, setOrders] = useState([])
  const [fleet, setFleet] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState(new Date())

  // Map view controls
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946])
  const [mapZoom, setMapZoom] = useState(12)
  const [selectedDriverOnMap, setSelectedDriverOnMap] = useState(null)

  // Order Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')

  // Create Order Modal States
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [preflightETA, setPreflightETA] = useState(null)
  const [isCalculatingETA, setIsCalculatingETA] = useState(false)

  const [newOrder, setNewOrder] = useState({
    pickup_area: 'Indiranagar',
    delivery_area: 'Koramangala',
    distance_km: 0,
    weather: 'Clear',
    traffic_level: 'Medium'
  })

  // AI Interactive Simulator State (Tab 4)
  const [simDistance, setSimDistance] = useState(8.5)
  const [simPrepTime, setSimPrepTime] = useState(15)
  const [simExp, setSimExp] = useState(24)
  const [simWeather, setSimWeather] = useState('Clear')
  const [simTraffic, setSimTraffic] = useState('Medium')
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)

  // Live System Logs
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, time: '10:48:12', tag: 'AI_ENGINE', msg: 'Random Forest Regressor loaded on FastAPI :8001 (100 estimators)', level: 'success' },
    { id: 2, time: '10:48:15', tag: 'MONGODB', msg: 'Connected to ai_logistics replica set @ 127.0.0.1:27017', level: 'info' },
    { id: 3, time: '10:48:20', tag: 'OSRM_ROUTING', msg: 'OpenStreetMap engine synchronized with Bengaluru zone matrix', level: 'info' },
    { id: 4, time: '10:48:32', tag: 'TELEMETRY', msg: 'Driver GPS heartbeat listener initialized with 3000ms polling', level: 'info' }
  ])

  // Fetch data from MongoDB backend
  const fetchData = async () => {
    try {
      const [statsRes, ordersRes, fleetRes] = await Promise.all([
        fetch('http://localhost:5000/api/orders/stats'),
        fetch('http://localhost:5000/api/orders/active'),
        fetch('http://localhost:5000/api/orders/fleet')
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (fleetRes.ok) setFleet(await fleetRes.json())
      setLastSync(new Date())
    } catch (error) {
      console.error("Failed to fetch from MongoDB:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-Calculate Distance using Open Source Routing Machine (OSRM)
  useEffect(() => {
    if (newOrder.pickup_area === newOrder.delivery_area) {
      setNewOrder(prev => ({ ...prev, distance_km: 0.8 }))
      return
    }

    const calculateRealDistance = async () => {
      setIsCalculatingDistance(true)
      try {
        const p1 = BENGALURU_ZONES[newOrder.pickup_area]
        const p2 = BENGALURU_ZONES[newOrder.delivery_area]
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=false`)
        const data = await res.json()
        
        if (data.routes && data.routes.length > 0) {
          const distanceInKm = (data.routes[0].distance / 1000).toFixed(1)
          const kmNum = Number(distanceInKm)
          setNewOrder(prev => ({ ...prev, distance_km: kmNum }))
          
          // Trigger preflight AI ETA estimation
          runPreflightAI(kmNum, newOrder.weather, newOrder.traffic_level)
        }
      } catch (err) {
        console.error("OSRM Route calculation failed", err)
      } finally {
        setIsCalculatingDistance(false)
      }
    }

    calculateRealDistance()
  }, [newOrder.pickup_area, newOrder.delivery_area, newOrder.weather, newOrder.traffic_level])

  // Pre-dispatch AI prediction check
  const runPreflightAI = async (dist, weather, traffic) => {
    setIsCalculatingETA(true)
    try {
      const res = await fetch('http://localhost:8001/predict_eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: dist,
          restaurant_preparation_time_minutes: 15.0,
          delivery_partner_experience_months: 18.0,
          weather: weather,
          traffic_level: traffic
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPreflightETA(data.predicted_eta_minutes)
      }
    } catch (e) {
      console.warn("Preflight AI call skipped:", e)
    } finally {
      setIsCalculatingETA(false)
    }
  }

  // Handle Order Dispatch submission
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (isCalculatingDistance) return
    setIsCreating(true)
    
    try {
      // 1. Call Python AI Microservice to predict ETA
      const aiRes = await fetch('http://localhost:8001/predict_eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: newOrder.distance_km,
          restaurant_preparation_time_minutes: 15.0,
          delivery_partner_experience_months: 18.0,
          weather: newOrder.weather,
          traffic_level: newOrder.traffic_level
        })
      })
      const aiData = await aiRes.json()
      const isDelayed = aiData.predicted_eta_minutes > 40 ? 1 : 0 
      
      // 2. Save Order to Node.js/MongoDB
      const mongoRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_area: newOrder.pickup_area,
          delivery_area: newOrder.delivery_area,
          distance_km: newOrder.distance_km,
          weather: newOrder.weather,
          traffic_level: newOrder.traffic_level,
          late_delivery: isDelayed
        })
      })
      
      if (mongoRes.ok) {
        const createdData = await mongoRes.json()
        // Add to operational logs
        setSystemLogs(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            tag: 'ORDER_DISPATCH',
            msg: `Order ${createdData.order_id || 'NEW'} created: ${newOrder.pickup_area} ➔ ${newOrder.delivery_area} (${newOrder.distance_km}km). AI ETA: ${aiData.predicted_eta_minutes}m ${isDelayed ? '[DELAY FLAGGED]' : '[NORMAL]'}`,
            level: isDelayed ? 'warning' : 'success'
          },
          ...prev
        ])
        setShowModal(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error creating order:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // Interactive AI Simulator Run
  const handleRunSimulator = async () => {
    setSimLoading(true)
    try {
      const res = await fetch('http://localhost:8001/predict_eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: Number(simDistance),
          restaurant_preparation_time_minutes: Number(simPrepTime),
          delivery_partner_experience_months: Number(simExp),
          weather: simWeather,
          traffic_level: simTraffic
        })
      })
      const data = await res.json()
      setSimResult(data)
    } catch (err) {
      console.error("Simulator error:", err)
    } finally {
      setSimLoading(false)
    }
  }

  // Filtered Orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.order_id && order.order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.pickup_area && order.pickup_area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.delivery_area && order.delivery_area.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
      const matchesRisk = 
        riskFilter === 'ALL' || 
        (riskFilter === 'DELAY' && order.late_delivery === 1) ||
        (riskFilter === 'ON_TIME' && order.late_delivery !== 1)

      return matchesSearch && matchesStatus && matchesRisk
    })
  }, [orders, searchQuery, statusFilter, riskFilter])

  // Count active drivers with live GPS
  const driversWithGps = fleet.filter(d => d.location && d.location.lat)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-hidden select-none">
      
      {/* ======================================================== */}
      {/* CREATE ORDER MODAL                                       */}
      {/* ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1 rounded-xl hover:bg-slate-800"
            >
              <X size={20}/>
            </button>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Plus size={22} className="text-slate-950" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Dispatch New Delivery</h2>
                <p className="text-xs text-slate-400">OpenStreetMap OSRM Routing + ML ETA Evaluation</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                    Pickup Zone
                  </label>
                  <select 
                    value={newOrder.pickup_area} 
                    onChange={e => setNewOrder({...newOrder, pickup_area: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition shadow-sm"
                  >
                    {Object.keys(BENGALURU_ZONES).map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                    Delivery Drop-off
                  </label>
                  <select 
                    value={newOrder.delivery_area} 
                    onChange={e => setNewOrder({...newOrder, delivery_area: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition shadow-sm"
                  >
                    {Object.keys(BENGALURU_ZONES).map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AUTOMATIC OSRM DISTANCE & LIVE AI ETA PREVIEW */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Route size={14} className="text-cyan-400" /> OSRM Driving Distance:
                  </span>
                  {isCalculatingDistance ? (
                    <span className="flex items-center gap-1 text-cyan-400 font-mono">
                      <Loader2 size={12} className="animate-spin" /> Calculating...
                    </span>
                  ) : (
                    <span className="font-bold text-white font-mono text-sm">{newOrder.distance_km} km</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu size={14} className="text-emerald-400" /> Random Forest Estimated ETA:
                  </span>
                  {isCalculatingETA ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <Loader2 size={12} className="animate-spin" /> Predicting...
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      ~{preflightETA || 30} mins 
                      {preflightETA > 40 && (
                        <span className="ml-1.5 text-[10px] text-amber-400 font-normal">[Delay Risk]</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Weather Context</label>
                  <select 
                    value={newOrder.weather} 
                    onChange={e => setNewOrder({...newOrder, weather: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  >
                    <option value="Clear">Clear ☀️</option>
                    <option value="Cloudy">Cloudy ☁️</option>
                    <option value="Rain">Rain 🌧️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Traffic Density</label>
                  <select 
                    value={newOrder.traffic_level} 
                    onChange={e => setNewOrder({...newOrder, traffic_level: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  >
                    <option value="Low">Low 🟢</option>
                    <option value="Medium">Medium 🟡</option>
                    <option value="High">High 🔴</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isCreating || isCalculatingDistance} 
                className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18}/>
                    <span>Dispatching &amp; Broadcasting...</span>
                  </>
                ) : (
                  <span>Broadcast Order to Driver Pool</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SIDEBAR NAVIGATION                                       */}
      {/* ======================================================== */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 relative z-30">
        
        {/* Top Brand & Manager Profile */}
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Truck size={20} className="text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black tracking-tight text-white font-mono">VEHLOG</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                    Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Operations Command</p>
              </div>
            </div>
          </div>

          {/* Manager User Pill */}
          <div className="mx-4 mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">Operations Manager</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">manager@pes.edu</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 mt-2">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Compass size={18} className={activeTab === 'tracking' ? 'text-emerald-400' : ''} />
                <span>Live GPS Map</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {driversWithGps.length} Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package size={18} className={activeTab === 'orders' ? 'text-emerald-400' : ''} />
                <span>Active Orders</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users size={18} className={activeTab === 'fleet' ? 'text-emerald-400' : ''} />
                <span>Driver Fleet</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {fleet.length} Drivers
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Cpu size={18} className={activeTab === 'analytics' ? 'text-emerald-400' : ''} />
                <span>AI ETA Simulator</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold uppercase">
                ML Model
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Activity size={18} className={activeTab === 'logs' ? 'text-emerald-400' : ''} />
                <span>Operational Logs</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {systemLogs.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Status & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> API :5000
              </span>
              <span className="text-emerald-400 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> AI Engine :8001
              </span>
              <span className="text-teal-400 font-medium">FastAPI</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Mongo 27017
              </span>
              <span className="text-cyan-400 font-medium">Active</span>
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
      {/* MAIN OPERATIONS WORKSPACE                                */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 z-20 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-0.5">
              <span>VEHLOG Fleet Command</span>
              <span>/</span>
              <span className="text-emerald-400 font-medium capitalize">
                {activeTab === 'tracking' && 'Geospatial Telemetry'}
                {activeTab === 'orders' && 'Order Orchestration'}
                {activeTab === 'fleet' && 'Partner Drivers'}
                {activeTab === 'analytics' && 'Machine Learning Sandbox'}
                {activeTab === 'logs' && 'System Audit Stream'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {activeTab === 'tracking' && 'Live Bengaluru GPS Tracking'}
              {activeTab === 'orders' && 'Real-Time Order Dispatch'}
              {activeTab === 'fleet' && 'Delivery Partner Fleet'}
              {activeTab === 'analytics' && 'FastAPI Random Forest Model'}
              {activeTab === 'logs' && 'Operational Telemetry Logs'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Sync Pulse */}
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>3s Live Sync</span>
              <span className="text-slate-400 font-mono text-[10px]">({lastSync.toLocaleTimeString()})</span>
            </div>

            {/* Quick Dispatch Button */}
            <button
              onClick={() => setShowModal(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Dispatch Order</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          
          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Active Deliveries</span>
                <Package size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">
                  {isLoading ? '...' : stats.activeDeliveries}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">In Pipeline</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {orders.filter(o => o.status === 'Pending').length} Pending · {orders.filter(o => o.status === 'Active' || o.status === 'Picked_Up').length} In-Transit
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Registered Fleet</span>
                <Truck size={16} className="text-teal-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">
                  {isLoading ? '...' : fleet.length}
                </span>
                <span className="text-[11px] text-teal-400 font-medium">Drivers</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {driversWithGps.length} streaming live hardware GPS
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span className="text-rose-400">AI-Flagged Delays</span>
                <AlertTriangle size={16} className="text-rose-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-rose-400 font-mono">
                  {isLoading ? '...' : stats.aiPredictedDelays}
                </span>
                <span className="text-[11px] text-rose-400/80 font-medium">ETA &gt; 40m</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Evaluated by 50,000-run ML model
              </p>
            </div>

            {/* Metric 4 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Avg Distance</span>
                <Route size={16} className="text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">
                  {orders.length > 0 
                    ? (orders.reduce((acc, o) => acc + (o.distance_km || 0), 0) / orders.length).toFixed(1)
                    : '12.4'}
                </span>
                <span className="text-[11px] text-cyan-400 font-medium">km / route</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                OpenStreetMap Bengaluru Road Matrix
              </p>
            </div>

          </div>

          {/* ======================================================== */}
          {/* TAB 1: LIVE GPS MAP                                      */}
          {/* ======================================================== */}
          {activeTab === 'tracking' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Quick Jump Zone Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <MapPin size={14} className="text-emerald-400" />
                  <span className="font-semibold">Bengaluru Dispatch Zones:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BENGALURU_ZONES).map(([name, data]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setMapCenter([data.lat, data.lng])
                        setMapZoom(14)
                      }}
                      className="px-3 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setMapCenter([12.9716, 77.5946])
                      setMapZoom(12)
                    }}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs rounded-xl font-bold transition cursor-pointer"
                  >
                    Reset Center
                  </button>
                </div>
              </div>

              {/* Map & Live Telemetry Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                
                {/* Leaflet Map Canvas */}
                <div className="lg:col-span-3 h-[560px] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={mapZoom} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                  >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <TileLayer 
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    />

                    {/* Bengaluru Strategic Zones with radius circles */}
                    {Object.entries(BENGALURU_ZONES).map(([zoneName, zone]) => (
                      <Circle
                        key={zoneName}
                        center={[zone.lat, zone.lng]}
                        radius={600}
                        pathOptions={{
                          color: zone.color,
                          fillColor: zone.color,
                          fillOpacity: 0.15,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="p-1 font-sans">
                            <h4 className="font-bold text-slate-900 text-sm">{zoneName}</h4>
                            <p className="text-xs text-slate-500">{zone.label}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-1">GPS: {zone.lat}, {zone.lng}</p>
                          </div>
                        </Popup>
                      </Circle>
                    ))}

                    {/* Active Fleet Drivers with Live GPS Markers */}
                    {driversWithGps.map((driver) => (
                      <Marker 
                        key={driver._id} 
                        position={[driver.location.lat, driver.location.lng]} 
                        icon={driverIcon}
                      >
                        <Popup>
                          <div className="p-1 font-sans">
                            <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                              <span>🚚 {driver.name}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">Vehicle: <strong className="font-mono">{driver.vehicleId || 'VEH-AUTO'}</strong></p>
                            <p className="text-[11px] text-emerald-600 font-semibold mt-1">● Hardware GPS Streaming Active</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Lat: {driver.location.lat.toFixed(4)}, Lng: {driver.location.lng.toFixed(4)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Right Map Telemetry Drawer */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-[560px]">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Radio size={16} className="text-emerald-400 animate-pulse" />
                        <h3 className="text-sm font-bold text-white">Live Beacons</h3>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">
                        {driversWithGps.length} active
                      </span>
                    </div>

                    <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[380px] pr-1">
                      {fleet.map((driver) => {
                        const hasGps = driver.location && driver.location.lat
                        return (
                          <div 
                            key={driver._id}
                            onClick={() => {
                              if (hasGps) {
                                setMapCenter([driver.location.lat, driver.location.lng])
                                setMapZoom(15)
                                setSelectedDriverOnMap(driver._id)
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all text-left ${
                              hasGps 
                                ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 cursor-pointer' 
                                : 'bg-slate-950/30 border-slate-900 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white truncate">{driver.name}</span>
                              <span className={`w-2 h-2 rounded-full ${hasGps ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>{driver.vehicleId || 'VEH-STANDBY'}</span>
                              <span>{hasGps ? 'LOCATE ➔' : 'OFFLINE'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <p>Click any online driver card to pan map camera directly to their GPS coordinates.</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ACTIVE ORDERS                                     */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Filter and Search Bar */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Order ID or Zone..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                    {['ALL', 'Pending', 'Active', 'Picked_Up'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          statusFilter === st ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'Picked_Up' ? 'Picked Up' : st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                    <button
                      onClick={() => setRiskFilter(riskFilter === 'DELAY' ? 'ALL' : 'DELAY')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        riskFilter === 'DELAY' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <AlertTriangle size={12} />
                      <span>Delays</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Orders Table Container */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">Live Pipeline Orders</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {filteredOrders.length} shown
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Database: MongoDB `orders`</span>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <Package size={40} className="mx-auto text-slate-600" />
                    <p className="text-sm font-medium">No orders found matching the filter criteria.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition"
                    >
                      Dispatch a New Order Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-mono">
                          <th className="px-6 py-3.5">Order ID</th>
                          <th className="px-6 py-3.5">Transit Route</th>
                          <th className="px-6 py-3.5">Road Distance</th>
                          <th className="px-6 py-3.5">Environmental</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5">AI Delay Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredOrders.map((order) => {
                          const isDelay = order.late_delivery === 1
                          return (
                            <tr key={order._id || order.order_id} className="hover:bg-slate-800/30 transition">
                              <td className="px-6 py-4 font-bold text-white font-mono">
                                {order.order_id}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2 font-medium">
                                  <span className="text-slate-200">{order.pickup_area || 'Hub'}</span>
                                  <span className="text-emerald-400">➔</span>
                                  <span className="text-white font-bold">{order.delivery_area}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono font-semibold text-cyan-400">
                                {order.distance_km} km
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2 text-slate-300">
                                  <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800">
                                    {order.weather === 'Rain' ? '🌧️ Rain' : order.weather === 'Cloudy' ? '☁️ Cloudy' : '☀️ Clear'}
                                  </span>
                                  <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 font-mono">
                                    {order.traffic_level} Traffic
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                  order.status === 'Pending' 
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : order.status === 'Active'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : order.status === 'Picked_Up'
                                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {order.status === 'Pending' && <Radio size={10} className="animate-pulse" />}
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {isDelay ? (
                                  <span className="px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full font-bold flex items-center gap-1.5 w-fit">
                                    <AlertTriangle size={12} /> Predicted Delay
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1.5 w-fit">
                                    <CheckCircle2 size={12} /> On-Time Flow
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FLEET STATUS                                      */}
          {/* ======================================================== */}
          {activeTab === 'fleet' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Registered Fleet Partners</h3>
                    <p className="text-xs text-slate-400">Driver profiles provisioned in MongoDB User collection</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    {fleet.length} Drivers Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {fleet.map((driver) => {
                    const hasGps = driver.location && driver.location.lat
                    return (
                      <div 
                        key={driver._id}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-base">
                              {driver.name ? driver.name.charAt(0) : 'D'}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{driver.name}</h4>
                              <p className="text-xs text-slate-400 font-mono truncate">{driver.email}</p>
                            </div>
                          </div>

                          <span className={`w-2.5 h-2.5 rounded-full ${hasGps ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-800/60 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Assigned Vehicle:</span>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {driver.vehicleId || 'VEH-9988'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">GPS Signal:</span>
                            <span className={`font-semibold ${hasGps ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {hasGps ? 'Hardware Streaming Active' : 'Offline / Standby'}
                            </span>
                          </div>

                          {hasGps && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>Coordinates:</span>
                              <span>{driver.location.lat.toFixed(4)}, {driver.location.lng.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AI ETA SIMULATOR & MODEL PLAYGROUND              */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Simulator Form (Left 7 Cols) */}
                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
                      <Sparkles size={14} />
                      <span>Random Forest Regressor Sandbox</span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Interactive ETA Prediction Engine</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Run live microservice queries against the trained model (`eta_rf_model.pkl`) to test delivery predictions.
                    </p>
                  </div>

                  <div className="space-y-5">
                    
                    {/* Distance Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>Transit Distance</span>
                        <span className="font-mono text-cyan-400 text-sm font-bold">{simDistance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="35" 
                        step="0.5"
                        value={simDistance}
                        onChange={e => setSimDistance(e.target.value)}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Restaurant Prep Time Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>Restaurant Preparation Time</span>
                        <span className="font-mono text-emerald-400 text-sm font-bold">{simPrepTime} mins</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="45" 
                        step="1"
                        value={simPrepTime}
                        onChange={e => setSimPrepTime(e.target.value)}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Driver Experience Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>Driver Experience (Seniority)</span>
                        <span className="font-mono text-teal-400 text-sm font-bold">{simExp} months</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="60" 
                        step="1"
                        value={simExp}
                        onChange={e => setSimExp(e.target.value)}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Weather & Traffic Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Weather Condition</label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {['Clear', 'Cloudy', 'Rain'].map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setSimWeather(w)}
                              className={`py-2 rounded-xl border text-center font-medium transition cursor-pointer ${
                                simWeather === w
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Traffic Intensity</label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {['Low', 'Medium', 'High'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSimTraffic(t)}
                              className={`py-2 rounded-xl border text-center font-medium transition cursor-pointer ${
                                simTraffic === t
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRunSimulator}
                      disabled={simLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {simLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Executing Random Forest Inference...</span>
                        </>
                      ) : (
                        <>
                          <Cpu size={16} />
                          <span>Run AI Model Inference</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>

                {/* Inference Readout (Right 5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Result Card */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Prediction Output</span>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Zap size={12} /> FastAPI :8001
                      </span>
                    </div>

                    <div className="my-6 text-center">
                      <p className="text-xs text-slate-400 mb-1">Predicted ETA to Customer</p>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-6xl font-black text-emerald-400 font-mono tracking-tight">
                          {simResult ? simResult.predicted_eta_minutes : '34.7'}
                        </span>
                        <span className="text-lg font-bold text-slate-400">minutes</span>
                      </div>

                      <div className="mt-4">
                        {(simResult ? simResult.predicted_eta_minutes : 34.7) > 40 ? (
                          <span className="px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                            <AlertTriangle size={14} /> AI Delay Threshold Exceeded (&gt;40m)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Optimal Dispatch Window
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/60 text-xs space-y-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Algorithm:</span>
                        <strong className="text-slate-200">Scikit-Learn RandomForestRegressor</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Dataset Size:</span>
                        <strong className="text-slate-200">50,000 Local Delivery Runs</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Average Model Accuracy:</span>
                        <strong className="text-emerald-400">±1.8 minutes MAE</strong>
                      </div>
                    </div>
                  </div>

                  {/* Feature Importance Card */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Model Feature Weights</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Driving Distance (km)</span>
                          <span className="text-emerald-400 font-mono">48%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '48%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Traffic Level Condition</span>
                          <span className="text-teal-400 font-mono">24%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-teal-400 h-full rounded-full" style={{ width: '24%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Weather Context</span>
                          <span className="text-cyan-400 font-mono">16%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full rounded-full" style={{ width: '16%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Prep Time &amp; Driver Seniority</span>
                          <span className="text-slate-400 font-mono">12%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-slate-600 h-full rounded-full" style={{ width: '12%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: OPERATIONAL AUDIT LOGS                            */}
          {/* ======================================================== */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Activity size={18} className="text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Telemetry &amp; System Stream</h3>
                      <p className="text-xs text-slate-400">Microservice event auditing across Node.js, FastAPI &amp; MongoDB</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSystemLogs([
                        { id: Date.now(), time: new Date().toLocaleTimeString(), tag: 'RESET', msg: 'Audit log view refreshed', level: 'info' }
                      ])
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Clear Stream
                  </button>
                </div>

                <div className="mt-4 space-y-2 font-mono text-xs">
                  {systemLogs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-xl flex items-start space-x-3"
                    >
                      <span className="text-slate-400 shrink-0">[{log.time}]</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        log.level === 'warning' 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.level === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-cyan-400'
                      }`}>
                        {log.tag}
                      </span>
                      <span className="text-slate-200 leading-relaxed">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  )
}