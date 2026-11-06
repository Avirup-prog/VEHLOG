import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  Navigation, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Loader2, 
  Zap, 
  ArrowRightCircle, 
  Truck, 
  Compass, 
  Radio, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Wifi, 
  Activity, 
  Map as MapIcon, 
  Award, 
  BatteryCharging,
  Coins,
  ChevronRight,
  Sun,
  CloudRain,
  Cloud,
  Check
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Custom Leaflet Icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const BENGALURU_ZONES = {
  "Indiranagar": { lat: 12.9784, lng: 77.6408 },
  "Koramangala": { lat: 12.9279, lng: 77.6271 },
  "Whitefield": { lat: 12.9698, lng: 77.7499 },
  "Jayanagar": { lat: 12.9299, lng: 77.5824 },
  "Malleshwaram": { lat: 13.0031, lng: 77.5643 },
  "Electronic City": { lat: 12.8399, lng: 77.6770 }
}

export default function DriverDashboard() {
  const navigate = useNavigate()
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('gig')

  // Driver Identity from LocalStorage
  const [driverProfile, setDriverProfile] = useState({
    name: 'John Doe',
    email: 'driver1@pes.edu',
    vehicleId: 'VEH-9988',
    role: 'Driver'
  })

  // LIVE GPS & TELEMETRY STATE
  const [isGpsEnabled, setIsGpsEnabled] = useState(true)
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [gpsSimulated, setGpsSimulated] = useState(false)
  const [lastBeaconTime, setLastBeaconTime] = useState(new Date())

  // GIG ECONOMY STATES
  const [currentOrder, setCurrentOrder] = useState(null)
  const [pendingOrders, setPendingOrders] = useState([])
  const [isCheckingOrders, setIsCheckingOrders] = useState(true)
  const [completedDeliveries, setCompletedDeliveries] = useState([
    { id: 'ORD-8821', from: 'Malleshwaram', to: 'Indiranagar', km: 9.4, payout: 165, time: '09:15 AM' },
    { id: 'ORD-8794', from: 'Koramangala', to: 'Jayanagar', km: 5.8, payout: 110, time: '08:30 AM' }
  ])
  
  // AI ETA PREDICTION STATE
  const [etaInfo, setEtaInfo] = useState(null)
  const [isLoadingETA, setIsLoadingETA] = useState(false)

  // Initialize Driver Profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        setDriverProfile({
          name: u.name || 'John Doe',
          email: u.email || 'driver1@pes.edu',
          vehicleId: u.vehicleId || 'VEH-9988',
          role: u.role || 'Driver'
        })
      }
    } catch (e) {
      console.warn("Failed to parse user profile:", e)
    }
  }, [])

  // 1. ORDER POLLING EFFECT (3000ms interval)
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token')
      try {
        const myOrderRes = await fetch('http://localhost:5000/api/orders/my-order', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const myOrder = await myOrderRes.json()
        
        if (myOrder) {
          setCurrentOrder(myOrder)
        } else {
          setCurrentOrder(null)
          const pendingRes = await fetch('http://localhost:5000/api/orders/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (pendingRes.ok) {
            setPendingOrders(await pendingRes.json())
          }
        }
      } catch (error) {
        console.error("Order sync failed:", error)
      } finally {
        setIsCheckingOrders(false)
      }
    }
    
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000) 
    return () => clearInterval(interval)
  }, [])

  // 2. LIVE GPS TRACKER EFFECT (With smart desktop simulation fallback)
  useEffect(() => {
    let watchId
    const token = localStorage.getItem('token')

    const transmitLocation = async (lat, lng) => {
      setCurrentLocation({ lat, lng })
      setLastBeaconTime(new Date())
      try {
        await fetch('http://localhost:5000/api/auth/location', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ lat, lng })
        })
      } catch (err) {
        // silently handle network glitches
      }
    }

    if (isGpsEnabled) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setGpsSimulated(false)
            transmitLocation(position.coords.latitude, position.coords.longitude)
          },
          () => {
            // Fallback to Bengaluru zone simulation if permission denied or desktop
            setGpsSimulated(true)
            const base = BENGALURU_ZONES[currentOrder?.pickup_area || "Indiranagar"] || { lat: 12.9784, lng: 77.6408 }
            // Add subtle live drift
            const jitterLat = base.lat + (Math.random() - 0.5) * 0.003
            const jitterLng = base.lng + (Math.random() - 0.5) * 0.003
            transmitLocation(jitterLat, jitterLng)
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )
      } else {
        setGpsSimulated(true)
        transmitLocation(12.9784, 77.6408)
      }
    }

    return () => { 
      if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId) 
    }
  }, [isGpsEnabled, currentOrder?.pickup_area])

  // 3. AI ETA PREDICTION EFFECT (FastAPI :8001)
  useEffect(() => {
    if (currentOrder && currentOrder.status === 'Picked_Up') {
      setIsLoadingETA(true)
      const fetchETA = async () => {
        try {
          const response = await fetch('http://localhost:8001/predict_eta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              distance_km: currentOrder.distance_km || 6.5,
              restaurant_preparation_time_minutes: 15.0,
              delivery_partner_experience_months: 24,
              weather: currentOrder.weather || 'Clear',
              traffic_level: currentOrder.traffic_level || 'Medium'
            })
          })
          const data = await response.json()
          setEtaInfo(data)
        } catch (error) {
          console.error("Failed to fetch ETA:", error)
        } finally {
          setIsLoadingETA(false)
        }
      }
      fetchETA()
    }
  }, [currentOrder?.status, currentOrder?.distance_km, currentOrder?.weather, currentOrder?.traffic_level])

  // Actions
  const handleClaimOrder = async (orderId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/claim`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setCurrentOrder(await res.json())
      else alert((await res.json()).message) 
    } catch (err) { console.error(err) }
  }

  const handlePickupOrder = async () => {
    if (!currentOrder) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${currentOrder._id}/pickup`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setCurrentOrder(await res.json())
    } catch (err) { console.error(err) }
  }

  const handleCompleteOrder = async () => {
    if (!currentOrder) return
    const token = localStorage.getItem('token')
    const completedRecord = {
      id: currentOrder.order_id,
      from: currentOrder.pickup_area,
      to: currentOrder.delivery_area,
      km: currentOrder.distance_km,
      payout: Math.round(50 + (currentOrder.distance_km * 14)),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    try {
      await fetch(`http://localhost:5000/api/orders/${currentOrder._id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setCompletedDeliveries(prev => [completedRecord, ...prev])
      setCurrentOrder(null)
      setEtaInfo(null)
    } catch (err) { console.error(err) }
  }

  // Calculate Shift Earnings
  const totalShiftEarnings = completedDeliveries.reduce((sum, item) => sum + item.payout, 0) + 150 // base daily incentive

  if (isCheckingOrders) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-400" size={32}/>
        </div>
        <p className="text-sm font-semibold text-slate-400">Connecting to VEHLOG Driver Stream...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-hidden select-none">
      
      {/* ======================================================== */}
      {/* SIDEBAR NAVIGATION                                       */}
      {/* ======================================================== */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 relative z-30">
        
        <div>
          {/* Top Brand Header */}
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
                    Driver
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Gig Partner Workspace</p>
              </div>
            </div>
          </div>

          {/* Active Driver Profile Pill */}
          <div className="mx-4 mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                {driverProfile.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">{driverProfile.name}</p>
                <div className="flex items-center space-x-1.5 mt-1 font-mono text-[10px]">
                  <span className="text-slate-400">{driverProfile.vehicleId}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400">Online</span>
                </div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* GPS Hardware Telemetry Card in Sidebar */}
          <div className="mx-4 mt-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio size={14} className={isGpsEnabled ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                <span className="text-xs font-semibold text-slate-300">Hardware GPS</span>
              </div>
              <button 
                onClick={() => setIsGpsEnabled(!isGpsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  isGpsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isGpsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {isGpsEnabled && (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
                <span className="text-emerald-400">{gpsSimulated ? 'Simulated' : 'Live Sync'}</span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 mt-2">
            <button
              onClick={() => setActiveTab('gig')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'gig'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Navigation size={18} className={activeTab === 'gig' ? 'text-emerald-400' : ''} />
                <span>Active Gig Trip</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                currentOrder 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentOrder ? currentOrder.status : 'Listening'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Compass size={18} className={activeTab === 'map' ? 'text-emerald-400' : ''} />
                <span>Geospatial Map</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Bengaluru
              </span>
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'earnings'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp size={18} className={activeTab === 'earnings' ? 'text-emerald-400' : ''} />
                <span>Shift Earnings</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                ₹{totalShiftEarnings}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`w-full px-4 py-3 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Activity size={18} className={activeTab === 'telemetry' ? 'text-emerald-400' : ''} />
                <span>Hardware Telemetry</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                Active
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom & Shift Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Shift Time:</span>
              <strong className="text-white font-mono">3h 45m</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Completed Gigs:</span>
              <strong className="text-emerald-400 font-mono">{completedDeliveries.length} Delivered</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Driver Rating:</span>
              <strong className="text-amber-400">★ 4.96</strong>
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
            <LogOut size={16} /> <span>End Shift</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN DRIVER WORKSPACE                                    */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 z-20 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-0.5">
              <span>VEHLOG Partner Portal</span>
              <span>/</span>
              <span className="text-emerald-400 font-medium capitalize">
                {activeTab === 'gig' && 'Live Gig Navigation & Dispatch'}
                {activeTab === 'map' && 'Geospatial Route Telemetry'}
                {activeTab === 'earnings' && 'Payout Ledger & Incentives'}
                {activeTab === 'telemetry' && 'Hardware GPS Beacon Diagnostics'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {activeTab === 'gig' && (currentOrder ? `Delivery #${currentOrder.order_id}` : 'Order Hunting & Broadcasts')}
              {activeTab === 'map' && 'Live Route & Destination Radar'}
              {activeTab === 'earnings' && 'Today\'s Earnings & Trip History'}
              {activeTab === 'telemetry' && 'Device Hardware & GPS Stream'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live GPS Beacon indicator */}
            <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>GPS Transmit Active</span>
              <span className="text-slate-500 font-mono text-[10px]">({lastBeaconTime.toLocaleTimeString()})</span>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          
          {/* ======================================================== */}
          {/* TAB 1: ACTIVE GIG TRIP & BROADCAST POOL                  */}
          {/* ======================================================== */}
          {activeTab === 'gig' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* STATE A: NO ACTIVE ORDER -> LISTENING FOR BROADCASTS */}
              {!currentOrder && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  
                  {/* Radar Scanning Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        <Zap size={14} className="animate-pulse" />
                        <span>Live Broadcast Stream Active</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Listening for Dispatch Calls
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
                        Orders created in OpsCenter broadcast in real-time. Fast claim engine: first driver to accept locks the order.
                      </p>
                    </div>

                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                      <div className="absolute inset-3 rounded-full border border-teal-500/40" />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Radio size={24} className="animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Orders Pool List */}
                  {pendingOrders.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                        <Package size={28} />
                      </div>
                      <h3 className="text-base font-bold text-white">No Pending Orders Right Now</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Standing by in your Bengaluru sector. New orders will immediately appear here as soon as dispatched by the Operations Manager.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
                          Available Gigs ({pendingOrders.length})
                        </h3>
                        <span className="text-xs text-emerald-400 font-mono">Tap Accept to Claim</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingOrders.map(order => {
                          const estPayout = Math.round(50 + ((order.distance_km || 5) * 14))
                          return (
                            <div 
                              key={order._id}
                              className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all shadow-xl group space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  {order.order_id}
                                </span>
                                <div className="text-right">
                                  <span className="text-lg font-black text-white font-mono">₹{estPayout}</span>
                                  <span className="text-[10px] text-slate-400 block font-medium">Estimated Payout</span>
                                </div>
                              </div>

                              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/60 space-y-2">
                                <div className="flex items-center space-x-2 text-xs">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span className="text-slate-400 font-medium">Pickup:</span>
                                  <span className="text-white font-bold">{order.pickup_area}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs">
                                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                  <span className="text-slate-400 font-medium">Drop-off:</span>
                                  <span className="text-white font-bold">{order.delivery_area}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                                  <MapPin size={13} /> {order.distance_km} km
                                </span>
                                <span className="flex items-center gap-1">
                                  {order.weather === 'Rain' ? '🌧️ Rain' : '☀️ Clear'} · {order.traffic_level} Traffic
                                </span>
                              </div>

                              <button
                                onClick={() => handleClaimOrder(order._id)}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
                              >
                                <span>Claim Order &amp; Start Trip</span>
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* STATE B & C: ACTIVE ORDER NAVIGATION ROUTE */}
              {currentOrder && (
                <div className="max-w-3xl mx-auto space-y-6">
                  
                  {/* Delivery Phase Progress Header */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl font-black text-white font-mono">{currentOrder.order_id}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                            {currentOrder.distance_km} km
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {currentOrder.status === 'Active' 
                            ? 'Phase 1: Transit to Restaurant / Pickup Zone' 
                            : 'Phase 2: Final Countdown Delivery to Customer'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          currentOrder.status === 'Active'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {currentOrder.status === 'Active' ? 'Heading to Restaurant' : 'On Final Delivery'}
                        </span>
                      </div>
                    </div>

                    {/* Step Visual Progression */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentOrder.status === 'Active'
                          ? 'bg-blue-500/10 border-blue-500/40'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                          <span className="text-xs font-bold text-white">Pickup Restaurant</span>
                        </div>
                        <p className="text-sm font-bold text-slate-200 truncate">{currentOrder.pickup_area}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Collect verified food package</p>
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentOrder.status === 'Picked_Up'
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span className="text-xs font-bold text-white">Customer Drop-off</span>
                        </div>
                        <p className="text-sm font-bold text-slate-200 truncate">{currentOrder.delivery_area}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Deliver &amp; mark completed</p>
                      </div>
                    </div>
                  </div>

                  {/* AI ETA CARD (Shows real-time predicted ETA when Picked_Up) */}
                  {currentOrder.status === 'Picked_Up' && (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 fade-in duration-500">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                            <Clock size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">AI Predicted ETA to Customer</h3>
                            <p className="text-xs text-slate-400">Random Forest Inference from FastAPI :8001</p>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono">Real-time</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                        <div className="sm:col-span-1 text-center sm:text-left">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Estimated Time
                          </p>
                          {isLoadingETA || !etaInfo ? (
                            <div className="flex items-center space-x-2 text-slate-400 py-2">
                              <Loader2 size={24} className="animate-spin text-emerald-400" />
                              <span className="text-sm font-medium">Computing...</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline space-x-2">
                              <span className={`text-6xl font-black font-mono tracking-tight ${
                                currentOrder.late_delivery === 1 ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {Math.round(etaInfo.predicted_eta_minutes)}
                              </span>
                              <span className="text-xl font-bold text-slate-400">min</span>
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-2 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                              <span className="text-slate-400 block mb-0.5">Weather Context:</span>
                              <strong className="text-white font-medium">
                                {currentOrder.weather === 'Rain' ? '🌧️ Rain' : '☀️ Clear'}
                              </strong>
                            </div>
                            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                              <span className="text-slate-400 block mb-0.5">Traffic Density:</span>
                              <strong className="text-white font-medium">{currentOrder.traffic_level} Traffic</strong>
                            </div>
                          </div>

                          <div>
                            {currentOrder.late_delivery === 1 ? (
                              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-medium flex items-center gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>High Traffic Delay Predicted (&gt;40m). OpsCenter has been notified.</span>
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                                <CheckCircle2 size={16} className="shrink-0" />
                                <span>Optimal Route. You are on track for an on-time delivery bonus!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Action Buttons */}
                  <div>
                    {currentOrder.status === 'Active' ? (
                      <button 
                        onClick={handlePickupOrder}
                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
                      >
                        <ArrowRightCircle size={20} />
                        <span>Confirm Package Picked Up from {currentOrder.pickup_area}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={handleCompleteOrder}
                        className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] animate-pulse"
                      >
                        <CheckCircle2 size={20} />
                        <span>Mark Order as Delivered (Complete Gig)</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GEOSPATIAL MAP VIEW                               */}
          {/* ======================================================== */}
          {activeTab === 'map' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Compass size={20} className="text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Bengaluru Driver Telemetry Radar</h3>
                    <p className="text-xs text-slate-400">Real-time driver location pin &amp; destination zone</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </span>
              </div>

              <div className="h-[560px] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
                <MapContainer 
                  center={[currentLocation.lat, currentLocation.lng]} 
                  zoom={13} 
                  scrollWheelZoom={true} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  />

                  {/* Driver Pin */}
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={driverIcon}>
                    <Popup>
                      <div className="p-1 font-sans">
                        <h4 className="font-bold text-slate-900 text-sm">🚚 Your Vehicle</h4>
                        <p className="text-xs text-slate-600">{driverProfile.vehicleId}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">Live GPS Beacon Transmitting</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Destination Marker if active order */}
                  {currentOrder && (
                    <Marker 
                      position={[
                        BENGALURU_ZONES[currentOrder.delivery_area]?.lat || 12.9279,
                        BENGALURU_ZONES[currentOrder.delivery_area]?.lng || 77.6271
                      ]} 
                      icon={destinationIcon}
                    >
                      <Popup>
                        <div className="p-1 font-sans">
                          <h4 className="font-bold text-slate-900 text-sm">📍 Delivery Zone</h4>
                          <p className="text-xs text-slate-600">{currentOrder.delivery_area}</p>
                          <p className="text-[11px] text-cyan-600 font-semibold mt-1">{currentOrder.distance_km} km away</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SHIFT EARNINGS & TRIP HISTORY                    */}
          {/* ======================================================== */}
          {activeTab === 'earnings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                  <span className="text-xs font-semibold text-slate-400">Total Shift Payout</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-black text-emerald-400 font-mono">₹{totalShiftEarnings}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Including ₹150 daily completion bonus</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                  <span className="text-xs font-semibold text-slate-400">Completed Orders</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-black text-white font-mono">{completedDeliveries.length}</span>
                    <span className="text-xs text-teal-400 font-bold">Trips</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">100% On-Time Delivery Performance</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                  <span className="text-xs font-semibold text-slate-400">Total Distance Logged</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-black text-cyan-400 font-mono">
                      {completedDeliveries.reduce((sum, item) => sum + item.km, 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">km</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Fuel Efficiency: High</p>
                </div>
              </div>

              {/* Trip Receipts Table */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Shift Delivery Receipts</h3>
                  <span className="text-xs text-slate-400 font-mono">Today</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                        <th className="px-6 py-3.5">Order ID</th>
                        <th className="px-6 py-3.5">Zone Route</th>
                        <th className="px-6 py-3.5">Road Distance</th>
                        <th className="px-6 py-3.5">Delivery Time</th>
                        <th className="px-6 py-3.5 text-right">Trip Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {completedDeliveries.map((trip) => (
                        <tr key={trip.id} className="hover:bg-slate-800/30 transition">
                          <td className="px-6 py-4 font-bold text-white font-mono">{trip.id}</td>
                          <td className="px-6 py-4">
                            <span className="text-slate-300">{trip.from}</span>
                            <span className="text-emerald-400 mx-1.5">➔</span>
                            <span className="text-white font-semibold">{trip.to}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-cyan-400">{trip.km} km</td>
                          <td className="px-6 py-4 text-slate-400 font-mono">{trip.time}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-400 font-mono text-sm">
                            ₹{trip.payout}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: HARDWARE & TELEMETRY DIAGNOSTICS                  */}
          {/* ======================================================== */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hardware GPS Transmit Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <Radio size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Hardware GPS Sensor</h3>
                        <p className="text-xs text-slate-400">Browser HTML5 Geolocation API</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Current Latitude:</span>
                      <strong className="text-white font-mono">{currentLocation.lat.toFixed(6)}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Current Longitude:</span>
                      <strong className="text-white font-mono">{currentLocation.lng.toFixed(6)}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Polling Interval:</span>
                      <strong className="text-teal-400 font-mono">3000 ms</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Sensor Mode:</span>
                      <strong className="text-emerald-400 font-mono">{gpsSimulated ? 'Local Drift Fallback' : 'Physical GPS'}</strong>
                    </div>
                  </div>
                </div>

                {/* Device & Vehicle Telemetry */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Assigned Vehicle</h3>
                        <p className="text-xs text-slate-400">Fleet telemetry profile</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
                      {driverProfile.vehicleId}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">API Connection Node:</span>
                      <strong className="text-white font-mono">http://localhost:5000</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Driver Experience:</span>
                      <strong className="text-white">24 Months Senior Partner</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Device Battery Telemetry:</span>
                      <strong className="text-emerald-400 font-mono">92% Charged</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Session JWT Token:</span>
                      <strong className="text-teal-400 font-mono">Verified Active</strong>
                    </div>
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