export const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold md:text-6xl text-foreground">
          Welcome to Tapper
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect with like-minded people through sports and professional
          networking
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
          <a
            href="/login"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="px-8 py-3 border border-input rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}
