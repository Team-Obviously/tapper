import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import {
  Home,
  Tag,
  User,
  LogOut,
  Search
} from 'lucide-react'

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Tags', href: '/dashboard/my-tags', icon: Tag },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Explore', href: '/dashboard/explore', icon: Search },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <>
      {/* Mobile Bottom Tab Navigation */}
      <div className="lg:hidden">
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center min-h-[60px] min-w-[60px] px-3 py-2 rounded-lg transition-colors ${isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-xs font-medium leading-tight text-center">
                    {item.name}
                  </span>
                </Link>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center min-h-[60px] min-w-[60px] px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <LogOut className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight text-center">
                Sign Out
              </span>
            </Button>
          </div>
        </nav>
      </div>

      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <div className="fixed left-0 top-0 h-full w-64 bg-background border-r z-40">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b">
              <Link to="/" className="text-2xl font-bold text-primary">
                Tapper
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 py-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
