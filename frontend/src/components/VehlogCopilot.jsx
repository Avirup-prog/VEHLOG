import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Sparkles,
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Shield,
  Activity,
  MapPin,
  Clock,
  ArrowRight,
  Zap,
  UserCheck,
  PackageCheck,
  CornerDownLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  Radio,
  HelpCircle,
  KeyRound,
  Info
} from 'lucide-react'

export default function VehlogCopilot() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Current session & role detection
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch (e) {
      return {}
    }
  })()

  // Detect active role from path or stored user
  const currentRole = (() => {
    if (location.pathname.startsWith('/manager')) return 'Manager'
    if (location.pathname.startsWith('/admin')) return 'Admin'
    if (location.pathname.startsWith('/driver')) return 'Driver'
    return storedUser.role || 'Guest'
  })()

  // Hide on login screen unless explicitly opened
  const isLoginPage = location.pathname === '/'

  // Initialize role-based greeting when role changes
  useEffect(() => {
    const greeting = getInitialGreeting(currentRole, storedUser.name)
    setMessages([
      {
        id: 'init-1',
        sender: 'ai',
        role: currentRole,
        text: greeting.text,
        action: null,
        suggestedFollowUps: greeting.followUps,
        timestamp: new Date()
      }
    ])
  }, [currentRole])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Initialize Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
        handleSendMessage(transcript)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Speech Synthesizer Helper
  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    // Strip markdown tags for clean audio speech
    const clean = text.replace(/[*#`_~]/g, '').slice(0, 200)
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser. You can type commands directly into the input!')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn('Speech recognition error:', err)
      }
    }
  }

  // Send message to Backend AI Copilot endpoint
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    const userMsgId = Date.now().toString()
    const newMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, newMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role: currentRole,
          user: storedUser
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'AI Copilot service unavailable')

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        role: currentRole,
        text: data.reply,
        action: data.action,
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, aiMsg])

      // Trigger automatic dashboard refresh event when actions mutate data!
      if (data.action && (data.action.type === 'ORDER_CREATED' || data.action.type === 'USER_PROVISIONED' || data.action.type === 'GIG_CLAIMED')) {
        window.dispatchEvent(new CustomEvent('vehlog:refresh', { detail: data.action }))
      }

      // Voice read-out if TTS is enabled
      speakText(data.reply)

      if (!isOpen) {
        setUnreadCount((c) => c + 1)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          role: currentRole,
          text: `⚠️ **Unable to reach Copilot engine**: ${err.message}. Please check if the Node.js backend is active on port 5000.`,
          action: null,
          suggestedFollowUps: ['Check system health', 'Give me shift performance brief'],
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Floating trigger button & active role badge metadata
  const roleBadgeConfig = {
    Manager: {
      title: 'Manager Ops Copilot',
      subtitle: 'Dispatch & Fleet Triage AI',
      color: 'from-emerald-500 to-teal-400',
      border: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Zap
    },
    Admin: {
      title: 'Admin Sentinel AI',
      subtitle: 'DevOps & Security Copilot',
      color: 'from-blue-500 to-cyan-400',
      border: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Shield
    },
    Driver: {
      title: 'Road Co-Pilot',
      subtitle: 'Hands-Free Delivery Assistant',
      color: 'from-amber-400 to-emerald-400',
      border: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Truck
    },
    Guest: {
      title: 'VEHLOG Brand Concierge',
      subtitle: 'Project Architecture & Brand FAQ',
      color: 'from-cyan-400 via-teal-400 to-emerald-400',
      border: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: HelpCircle
    }
  }

  const badge = roleBadgeConfig[currentRole] || roleBadgeConfig.Manager
  const BadgeIcon = badge.icon

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING COPILOT TRIGGER BUTTON (Bottom-Right)              */}
      {/* ============================================================== */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3">
          {/* Unread badge or prompt preview */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 px-3.5 py-2 rounded-2xl shadow-2xl text-xs text-slate-300 pointer-events-none animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-emerald-400">{badge.title}</span>
            <span className="text-slate-400">ready to assist</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true)
              setUnreadCount(0)
            }}
            aria-label="Open VEHLOG AI Copilot"
            className="group relative p-4 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
            <div className="relative flex items-center space-x-2">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
              <span className="font-extrabold text-sm tracking-wider uppercase pr-1">VEHLOG AI</span>
            </div>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. COPILOT FLOATING DRAWER PANEL                                */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isExpanded
              ? 'inset-4 md:inset-x-24 md:inset-y-8'
              : 'bottom-6 right-6 w-[94vw] md:w-[460px] h-[640px] max-h-[88vh]'
          } flex flex-col bg-slate-950/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/10`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border-b border-slate-800/80 flex items-center justify-between select-none">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-2xl bg-gradient-to-tr ${badge.color} text-slate-950 font-black shadow-md`}>
                <BadgeIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white tracking-wide flex items-center space-x-1.5">
                    <span>VEHLOG Copilot</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Active</span>
                    </span>
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {badge.title} • {badge.subtitle}
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center space-x-1 text-slate-400">
              {/* TTS Voice Toggle */}
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                title={ttsEnabled ? 'Mute AI Voice' : 'Enable AI Audio Voice'}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  ttsEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Expand / Shrink */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore Panel' : 'Maximize Panel'}
                className="p-2 rounded-xl hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Copilot"
                className="p-2 rounded-xl hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Role Quick Banner */}
          <div className="px-5 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="text-slate-500">Dashboard Context:</span>
              <span className={`px-2 py-0.5 rounded-lg border font-semibold ${badge.badgeBg}`}>
                {currentRole} Mode
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>FastAPI :8001 ML Linked</span>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-4 shadow-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold rounded-br-none shadow-emerald-500/10'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-none shadow-black/40'
                  }`}
                >
                  {/* Sender identity badge for AI */}
                  {msg.sender === 'ai' && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>VEHLOG AGENT</span>
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Render Message Body (Markdown formatted) */}
                  <div className="prose prose-invert prose-xs max-w-none">
                    {renderMarkdown(msg.text)}
                  </div>

                  {/* Render Structured Action Card if present */}
                  {msg.action && (
                    <ActionCard
                      action={msg.action}
                      currentRole={currentRole}
                      onTriggerRefresh={() => {
                        window.dispatchEvent(new CustomEvent('vehlog:refresh', { detail: msg.action }))
                      }}
                    />
                  )}
                </div>

                {/* Suggested Follow-up chips directly under AI response */}
                {msg.sender === 'ai' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestedFollowUps.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-[11px] px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-emerald-400 border border-slate-800/90 hover:border-emerald-500/40 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 flex items-center space-x-1"
                      >
                        <span>{chip}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing / Processing Loader */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 w-fit text-xs animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>VEHLOG Copilot reasoning and executing actions...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar (Above Input) */}
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto whitespace-nowrap flex space-x-2 scrollbar-none">
            {getQuickActionChips(currentRole).map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip.prompt)}
                className="text-[10px] font-medium px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center space-x-1.5 flex-shrink-0"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input & Voice Controls Bar */}
          <div className="p-3.5 bg-slate-900/90 border-t border-slate-800/90 flex items-center space-x-2">
            {/* Voice Mic Button */}
            <button
              onClick={toggleListening}
              title={isListening ? 'Stop Listening' : 'Speak to Copilot (Hands-Free)'}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                  : 'bg-slate-800/70 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border-slate-700/80'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex-1 flex items-center relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={getRolePlaceholder(currentRole)}
                className="w-full bg-slate-950/80 border border-slate-800/90 focus:border-emerald-500/50 rounded-2xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-1.5 p-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-teal-400 transition cursor-pointer shadow-md"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Render structured action cards emitted by the Copilot
 */
function ActionCard({ action, currentRole, onTriggerRefresh }) {
  if (!action) return null

  // 1. Order Created Card
  if (action.type === 'ORDER_CREATED' && action.order) {
    const o = action.order
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
          <span className="flex items-center space-x-1.5">
            <PackageCheck className="w-4 h-4" />
            <span>DISPATCH TICKET ISSUED</span>
          </span>
          <span className="font-mono text-white bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
            {o.order_id}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Pickup Hub</span>
            <span className="font-bold text-white">{o.pickup_area}</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Delivery Zone</span>
            <span className="font-bold text-white">{o.delivery_area}</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Calculated Distance</span>
            <span className="font-bold text-teal-400">{o.distance_km} km</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Current Status</span>
            <span className="font-bold text-amber-400">{o.status}</span>
          </div>
        </div>
        <button
          onClick={onTriggerRefresh}
          className="w-full mt-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-500/40 transition cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Synchronize Live Order Feed</span>
        </button>
      </div>
    )
  }

  // 2. User Provisioned Card
  if (action.type === 'USER_PROVISIONED' && action.user) {
    const u = action.user
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
          <span className="flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4" />
            <span>ACCOUNT PROVISIONED</span>
          </span>
          <span className="font-mono text-white bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30">
            {u.role}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono">
          <div><span className="text-slate-500">Name:</span> <span className="text-white font-bold">{u.name}</span></div>
          <div><span className="text-slate-500">Email:</span> <span className="text-cyan-300">{u.email}</span></div>
          <div><span className="text-slate-500">Policy:</span> <span className="text-emerald-400">Single-Role Validated ✓</span></div>
        </div>
        <button
          onClick={onTriggerRefresh}
          className="w-full mt-1 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[10px] rounded-lg border border-cyan-500/40 transition cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload Employee Directory</span>
        </button>
      </div>
    )
  }

  // 3. Security Alert Card
  if (action.type === 'SECURITY_ALERT') {
    return (
      <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-[11px] text-rose-300 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-white block">Security Policy Exception</span>
          <span>{action.error}</span>
        </div>
      </div>
    )
  }

  // 4. Gig Claimed Card for Drivers
  if (action.type === 'GIG_CLAIMED' && action.order) {
    const o = action.order
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
          <span className="flex items-center space-x-1.5">
            <Truck className="w-4 h-4" />
            <span>ACTIVE GIG ASSIGNED</span>
          </span>
          <span className="text-white font-mono bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
            {o.order_id}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 space-y-1">
          <div>Pickup: <span className="font-bold text-white">{o.pickup_area}</span></div>
          <div>Destination: <span className="font-bold text-white">{o.delivery_area}</span></div>
          <div>Distance: <span className="font-bold text-amber-400">{o.distance_km} km</span></div>
        </div>
        <button
          onClick={onTriggerRefresh}
          className="w-full mt-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg transition cursor-pointer flex items-center justify-center space-x-1"
        >
          <span>Open Turn-by-Turn Navigation</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    )
  }

  // 5. System Health Probe Grid
  if (action.type === 'HEALTH_PROBE') {
    return (
      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 text-[10px]">
        <div className="flex items-center justify-between font-bold text-cyan-400">
          <span className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5" />
            <span>MICROSERVICES TELEMETRY</span>
          </span>
          <span className="text-emerald-400">ALL SYSTEMS HEALTHY</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-slate-300">
          <div className="p-1.5 bg-slate-900 rounded border border-slate-800 flex justify-between">
            <span>FastAPI (:8001)</span>
            <span className={action.aiOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {action.aiOnline ? 'ONLINE' : 'CHECK'}
            </span>
          </div>
          <div className="p-1.5 bg-slate-900 rounded border border-slate-800 flex justify-between">
            <span>Node.js (:5000)</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="p-1.5 bg-slate-900 rounded border border-slate-800 flex justify-between">
            <span>MongoDB (:27017)</span>
            <span className="text-emerald-400 font-bold">CONNECTED</span>
          </div>
          <div className="p-1.5 bg-slate-900 rounded border border-slate-800 flex justify-between">
            <span>Random Forest Model</span>
            <span className="text-cyan-400 font-bold">LOADED</span>
          </div>
        </div>
      </div>
    )
  }

  // 6. Demo Credentials 1-Click Fill Card for Brand & Project FAQ
  if (action.type === 'CREDENTIAL_PREVIEW') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
          <span className="flex items-center space-x-1.5">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>1-CLICK DEMO ACCOUNT AUTOFILL</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Pass: password123</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Click any preset to fill credentials into the login form automatically:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('vehlog:fill-credentials', { detail: { email: 'manager@pes.edu' } }))}
            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] rounded-lg border border-emerald-500/40 text-center transition cursor-pointer active:scale-95"
          >
            ⚡ Manager
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('vehlog:fill-credentials', { detail: { email: 'admin@pes.edu' } }))}
            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] rounded-lg border border-cyan-500/40 text-center transition cursor-pointer active:scale-95"
          >
            🛡️ Admin
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('vehlog:fill-credentials', { detail: { email: 'driver1@pes.edu' } }))}
            className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/40 text-center transition cursor-pointer active:scale-95"
          >
            🚚 Driver
          </button>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Lightweight Markdown Formatter
 */
function renderMarkdown(content) {
  if (!content) return null

  // Split lines
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-1" />

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-xs font-black text-white mt-1 mb-0.5 tracking-wide">
              {trimmed.replace('### ', '')}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="text-sm font-black text-emerald-400 mt-1 mb-0.5">
              {trimmed.replace('## ', '')}
            </h3>
          )
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2)
          return (
            <div key={i} className="flex items-start space-x-1.5 ml-1">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
            </div>
          )
        }

        // Standard paragraph
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      })}
    </div>
  )
}

function formatInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[10px]">$1</code>')
}

function getInitialGreeting(role, userName) {
  const name = userName ? ` ${userName}` : ''
  if (role === 'Manager') {
    return {
      text: `### ⚡ Welcome to VEHLOG OpsCenter${name}!\nI am your Fleet Copilot. I can dispatch shipments, calculate ML ETAs, triage delayed orders, and rebalance driver capacity. How can I help you right now?`,
      followUps: [
        '⚡ Dispatch order from Indiranagar to Whitefield',
        '⚠️ Triage delayed orders',
        '📍 Find idle drivers',
        '📊 Executive shift brief'
      ]
    }
  }
  if (role === 'Admin') {
    return {
      text: `### 🛡️ VEHLOG Sentinel AI Active${name}.\nI oversee system security, employee provisioning with single-role verification, and microservice telemetry. What operation would you like to run?`,
      followUps: [
        '👤 Provision driver account for Deepak',
        '🛡️ Audit security access logs',
        '🩺 Check system & ML health',
        '👥 List all registered users'
      ]
    }
  }
  if (role === 'Driver') {
    return {
      text: `### 🚚 Road Co-Pilot Ready${name}!\nI provide hands-free voice assistance on the road. Say or type your command to accept gigs, confirm pickups, or inspect route weather.`,
      followUps: [
        '📦 Accept closest gig',
        '⏱️ Reached pickup location',
        '💰 Check today\'s incentive progress',
        '🌦️ Live road & weather advisory'
      ]
    }
  }
  return {
    text: `### 🚀 Welcome to VEHLOG!\nI am your **Project & Brand Concierge**. Before you log in, I can explain the platform's **Random Forest ML models**, **single-role security**, **the 3 portal dashboards**, or provide **one-click evaluation credentials**.\n\nAsk me anything about VEHLOG or tap one of the FAQs below!`,
    followUps: [
      '❓ What is VEHLOG and what problem does it solve?',
      '🧠 How does the AI ETA prediction model work?',
      '🏢 What are the three portals and roles in VEHLOG?',
      '🔑 What are the sample login credentials for evaluation?',
      '🛡️ How does single-role email authentication work?'
    ]
  }
}

function getQuickActionChips(role) {
  if (role === 'Guest') {
    return [
      { icon: '❓', label: 'What is VEHLOG?', prompt: 'What is VEHLOG and what problem does it solve?' },
      { icon: '🧠', label: 'AI ETA Model', prompt: 'How does the Random Forest ML ETA prediction model work?' },
      { icon: '🏢', label: '3 Portals', prompt: 'What are the three portals and roles in VEHLOG?' },
      { icon: '🔑', label: 'Demo Accounts', prompt: 'What are the sample login credentials for evaluation?' },
      { icon: '🛡️', label: 'Security Policy', prompt: 'How does the single-role email authentication work?' },
      { icon: '⚡', label: 'Tech Stack', prompt: 'What is the complete technology stack used to build VEHLOG?' }
    ]
  }
  if (role === 'Manager') {
    return [
      { icon: '⚡', label: 'Urgent Dispatch', prompt: 'Dispatch urgent order from Indiranagar to Whitefield in heavy rain' },
      { icon: '⚠️', label: 'Triage Delays', prompt: 'Triage delayed orders and explain risk factors' },
      { icon: '📍', label: 'Idle Drivers', prompt: 'Find idle drivers near Koramangala' },
      { icon: '📊', label: 'Shift Brief', prompt: 'Give me today shift performance brief' },
      { icon: '📱', label: 'Draft Apology', prompt: 'Draft customer apology SMS for delivery delay' }
    ]
  }
  if (role === 'Admin') {
    return [
      { icon: '👤', label: 'Add Driver', prompt: 'Create driver account for Rajesh at rajesh.d@pes.edu' },
      { icon: '🛡️', label: 'Audit Security', prompt: 'Audit security access logs and single-role compliance' },
      { icon: '🩺', label: 'Probe ML & DB', prompt: 'Check system health and ping FastAPI port 8001' },
      { icon: '👥', label: 'User Directory', prompt: 'List all registered employees' }
    ]
  }
  return [
    { icon: '📦', label: 'Claim Gig', prompt: 'Accept closest gig' },
    { icon: '⏱️', label: 'Reached Pickup', prompt: 'I have arrived at pickup location' },
    { icon: '🏁', label: 'Mark Delivered', prompt: 'I have completed delivery' },
    { icon: '💰', label: 'Bonus Target', prompt: 'How many trips left to unlock today bonus?' },
    { icon: '🌦️', label: 'Road Advisory', prompt: 'Is my delivery route clear?' },
    { icon: '🚨', label: 'SOS', prompt: 'Emergency breakdown roadside assistance' }
  ]
}

function getRolePlaceholder(role) {
  if (role === 'Guest') return 'Ask about VEHLOG, ML models, portals, or demo accounts...'
  if (role === 'Manager') return 'Type or speak e.g. "Dispatch order to Whitefield" or "Triage delays"...'
  if (role === 'Admin') return 'Type or speak e.g. "Create driver Rohit at rohit@pes.edu" or "Audit logs"...'
  if (role === 'Driver') return 'Type or speak e.g. "Accept gig" or "Reached pickup" or "Incentive status"...'
  return 'Ask VEHLOG Copilot anything...'
}
