import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import MyTags from '@/pages/MyTags'
import Explore from '@/pages/Explore'
import Profile from '@/pages/Profile'
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
    ],
  },
])

export default AppRoutes
