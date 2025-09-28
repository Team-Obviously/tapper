import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import MyTags from '@/pages/MyTags'
import Explore from '@/pages/Explore'
import Profile from '@/pages/Profile'
import UserProfile from '@/pages/UserProfile'
import ZkPdfVerification from '@/pages/ZkPdfVerification'
import Notifications from '@/pages/Notifications'
import { BrowserRouterProps, createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/Layout'
const AppRoutes: BrowserRouterProps = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/register',
    element: <Registration />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      {
        path: '/dashboard',
        element: <Home />,
      },
      {
        path: '/dashboard/home',
        element: <Home />,
      },
      {
        path: '/dashboard/my-tags',
        element: <MyTags />,
      },
      {
        path: '/dashboard/explore',
        element: <Explore />,
      },
      {
        path: '/dashboard/profile',
        element: <Profile />,
      },
      {
        path: '/dashboard/user/:userId',
        element: <UserProfile />,
      },
      {
        path: '/dashboard/zkpdf',
        element: <ZkPdfVerification />,
      },
      {
        path: '/dashboard/notifications',
        element: <Notifications />,
      },
    ],
  },
])

export default AppRoutes
