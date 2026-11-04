import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const StyleGuide = lazy(() => import('./pages/StyleGuide'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/styleguide" element={<StyleGuide />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Suspense>
  )
}
