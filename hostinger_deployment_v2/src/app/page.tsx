'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numericTarget));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated, numericTarget]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden" style={{ fontFamily: 'Mabry Pro, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
        <div style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          width: '100%',
          height: '100%',
        }} />
      </div>

      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrollY > 50 ? 'rgba(5,5,5,0.85)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-sm -z-10" />
              </div>
              <span className="text-lg font-bold tracking-tight">Syncboard</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How it works', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="px-4 py-2 text-[#888] hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-white/[0.04]">
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-[#888] hover:text-white transition-colors text-sm font-medium">
                Log in
              </Link>
              <Link href="/login" className="relative group px-5 py-2.5 rounded-lg font-medium text-sm text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all group-hover:from-emerald-400 group-hover:to-emerald-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.4)' }} />
                <span className="relative">Get Started</span>
              </Link>
            </div>

            <button className="md:hidden p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.06]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {!isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
              </svg>
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/[0.06]">
              <div className="flex flex-col gap-1">
                {['Features', 'How it works', 'Pricing'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="px-4 py-3 text-[#888] hover:text-white rounded-lg hover:bg-white/[0.04] text-sm">{item}</a>
                ))}
                <hr className="border-white/[0.06] my-2" />
                <Link href="/login" className="px-4 py-3 text-[#888] hover:text-white rounded-lg hover:bg-white/[0.04] text-sm">Log in</Link>
                <Link href="/login" className="mx-4 py-3 bg-emerald-500 text-white rounded-lg font-medium text-center text-sm">Get Started</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(60px)', transform: `translate(${mounted ? '0' : '-40px'}, ${mounted ? '0' : '40px'})`, transition: 'transform 1.5s ease-out' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(60px)', transform: `translate(${mounted ? '0' : '40px'}, ${mounted ? '0' : '-40px'})`, transition: 'transform 1.8s ease-out' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10" style={{ transform: `translateY(${mounted ? '0' : '30px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-[#999]">Now with AI-powered scheduling</span>
            <svg className="w-3.5 h-3.5 text-[#666]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
            <span className="block" style={{ transform: `translateY(${mounted ? '0' : '20px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' }}>
              Work smarter.
            </span>
            <span className="block mt-2" style={{ background: 'linear-gradient(135deg, #34d399, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transform: `translateY(${mounted ? '0' : '20px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' }}>
              Ship faster.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#777] max-w-xl mx-auto mb-12 leading-relaxed" style={{ transform: `translateY(${mounted ? '0' : '15px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s' }}>
            The all-in-one platform for project management, team collaboration, and organizational clarity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{ transform: `translateY(${mounted ? '0' : '15px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.45s' }}>
            <Link href="/login" className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white overflow-hidden whitespace-nowrap">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.35)' }} />
              <span className="relative">Start Free Trial</span>
              <svg className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="#features" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[#ccc] whitespace-nowrap transition-all hover:text-white" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Learn More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-5" style={{ transform: `translateY(${mounted ? '0' : '15px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s' }}>
            <div className="flex -space-x-2.5">
              {['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'].map((color, i) => (
                <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#050505]" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                  {['S', 'A', 'M', 'K', 'R'][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <span className="text-sm text-[#666]">Loved by <span className="text-white font-medium">10,000+</span> teams</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ opacity: mounted ? 0.4 : 0, transition: 'opacity 1.5s ease 1s' }}>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-8 px-6 -mt-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>
            <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-[#555] text-xs" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  app.syncboard.com
                </div>
              </div>
            </div>

            <div className="flex" style={{ background: '#0a0a0a' }}>
              <div className="w-56 p-4 hidden md:block" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5 mb-6 px-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                  <div className="text-xs font-medium text-white">Workspace</div>
                </div>
                {['Dashboard', 'My Tasks', 'Calendar', 'Reports', 'Company'].map((item, i) => (
                  <div key={item} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs mb-0.5" style={{ background: i === 0 ? 'rgba(16,185,129,0.1)' : 'transparent', color: i === 0 ? '#10b981' : '#555' }}>
                    <div className="w-4 h-4 rounded" style={{ background: i === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)' }} />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-sm font-semibold text-white">Project Overview</div>
                    <div className="text-xs text-[#555] mt-0.5">5 active projects</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex -space-x-1.5">
                      {['#8B5CF6', '#3B82F6', '#EC4899'].map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-[#0a0a0a] text-[9px] font-bold text-white flex items-center justify-center" style={{ background: c }}>{['J', 'M', 'S'][i]}</div>
                      ))}
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-medium">+ New</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { title: 'Backlog', color: '#71717A', count: 8 },
                    { title: 'In Progress', color: '#3B82F6', count: 12 },
                    { title: 'Review', color: '#F59E0B', count: 5 },
                    { title: 'Done', color: '#10B981', count: 23 },
                  ].map((col) => (
                    <div key={col.title} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        <span className="text-xs font-medium text-[#aaa]">{col.title}</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full text-[#666]" style={{ background: 'rgba(255,255,255,0.05)' }}>{col.count}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="text-xs text-white mb-1.5">Homepage redesign</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-pink-400" style={{ background: 'rgba(236,72,153,0.15)' }}>Design</span>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 border border-[#0a0a0a] text-[8px] text-white flex items-center justify-center font-bold">A</div>
                          </div>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="text-xs text-white mb-1.5">API endpoints</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-blue-400" style={{ background: 'rgba(59,130,246,0.15)' }}>Backend</span>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border border-[#0a0a0a] text-[8px] text-white flex items-center justify-center font-bold">M</div>
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

      {/* Logos/Trust Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-medium text-[#444] uppercase tracking-[0.2em] mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['TechCorp', 'DesignLab', 'CloudBase', 'DataFlow', 'BuildStack'].map((name) => (
              <span key={name} className="text-[#333] text-lg font-bold tracking-tight hover:text-[#555] transition-colors">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="text-xs text-emerald-400 font-semibold tracking-wide">FEATURES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
              Everything you need to
              <br />
              <span style={{ background: 'linear-gradient(135deg, #34d399, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>deliver exceptional work</span>
            </h2>
            <p className="text-base text-[#666] max-w-lg mx-auto">
              Powerful tools designed for modern teams. Simple enough to start, flexible enough to scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Smart Task Management', desc: 'AI-assisted prioritization, dependencies, and deadline tracking that adapts to your workflow.', gradient: 'from-emerald-500/20 to-emerald-500/5', accent: '#10B981' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Organization Hierarchy', desc: 'Structure your company with departments, roles, and responsibilities. Visual org charts included.', gradient: 'from-blue-500/20 to-blue-500/5', accent: '#3B82F6' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Daily Reports & Analytics', desc: 'Employee daily reports flow to managers automatically. Calendar view with detailed insights.', gradient: 'from-purple-500/20 to-purple-500/5', accent: '#8B5CF6' },
              { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Personal Focus Timer', desc: 'Time-block your day, track focus sessions, and build productive habits with smart scheduling.', gradient: 'from-amber-500/20 to-amber-500/5', accent: '#F59E0B' },
              { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Integrated Calendar', desc: 'Meetings, deadlines, and milestones in one unified calendar. Never miss an important date.', gradient: 'from-pink-500/20 to-pink-500/5', accent: '#EC4899' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Content Calendar', desc: 'Plan, schedule, and track content across teams. Manage your editorial workflow effortlessly.', gradient: 'from-cyan-500/20 to-cyan-500/5', accent: '#06B6D4' },
            ].map((feature) => (
              <div key={feature.title} className="group relative rounded-2xl p-6 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = `${feature.accent}33`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${feature.accent}20, ${feature.accent}08)` }}>
                  <svg className="w-5 h-5" style={{ color: feature.accent }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} /></svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <span className="text-xs text-blue-400 font-semibold tracking-wide">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
              Up and running in
              <br />
              <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>three simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Set up your workspace', desc: 'Create your company, add departments, and invite your team. Takes less than 5 minutes.', color: '#10B981' },
              { step: '02', title: 'Organize your work', desc: 'Assign roles, set responsibilities, create projects, and define workflows that match your team.', color: '#3B82F6' },
              { step: '03', title: 'Track & deliver', desc: 'Monitor daily reports, track progress on calendars, and gain insights with analytics.', color: '#8B5CF6' },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[1px]" style={{ background: `linear-gradient(90deg, ${item.color}33, transparent)` }} />}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-xl font-bold" style={{ background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}22` }}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.03), transparent)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '10000', suffix: '+', label: 'Active teams', color: '#10B981' },
              { value: '500000', suffix: '+', label: 'Tasks completed', color: '#3B82F6' },
              { value: '99', suffix: '.9%', label: 'Uptime SLA', color: '#8B5CF6' },
              { value: '4', suffix: '.9/5', label: 'User rating', color: '#F59E0B' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: stat.color }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-[#555]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Loved by teams everywhere
            </h2>
            <p className="text-base text-[#666]">See what people are saying about Syncboard</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: 'Syncboard transformed how our team works. The org chart and daily reports feature is a game-changer for managing 50+ people.', name: 'Sarah Chen', role: 'Head of Operations', avatar: 'S', color: '#EC4899' },
              { quote: 'The personal focus timer and calendar integration helped me become 3x more productive. I can finally see where my time goes.', name: 'Marcus Johnson', role: 'Senior Developer', avatar: 'M', color: '#3B82F6' },
              { quote: 'We switched from 3 different tools to just Syncboard. Everything our team needs is in one place. The dark mode is beautiful too.', name: 'Aisha Patel', role: 'Product Manager', avatar: 'A', color: '#8B5CF6' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-[#999] leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-[#555]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,5,5,0.9), rgba(99,102,241,0.06))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to get started?
            </h2>
            <p className="text-base text-[#666] mb-8 max-w-md mx-auto">
              Join thousands of teams using Syncboard to work smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:from-emerald-400 group-hover:to-emerald-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4) inset' }} />
                <span className="relative">Start Free Trial</span>
                <svg className="relative w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/login" className="px-8 py-4 rounded-xl font-semibold text-[#999] hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Contact Sales
              </Link>
            </div>
            <p className="mt-5 text-xs text-[#444]">Free forever for small teams. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-lg font-bold">Syncboard</span>
              </div>
              <p className="text-sm text-[#555] leading-relaxed max-w-xs mb-5">
                The modern platform for project management, team collaboration, and organizational clarity.
              </p>
              <div className="flex gap-3">
                {['M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'].map((d, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555] hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Documentation', 'Contact', 'Status'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-[#555] hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-[#444]">&copy; 2026 Syncboard. All rights reserved.</div>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Cookies'].map((link) => (
                <a key={link} href="#" className="text-xs text-[#444] hover:text-white transition-colors">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
