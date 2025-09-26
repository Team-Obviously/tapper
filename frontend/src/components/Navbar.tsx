import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import {
  Menu,
  X,
  Home,
  Tag,
  User,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Tags', href: '/my-tags', icon: Tag },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const closeNavbar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-background border-b">
          <Link to="/" className="text-xl font-bold text-primary">
            Tapper
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <Link
                    to="/"
                    onClick={closeNavbar}
                    className="text-xl font-bold text-primary"
                  >
                    Tapper
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeNavbar}
                    className="md:hidden"
                  >
                    <X className="h-6 w-6" />
                  </Button>
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
                            onClick={closeNavbar}
                            className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                            {isActive && (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
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
            </SheetContent>
          </Sheet>
        </div>
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
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
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
