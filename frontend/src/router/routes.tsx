import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import { Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Registration />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}

export default AppRoutes
