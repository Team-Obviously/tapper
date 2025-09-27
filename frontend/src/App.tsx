import { BrowserRouter as Router, RouterProvider } from 'react-router-dom'
import AppRoutes from '@/router/routes'
import { CommandMenu } from '@/components/CommandMenu'
import { Toaster } from '@/components/ui/sonner'
import { WagmiProviderWrapper } from '@/components/WagmiProvider'

function App() {
  return (
    <WagmiProviderWrapper>
      <CommandMenu />
      {/* @ts-ignore */}
      <RouterProvider router={AppRoutes} />
      <Toaster /> 
    </WagmiProviderWrapper>
  )
}

export default App
