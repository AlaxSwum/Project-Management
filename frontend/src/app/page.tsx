'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Force show the page after 4 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout, showing page anyway');
        setForceShow(true);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && !forceShow) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Loading...</div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          If this takes too long, <button 
            onClick={() => setForceShow(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4f46e5', 
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            click here to continue
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5ED' }}>
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: '#FFB333' }}>
                ProjectFlow
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:transform hover:scale-105 shadow-md"
                style={{ 
                  background: '#FFB333',
                  boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your 
            <span className="block mt-2" style={{ color: '#FFB333' }}>
              Project Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Empower your team with modern project management tools. Plan, track, and deliver projects efficiently with our intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:transform hover:scale-105 shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #FFB333, #FFD480)',
                boxShadow: '0 8px 25px rgba(255, 179, 51, 0.3)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Free Trial
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-gray-700 border-2 transition-all duration-200 hover:transform hover:scale-105 bg-white"
              style={{ 
                borderColor: '#FFB333',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage projects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for modern teams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(255, 179, 51, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#FFB333' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Task Management
              </h3>
              <p className="text-gray-600">
                Create, assign, and track tasks with intuitive kanban boards and timeline views.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(88, 132, 253, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#5884FD' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Real-time collaboration with comments, file sharing, and team notifications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(196, 131, 217, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#C483D9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Analytics & Reports
              </h3>
              <p className="text-gray-600">
                Comprehensive insights and reports to track project progress and team performance.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(248, 114, 57, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#F87239' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Time Tracking
              </h3>
              <p className="text-gray-600">
                Built-in time tracking to monitor productivity and project timelines.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure & Reliable
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security with data encryption and regular backups.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#F59E0B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Integrations
              </h3>
              <p className="text-gray-600">
                Connect with your favorite tools including Slack, Google Drive, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #FFB333, #FFD480)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to streamline your workflow?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using ProjectFlow to deliver projects on time and within budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-gray-900 bg-white transition-all duration-200 hover:transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Your Free Trial
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-white border-2 border-white/30 transition-all duration-200 hover:transform hover:scale-105 hover:bg-white/10"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#FFB333' }}>
                ProjectFlow
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Modern project management platform designed for teams that want to deliver exceptional results.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ProjectFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
