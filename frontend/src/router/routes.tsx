import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import Home from '@/pages/Home'
import MyTags from '@/pages/MyTags'
import Explore from '@/pages/Explore'
import { BrowserRouterProps, createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/Layout'
const AppRoutes: BrowserRouterProps = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: '/register',
    element: <Registration />
  },
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      {
        path: '/dashboard',
        element: <Home />
      },
      {
        path: '/dashboard/home',
        element: <Home />
      },
      {
        path: '/dashboard/my-tags',
        element: <MyTags />
      },
      {
        path: '/dashboard/explore',
        element: <Explore />
      }
    ]
  },

])


export default AppRoutes
