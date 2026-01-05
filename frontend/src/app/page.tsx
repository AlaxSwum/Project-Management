'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ResponsiveHomePage() {
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

  const styles = {
    container: {
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden' as const,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    nav: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      width: '100%',
    },
    navContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#1f2937',
    },
    desktopNav: {
      display: isMobile ? 'none' : 'flex',
      gap: '2rem',
      alignItems: 'center',
    },
    navLink: {
      color: '#6b7280',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s',
    },
    authButton: {
      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
      color: 'white',
      padding: '0.5rem 1.5rem',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.2s',
      boxShadow: '0 2px 4px rgba(255, 179, 51, 0.3)',
    },
    mobileMenuButton: {
      display: isMobile ? 'block' : 'none',
      background: 'none',
      border: 'none',
      padding: '0.5rem',
      borderRadius: '8px',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    mobileMenu: {
      display: isMobile && isMobileMenuOpen ? 'block' : 'none',
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '1rem',
    },
    mobileNavLink: {
      display: 'block',
      padding: '0.75rem',
      color: '#374151',
      textDecoration: 'none',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
    },
    mobileAuthButton: {
      display: 'block',
      width: '100%',
      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
      color: 'white',
      padding: '0.75rem',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      textAlign: 'center' as const,
      marginTop: '1rem',
    },
    heroSection: {
      background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      textAlign: 'center' as const,
    },
    heroContent: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    heroIcon: {
      width: isMobile ? '64px' : '80px',
      height: isMobile ? '64px' : '80px',
      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 2rem',
      boxShadow: '0 8px 25px rgba(255, 179, 51, 0.3)',
    },
    heroTitle: {
      fontSize: isMobile ? '2rem' : '3rem',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: '1rem',
      lineHeight: '1.2',
    },
    heroSubtitle: {
      background: 'linear-gradient(135deg, #FFB333, #F87239)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'block',
      marginTop: '0.5rem',
    },
    heroDescription: {
      fontSize: isMobile ? '1rem' : '1.125rem',
      color: '#6b7280',
      marginBottom: '2rem',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      lineHeight: '1.6',
    },
    heroButtons: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
      maxWidth: isMobile ? '300px' : '400px',
      margin: '0 auto',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px rgba(255, 179, 51, 0.4)',
      textAlign: 'center' as const,
      flex: isMobile ? 'none' : '1',
      minWidth: '150px',
    },
    secondaryButton: {
      border: '2px solid #FFB333',
      color: '#FFB333',
      padding: '1rem 2rem',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.2s',
      textAlign: 'center' as const,
      flex: isMobile ? 'none' : '1',
      minWidth: '150px',
      background: 'white',
    },
    section: {
      width: '100%',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
    },
    sectionContent: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featuresHeader: {
      textAlign: 'center' as const,
      marginBottom: '3rem',
    },
    featuresTitle: {
      fontSize: isMobile ? '1.75rem' : '2.25rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '1rem',
    },
    featuresDescription: {
      fontSize: isMobile ? '1rem' : '1.125rem',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: isMobile ? '1.5rem' : '2rem',
    },
    featureCard: {
      background: 'white',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      transition: 'all 0.3s',
    },
    featureIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
    featureTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.75rem',
    },
    featureDescription: {
      color: '#6b7280',
      lineHeight: '1.6',
    },
    statsSection: {
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '1.5rem' : '2rem',
      maxWidth: '1000px',
      margin: '0 auto',
    },
    statCard: {
      background: 'white',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: '16px',
      textAlign: 'center' as const,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s',
    },
    statNumber: {
      fontSize: isMobile ? '2rem' : '2.5rem',
      fontWeight: '800',
      marginBottom: '0.5rem',
    },
    statLabel: {
      color: '#6b7280',
      fontWeight: '500',
    },
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          {/* Logo */}
          <div style={styles.logo}>
            <Image 
              src="/logo.png" 
              alt="Project Next Logo" 
              width={40} 
              height={40}
              style={{ borderRadius: '8px' }}
            />
            <div style={styles.logoText}>Project Next</div>
          </div>

          {/* Desktop Navigation */}
          <div style={styles.desktopNav}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#about" style={styles.navLink}>About</a>
            <a href="#contact" style={styles.navLink}>Contact</a>
          </div>

          {/* Desktop Auth */}
          <div style={{display: isMobile ? 'none' : 'flex', alignItems: 'center'}}>
            <Link href="/login" style={styles.authButton}>
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            style={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {!isMobileMenuOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div style={styles.mobileMenu}>
          <a href="#features" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            Features
          </a>
          <a href="#about" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            About
          </a>
          <a href="#contact" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            Contact
          </a>
          <Link href="/login" style={styles.mobileAuthButton}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          
          <h1 style={styles.heroTitle}>
            Professional Project
            <span style={styles.heroSubtitle}>Management</span>
          </h1>
          
          <p style={styles.heroDescription}>
            Streamline workflows, collaborate seamlessly, and deliver exceptional results with our comprehensive project management platform.
          </p>
          
          <div style={styles.heroButtons}>
            <Link href="/login" style={styles.primaryButton}>
              Get Started
            </Link>
            <Link href="/login" style={styles.secondaryButton}>
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{...styles.section, background: 'white'}}>
        <div style={styles.sectionContent}>
          <div style={styles.featuresHeader}>
            <h2 style={styles.featuresTitle}>Everything you need to manage projects</h2>
            <p style={styles.featuresDescription}>
              Powerful features designed for modern teams to collaborate, track progress, and deliver results.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {/* Task Management */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #FFB333, #FFD480)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Task Management</h3>
              <p style={styles.featureDescription}>Create, assign, and track tasks with priorities, deadlines, and dependencies.</p>
            </div>

            {/* Team Collaboration */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #5884FD, #8BA4FE)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Team Collaboration</h3>
              <p style={styles.featureDescription}>Work together with real-time updates, comments, and seamless file sharing.</p>
            </div>

            {/* Analytics & Reporting */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #C483D9, #D9A3E6)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Analytics & Reporting</h3>
              <p style={styles.featureDescription}>Track progress with detailed analytics, timelines, and visual reports.</p>
            </div>

            {/* Time Tracking */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #F87239, #FBA173)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Time Tracking</h3>
              <p style={styles.featureDescription}>Monitor time spent on tasks and manage schedules efficiently.</p>
            </div>

            {/* Workflow Automation */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #FFB333, #FFD480)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Workflow Automation</h3>
              <p style={styles.featureDescription}>Automate repetitive tasks and streamline your project workflows.</p>
            </div>

            {/* Resource Management */}
            <div style={styles.featureCard}>
              <div style={{...styles.featureIcon, background: 'linear-gradient(135deg, #5884FD, #8BA4FE)'}}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 style={styles.featureTitle}>Resource Management</h3>
              <p style={styles.featureDescription}>Optimize resource allocation and manage team capacity effectively.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.sectionContent}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#FFB333'}}>10K+</div>
              <div style={styles.statLabel}>Active Projects</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#5884FD'}}>50K+</div>
              <div style={styles.statLabel}>Happy Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#C483D9'}}>99.9%</div>
              <div style={styles.statLabel}>Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{...styles.section, background: 'white'}}>
        <div style={styles.sectionContent}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '3rem',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.75rem' : '2.25rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '1.5rem'
              }}>
                Built for modern teams
              </h2>
              <p style={{
                fontSize: '1.125rem',
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Focus Project is designed to help teams of all sizes manage their projects more effectively. 
                From startups to enterprise organizations, our platform scales with your needs.
              </p>
              <ul style={{listStyle: 'none', padding: 0}}>
                {['Intuitive project planning', 'Real-time collaboration', 'Advanced reporting'].map((item, index) => (
                  <li key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: '#FFB333',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '0.75rem'
                    }}>
                      <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span style={{color: '#374151'}}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #FFB333, #FFD480)',
              padding: '2rem',
              borderRadius: '16px'
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem'}}>
                  Ready to get started?
                </h3>
                <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
                  Join thousands of teams already using Focus Project to manage their work.
                </p>
                <Link 
                  href="/login" 
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #FFB333, #FFD480)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    width: isMobile ? '100%' : 'auto',
                    textAlign: 'center' as const
                  }}
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center' as const
      }}>
        <div style={styles.sectionContent}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Ready to streamline your projects?
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#d1d5db',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Join thousands of teams who have transformed their project management workflow.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' as const : 'row' as const,
            maxWidth: isMobile ? '300px' : '400px',
            margin: '0 auto'
          }}>
            <Link href="/login" style={styles.primaryButton}>
              Get Started Free
            </Link>
            <Link href="/login" style={{
              ...styles.secondaryButton,
              borderColor: 'white',
              color: 'white',
              background: 'transparent'
            }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem'
      }}>
        <div style={styles.sectionContent}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{textAlign: isMobile ? 'center' : 'left'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #FFB333, #FFD480)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span style={{fontSize: '1.125rem', fontWeight: '700', color: '#1f2937'}}>Focus Project</span>
              </div>
              <p style={{color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6'}}>
                Professional project management platform for modern teams. Streamline your workflow and deliver exceptional results.
              </p>
            </div>

            {['Product', 'Company', 'Support'].map((section, index) => (
              <div key={section} style={{textAlign: isMobile ? 'center' : 'left'}}>
                <h3 style={{fontWeight: '600', color: '#1f2937', marginBottom: '1rem'}}>{section}</h3>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {section === 'Product' && ['Features', 'Pricing', 'API', 'Integrations'].map(item => (
                    <li key={item} style={{marginBottom: '0.5rem'}}>
                      <a href="#" style={{color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s'}}>
                        {item}
                      </a>
                    </li>
                  ))}
                  {section === 'Company' && ['About', 'Blog', 'Careers', 'Contact'].map(item => (
                    <li key={item} style={{marginBottom: '0.5rem'}}>
                      <a href="#" style={{color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s'}}>
                        {item}
                      </a>
                    </li>
                  ))}
                  {section === 'Support' && ['Help Center', 'Documentation', 'Community', 'Contact Us'].map(item => (
                    <li key={item} style={{marginBottom: '0.5rem'}}>
                      <a href="#" style={{color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s'}}>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div style={{
            textAlign: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <p>&copy; 2025 Focus Project. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
