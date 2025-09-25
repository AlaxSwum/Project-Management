'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function WelcomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5ED] font-inter">
      {/* Professional Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-[#FFB333] to-[#FFD480] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">PM System</h1>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About</a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="btn-ghost">
                Sign In
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-[#FFB333] hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-[#FFB333] transition-all duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 z-50">
              <div className="bg-white shadow-lg border-t border-gray-200 rounded-b-lg mx-4">
                <div className="px-4 py-3 space-y-2">
                  <a 
                    href="#features" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#FFB333] hover:bg-orange-50 rounded-lg transition-all duration-200"
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#FFB333] hover:bg-orange-50 rounded-lg transition-all duration-200"
                  >
                    Pricing
                  </a>
                  <a 
                    href="#about" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#FFB333] hover:bg-orange-50 rounded-lg transition-all duration-200"
                  >
                    About
                  </a>
                  <div className="pt-3 border-t border-gray-100">
                    <Link 
                      href="/login" 
                      className="block w-full text-center bg-gradient-to-r from-[#FFB333] to-[#FFD480] text-white px-4 py-3 rounded-lg font-semibold hover:from-[#F29F0A] hover:to-[#FFB333] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#FFB333] to-[#FFD480] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Professional Project
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB333] to-[#F87239] block sm:inline">
                {" "}Management
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
              Streamline workflows, collaborate seamlessly, and deliver exceptional results with our comprehensive project management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
              <Link href="/login" className="bg-gradient-to-r from-[#FFB333] to-[#FFD480] text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-[#F29F0A] hover:to-[#FFB333] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto text-center">
                Get Started
              </Link>
              <Link href="/login" className="border-2 border-[#FFB333] text-[#FFB333] px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-[#FFB333] hover:text-white transition-all duration-200 w-full sm:w-auto text-center">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Everything you need to manage projects
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
              Powerful features designed for modern teams to collaborate, track progress, and deliver results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Task Management */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#FFB333] to-[#FFD480] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Task Management</h3>
              <p className="text-sm sm:text-base text-gray-600">Create, assign, and track tasks with priorities, deadlines, and dependencies.</p>
            </div>

            {/* Team Collaboration */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#5884FD] to-[#8BA4FE] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Team Collaboration</h3>
              <p className="text-sm sm:text-base text-gray-600">Work together with real-time updates, comments, and seamless file sharing.</p>
            </div>

            {/* Analytics & Reporting */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#C483D9] to-[#D9A3E6] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Analytics & Reporting</h3>
              <p className="text-sm sm:text-base text-gray-600">Track progress with detailed analytics, timelines, and visual reports.</p>
            </div>

            {/* Time Management */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#F87239] to-[#FBA173] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Time Tracking</h3>
              <p className="text-sm sm:text-base text-gray-600">Monitor time spent on tasks and manage schedules efficiently.</p>
            </div>

            {/* Workflow Automation */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#FFB333] to-[#FFD480] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Workflow Automation</h3>
              <p className="text-sm sm:text-base text-gray-600">Automate repetitive tasks and streamline your project workflows.</p>
            </div>

            {/* Resource Management */}
            <div className="card-hover p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#5884FD] to-[#8BA4FE] rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Resource Management</h3>
              <p className="text-sm sm:text-base text-gray-600">Optimize resource allocation and manage team capacity effectively.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FFB333] mb-2 sm:mb-3">10K+</div>
              <div className="text-base sm:text-lg text-gray-600 font-medium">Active Projects</div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#5884FD] mb-2 sm:mb-3">50K+</div>
              <div className="text-base sm:text-lg text-gray-600 font-medium">Happy Users</div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#C483D9] mb-2 sm:mb-3">99.9%</div>
              <div className="text-base sm:text-lg text-gray-600 font-medium">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to streamline your projects?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 px-2 sm:px-0 leading-relaxed">
            Join thousands of teams who have transformed their project management workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-sm sm:max-w-none mx-auto">
            <Link href="/login" className="bg-gradient-to-r from-[#FFB333] to-[#FFD480] text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-[#F29F0A] hover:to-[#FFB333] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto text-center">
              Get Started Free
            </Link>
            <Link href="/login" className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-white hover:text-gray-900 transition-all duration-200 w-full sm:w-auto text-center">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FFB333] to-[#FFD480] rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold text-gray-900">PM System</span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                Professional project management platform for modern teams.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Product</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
          
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-600">
            <p>&copy; 2025 PM System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
