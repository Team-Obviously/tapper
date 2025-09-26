import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from '@/router/routes'
import Layout from '@/components/Layout'
import { CommandMenu } from '@/components/CommandMenu'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <Router>
      <Layout>
        <CommandMenu />
        <AppRoutes />
        <Toaster />
      </Layout>
    </Router>
  )
}

export default App
