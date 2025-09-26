import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import Home from '@/pages/Home'
import MyTags from '@/pages/MyTags'
import { Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/my-tags" element={<MyTags />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}

export default AppRoutes
