import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 px-4 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 md:text-6xl">
              Welcome to Tapper
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with like-minded people through sports and professional
              networking
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 md:py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">Features</h2>
            <p className="text-muted-foreground">
              Discover what makes Tapper special
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sports Matching</CardTitle>
                <CardDescription>
                  Find people who share your sports interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with athletes and sports enthusiasts in your area
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Professional Network</CardTitle>
                <CardDescription>
                  Build your professional network through sports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Meet professionals who share your passion for sports
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Event Organization</CardTitle>
                <CardDescription>Create and join sports events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organize tournaments, training sessions, and casual games
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">Our Impact</h2>
            <p className="text-muted-foreground">
              Join thousands of active users
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2 md:text-4xl">
                10K+
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2 md:text-4xl">
                500+
              </div>
              <div className="text-sm text-muted-foreground">
                Events Created
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2 md:text-4xl">
                50+
              </div>
              <div className="text-sm text-muted-foreground">
                Sports Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2 md:text-4xl">
                95%
              </div>
              <div className="text-sm text-muted-foreground">
                User Satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join our community and start connecting with people who share your
            passion for sports
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
            <button className="px-8 py-3 bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors">
              Get Started
            </button>
            <button className="px-8 py-3 border border-primary-foreground/20 rounded-lg font-medium hover:bg-primary-foreground/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
