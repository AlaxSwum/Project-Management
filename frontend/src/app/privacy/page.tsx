import Link from 'next/link';

export default function PrivacyPage() {
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
              Focus Project
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
            {/* Registration disabled for internal app */}
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
            Privacy Policy
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
                1. Information We Collect
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                This may include:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Name, email address, and contact information</li>
                <li style={{ marginBottom: '0.5rem' }}>Account credentials and preferences</li>
                <li style={{ marginBottom: '0.5rem' }}>Project data, tasks, and communications within our platform</li>
                <li style={{ marginBottom: '0.5rem' }}>Usage data and analytics to improve our service</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                2. How We Use Your Information
              </h2>
              <p style={{ marginBottom: '1rem' }}>We use the information we collect to:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Provide, maintain, and improve our services</li>
                <li style={{ marginBottom: '0.5rem' }}>Process transactions and send related information</li>
                <li style={{ marginBottom: '0.5rem' }}>Send technical notices, updates, security alerts, and support messages</li>
                <li style={{ marginBottom: '0.5rem' }}>Respond to comments, questions, and requests for customer service</li>
                <li style={{ marginBottom: '0.5rem' }}>Monitor and analyze trends, usage, and activities</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                3. Information Sharing and Disclosure
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We do not share, sell, rent, or trade your personal information with third parties for their commercial purposes.
                We may share your information only in the following circumstances:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>With your consent or at your direction</li>
                <li style={{ marginBottom: '0.5rem' }}>To comply with laws, regulations, or legal processes</li>
                <li style={{ marginBottom: '0.5rem' }}>To protect the rights, property, and safety of Focus Project and our users</li>
                <li style={{ marginBottom: '0.5rem' }}>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                4. Data Security
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access,
                alteration, disclosure, or destruction. These measures include:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Encryption of data in transit and at rest</li>
                <li style={{ marginBottom: '0.5rem' }}>Regular security assessments and updates</li>
                <li style={{ marginBottom: '0.5rem' }}>Access controls and authentication requirements</li>
                <li style={{ marginBottom: '0.5rem' }}>Employee training on data protection practices</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                5. Data Retention
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations,
                resolve disputes, and enforce our agreements. When we no longer need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                6. Your Rights and Choices
              </h2>
              <p style={{ marginBottom: '1rem' }}>You have the following rights regarding your personal information:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Access and review your personal information</li>
                <li style={{ marginBottom: '0.5rem' }}>Correct or update inaccurate information</li>
                <li style={{ marginBottom: '0.5rem' }}>Delete your account and associated data</li>
                <li style={{ marginBottom: '0.5rem' }}>Export your data in a portable format</li>
                <li style={{ marginBottom: '0.5rem' }}>Opt out of marketing communications</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                7. Cookies and Tracking Technologies
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services.
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                8. International Data Transfers
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards
                are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                9. Changes to This Policy
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy
                on this page and updating the "Last updated" date above.
              </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1F2937',
                marginBottom: '1rem'
              }}>
                10. Contact Us
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div style={{ 
                background: '#F9FAFB', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Email: privacy@projectflow.com</p>
                <p style={{ margin: 0, fontWeight: '500' }}>Data Protection Officer: dpo@projectflow.com</p>
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
            © 2024 Focus Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 