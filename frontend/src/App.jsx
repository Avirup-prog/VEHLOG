import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ManagerDashboard from './pages/ManagerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'
import VehlogCopilot from './components/VehlogCopilot'

function App() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
      </Routes>
      <VehlogCopilot />
    </div>
  )
}

export default App;
