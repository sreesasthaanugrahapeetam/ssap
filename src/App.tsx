import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminApp from './admin/AdminApp'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
