import { BrowserRouter as Router, RouterProvider } from 'react-router-dom'
import AppRoutes from '@/router/routes'
import { CommandMenu } from '@/components/CommandMenu'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>  
        <CommandMenu />
        {/* @ts-ignore */}
        <RouterProvider router={AppRoutes} />
        <Toaster /> 
    </>
  )
}

export default App
