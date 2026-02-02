'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#2D2D2D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Syncboard</span>
            </div>

            {/* Desktop Navigation */}
            <div className={`hidden md:flex items-center gap-8`}>
              <a href="#features" className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium">How it works</a>
              <a href="#pricing" className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium">Pricing</a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium"
              >
                Log in
              </Link>
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {!isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#2D2D2D] animate-fade-in">
              <div className="flex flex-col gap-2">
                <a href="#features" className="px-4 py-3 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all">Features</a>
                <a href="#how-it-works" className="px-4 py-3 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all">How it works</a>
                <a href="#pricing" className="px-4 py-3 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all">Pricing</a>
                <hr className="border-[#2D2D2D] my-2" />
                <Link href="/login" className="px-4 py-3 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all">Log in</Link>
                <Link href="/login" className="mx-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium text-center">Get Started Free</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#2D2D2D] mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-[#A1A1AA]">Now with AI-powered task management</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            Manage Projects
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern project management platform that brings your team together. 
            Collaborate in real-time, track progress effortlessly, and deliver exceptional results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#242424] text-white px-8 py-4 rounded-xl font-semibold text-base transition-all border border-[#2D2D2D] hover:border-[#3D3D3D]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-[#71717A] text-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D2D2D] to-[#3D3D3D] border-2 border-[#0D0D0D] flex items-center justify-center text-xs font-medium">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Trusted by <span className="text-white font-medium">10,000+</span> teams worldwide</span>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[#2D2D2D] bg-[#1A1A1A] shadow-2xl">
            {/* Mock Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] border-b border-[#2D2D2D]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1A1A1A] text-[#71717A] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  syncboard.com
                </div>
              </div>
            </div>
            
            {/* Dashboard Preview */}
            <div className="flex">
              {/* Sidebar Preview */}
              <div className="w-64 bg-[#141414] border-r border-[#2D2D2D] p-4 hidden md:block">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">T</div>
                  <div>
                    <div className="text-sm font-medium text-white">Team Workspace</div>
                    <div className="text-xs text-[#71717A]">Syncboard Company</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {['Dashboard', 'My Tasks', 'Calendar', 'Messages'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${i === 0 ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA]'}`}>
                      <div className="w-5 h-5 rounded bg-[#2D2D2D]" />
                      {item}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-[#2D2D2D]">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider mb-3">Projects</div>
                  {['E-Commerce', 'Mobile App', 'Marketing'].map((project, i) => (
                    <div key={project} className="flex items-center gap-2 px-3 py-2 text-sm text-[#A1A1AA] hover:text-white">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                      {project}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main Content Preview */}
              <div className="flex-1 p-6 bg-[#0D0D0D]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">E-Commerce Website</h3>
                    <div className="flex items-center gap-2 text-sm text-[#71717A]">
                      <span>Project</span>
                      <span>/</span>
                      <span>Website</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D2D2D] to-[#3D3D3D] border-2 border-[#0D0D0D]" />
                      ))}
                    </div>
                    <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Task
                    </button>
                  </div>
                </div>
                
                {/* Kanban Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: 'To Do', color: 'bg-[#71717A]', count: 3 },
                    { title: 'In Progress', color: 'bg-blue-500', count: 4 },
                    { title: 'Review', color: 'bg-amber-500', count: 2 },
                    { title: 'Complete', color: 'bg-emerald-500', count: 5 },
                  ].map((column) => (
                    <div key={column.title} className="bg-[#141414] rounded-xl p-4 border border-[#2D2D2D]">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${column.color}`} />
                        <span className="text-sm font-medium text-white">{column.title}</span>
                        <span className="ml-auto text-xs bg-[#1A1A1A] text-[#71717A] px-2 py-0.5 rounded-full">{column.count}</span>
                      </div>
                      
                      {/* Task Cards */}
                      <div className="space-y-3">
                        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                          <div className="flex gap-1 mb-2">
                            <span className="px-2 py-0.5 text-xs rounded bg-pink-500/20 text-pink-400">Design</span>
                            <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">Frontend</span>
                          </div>
                          <div className="text-sm text-white mb-2">Homepage Design</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-[#71717A]">Progress</div>
                            <div className="text-xs text-[#71717A]">3/4</div>
                          </div>
                          <div className="mt-2 h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                          </div>
                        </div>
                        
                        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                          <div className="flex gap-1 mb-2">
                            <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">Backend</span>
                          </div>
                          <div className="text-sm text-white mb-2">API Integration</div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#2D2D2D]" />
                            <div className="flex-1" />
                            <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-xs text-[#71717A]">5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#2D2D2D] mb-6">
              <span className="text-sm text-emerald-400 font-medium">Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ship faster</span>
            </h2>
            <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
              Powerful features designed for modern teams to collaborate, track progress, and deliver results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                title: 'Task Management',
                description: 'Create, assign, and track tasks with priorities, deadlines, and subtasks.',
                color: 'from-emerald-500 to-emerald-600',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Team Collaboration',
                description: 'Real-time updates, comments, and file sharing to keep everyone aligned.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Analytics & Insights',
                description: 'Track progress with detailed reports, charts, and performance metrics.',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Time Tracking',
                description: 'Log time on tasks and projects with built-in timers and reports.',
                color: 'from-amber-500 to-amber-600',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Calendar View',
                description: 'Visualize your schedule with an intuitive calendar interface.',
                color: 'from-pink-500 to-pink-600',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Automation',
                description: 'Automate repetitive tasks and workflows to save time.',
                color: 'from-cyan-500 to-cyan-600',
              },
            ].map((feature, i) => (
              <div 
                key={feature.title} 
                className="group relative bg-[#141414] hover:bg-[#1A1A1A] rounded-2xl p-6 border border-[#2D2D2D] hover:border-[#3D3D3D] transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D] via-[#141414] to-[#0D0D0D]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: '10K+', label: 'Active Teams', color: 'text-emerald-400' },
              { value: '500K+', label: 'Tasks Completed', color: 'text-blue-400' },
              { value: '99.9%', label: 'Uptime', color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-4xl sm:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-[#71717A] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-[#141414] to-purple-600/20" />
            <div className="absolute inset-0 bg-[#141414]/80 backdrop-blur-3xl" />
            
            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to transform your workflow?
              </h2>
              <p className="text-lg text-[#A1A1AA] mb-8 max-w-xl mx-auto">
                Join thousands of teams already using Syncboard to manage their projects more effectively.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25"
                >
                  Get Started Free
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#242424] text-white px-8 py-4 rounded-xl font-semibold transition-all border border-[#2D2D2D]"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#2D2D2D]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Syncboard</span>
              </div>
              <p className="text-[#71717A] text-sm leading-relaxed">
                Modern project management for teams that want to ship faster.
              </p>
            </div>
            
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Documentation', 'Contact', 'Status'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[#71717A] hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-[#2D2D2D] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[#71717A] text-sm">
              &copy; 2026 Syncboard. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-[#71717A] hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-[#71717A] hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-[#71717A] hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
