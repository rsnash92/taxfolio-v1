interface LandingPageProps {
  onLogin: () => void
  onSignup: () => void
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">
            🇬🇧 UK's <span className="gradient-text">#1</span> Crypto Tax Calculator
          </h1>
          <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Calculate your cryptocurrency taxes with precision. HMRC compliant, 
            beginner-friendly, and built specifically for UK traders.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={onSignup}
              className="btn-primary-dark px-8 py-4 rounded-xl text-lg font-semibold"
            >
              Get Started Free
            </button>
            <button 
              onClick={onLogin}
              className="btn-secondary-dark px-8 py-4 rounded-xl text-lg font-semibold"
            >
              Login
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="card-dark p-8 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-3">HMRC Compliant</h3>
            <p className="text-dark-300">
              Built specifically for UK tax rules including same-day matching, 
              30-day rules, and Section 104 pooling.
            </p>
          </div>
          
          <div className="card-dark p-8 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-3">Bank-Level Security</h3>
            <p className="text-dark-300">
              Your data is encrypted and secure. We never store your private keys 
              or exchange credentials.
            </p>
          </div>
          
          <div className="card-dark p-8 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
            <p className="text-dark-300">
              Generate your complete tax report in minutes, not hours. 
              Perfect for Self Assessment deadlines.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}