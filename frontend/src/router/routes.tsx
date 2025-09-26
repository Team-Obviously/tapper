import { Landing } from '@/pages/Landing'
import Registration from '@/pages/Registration'
import Home from '@/pages/Home'
import MyTags from '@/pages/MyTags'
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
      }
    ]
  },
  
])


export default AppRoutes
