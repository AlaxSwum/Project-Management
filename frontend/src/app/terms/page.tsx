import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F5F5ED',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
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
          <Link href="/">
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#FFB333',
              margin: 0,
              cursor: 'pointer'
            }}>
              ProjectFlow
            </h1>
          </Link>
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
                cursor: 'pointer'
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
                boxShadow: '0 2px 4px rgba(255, 179, 51, 0.2)'
              }}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '0.75rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', 
          padding: '3rem', 
          border: '1px solid #E5E7EB'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#1F2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Terms of Service
          </h1>
          
          <p style={{ 
            fontSize: '1rem', 
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Last updated: January 2024
          </p>

          <div style={{ lineHeight: '1.7', color: '#374151' }}>
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                1. Acceptance of Terms
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                By accessing and using ProjectFlow, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                2. Description of Service
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                ProjectFlow is a web-based project management platform that helps teams collaborate, track progress, and manage tasks.
                The service is provided "as is" and we reserve the right to modify or discontinue the service at any time.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                3. User Accounts and Responsibilities
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility
                for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Keep your login credentials secure</li>
                <li style={{ marginBottom: '0.5rem' }}>Use the service in compliance with applicable laws</li>
                <li style={{ marginBottom: '0.5rem' }}>Do not share your account with others</li>
                <li style={{ marginBottom: '0.5rem' }}>Report any security vulnerabilities to us</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                4. Data and Privacy
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We take your privacy seriously. Your data belongs to you, and we will never share it without your explicit consent.
                We use industry-standard encryption to protect your data. For more details, please review our Privacy Policy.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                5. Prohibited Uses
              </h2>
              <p style={{ marginBottom: '1rem' }}>You may not use ProjectFlow for:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Any unlawful purpose or to solicit others to unlawful acts</li>
                <li style={{ marginBottom: '0.5rem' }}>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li style={{ marginBottom: '0.5rem' }}>Transmitting or procuring the sending of any advertising or promotional material without our prior written consent</li>
                <li style={{ marginBottom: '0.5rem' }}>Impersonating or attempting to impersonate another user, person, or entity</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                6. Limitation of Liability
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                In no event shall ProjectFlow, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use,
                goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                7. Termination
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability,
                under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                8. Changes to Terms
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material,
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                9. Contact Information
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div style={{ 
                background: '#F9FAFB', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB'
              }}>
                <p style={{ margin: 0, fontWeight: '500' }}>Email: legal@projectflow.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem 1rem', 
        background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#6B7280',
            margin: 0
          }}>
            © 2024 ProjectFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 