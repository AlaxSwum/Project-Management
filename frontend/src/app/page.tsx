import Link from 'next/link';

export default function WelcomePage() {
    return (
      <div style={{ 
      minHeight: '100vh', 
      background: '#F5F5ED',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{ 
        background: '#FFFFFF', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#FFB333',
              margin: 0
            }}>
              ProjectFlow
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/login">
              <button style={{ 
                padding: '0.5rem 1rem', 
                color: '#374151', 
                background: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button style={{ 
                padding: '0.5rem 1rem', 
                color: '#FFFFFF', 
                background: '#FFB333',
              border: 'none', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(255, 179, 51, 0.2)'
              }}>
                Get Started
          </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '5rem 1rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #F5F5ED 0%, #FEFCF5 100%)'
      }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#1F2937',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            Modern Project Management
            <span style={{ display: 'block', color: '#FFB333' }}>
              Made Simple
            </span>
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#6B7280',
            marginBottom: '2rem',
            maxWidth: '42rem',
            margin: '0 auto 2rem auto'
          }}>
            Streamline your workflow, collaborate seamlessly, and deliver projects on time with our intuitive project management platform.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/register">
              <button style={{ 
                padding: '0.875rem 2rem', 
                color: '#FFFFFF', 
                background: '#FFB333',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
              }}>
                Start Free Trial
              </button>
            </Link>
            <Link href="/login">
              <button style={{ 
                padding: '0.875rem 2rem', 
                color: '#374151', 
                background: '#FFFFFF',
                border: '2px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                Watch Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ 
        padding: '5rem 1rem', 
        background: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#1F2937',
              marginBottom: '1rem'
            }}>
              Everything you need to manage projects
            </h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#6B7280',
              maxWidth: '42rem',
              margin: '0 auto'
            }}>
              Powerful features designed to help teams collaborate, track progress, and deliver exceptional results.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', 
            gap: '2rem' 
          }}>
            {/* Feature 1 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#FFB333',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Task Management
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Create, assign, and track tasks with ease. Set priorities, deadlines, and dependencies to keep projects on track.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#5884FD',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Team Collaboration
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Work together seamlessly with real-time updates, comments, and file sharing. Keep everyone in the loop.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#C483D9',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Progress Tracking
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Monitor project progress with detailed analytics, timelines, and visual reports. Stay informed at every step.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#F87239',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Time Management
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Track time spent on tasks, set deadlines, and manage schedules efficiently. Never miss a deadline again.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#FFB333',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Quality Assurance
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Ensure project quality with built-in review processes, approval workflows, and quality checkpoints.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{ 
              padding: '2rem', 
              background: '#F9FAFB',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: '#5884FD',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '0.5rem'
              }}>
                Fast Performance
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Lightning-fast interface that keeps up with your workflow. No more waiting for pages to load.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '5rem 1rem', 
        background: '#1F2937',
        color: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem'
          }}>
            Ready to transform your project management?
          </h2>
          <p style={{ 
            fontSize: '1.125rem', 
            color: '#D1D5DB',
            marginBottom: '2rem',
            maxWidth: '42rem',
            margin: '0 auto 2rem auto'
          }}>
            Join thousands of teams who have streamlined their workflow and increased productivity with ProjectFlow.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/register">
              <button style={{ 
                padding: '0.875rem 2rem', 
                color: '#1F2937', 
                background: '#FFB333',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
              }}>
                Start Your Free Trial
              </button>
            </Link>
            <button style={{ 
              padding: '0.875rem 2rem', 
              color: '#FFFFFF', 
              background: 'transparent',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '3rem 1rem 2rem', 
        background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                ProjectFlow
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                lineHeight: '1.6'
              }}>
                Modern project management platform designed to help teams collaborate, track progress, and deliver exceptional results.
              </p>
            </div>
            <div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                Product
              </h3>
              <ul style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Features</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Pricing</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Security</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Integrations</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                Company
              </h3>
              <ul style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>About</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Careers</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Contact</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                Support
              </h3>
              <ul style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Help Center</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Documentation</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>API</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s ease' }}>Status</a>
                </li>
              </ul>
            </div>
          </div>
          <div style={{ 
            paddingTop: '2rem', 
            borderTop: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6B7280',
              margin: 0
            }}>
              © 2024 ProjectFlow. All rights reserved.
            </p>
        </div>
      </div>
      </footer>
    </div>
  );
}
