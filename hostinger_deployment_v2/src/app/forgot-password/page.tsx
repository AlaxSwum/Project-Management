'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (err: any) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 1rem',
      background: '#F5F5ED',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <Link href="/">
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: 'bold', 
              color: '#FFB333',
              margin: '0 0 1.5rem 0',
              cursor: 'pointer'
            }}>
              ProjectFlow
            </h1>
          </Link>
          {!isSubmitted ? (
            <>
              <h2 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: '#1F2937',
                margin: '0 0 0.5rem 0'
              }}>
                Forgot your password?
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                margin: 0
              }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: '#1F2937',
                margin: '0 0 0.5rem 0'
              }}>
                Check your email
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280',
                margin: 0
              }}>
                We've sent a password reset link to {email}
              </p>
            </>
          )}
        </div>
        
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '0.75rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', 
          padding: '2rem', 
          border: '1px solid #E5E7EB'
        }}>
          {error && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              border: '1px solid #FCA5A5', 
              background: '#FEF2F2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#EF4444', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#B91C1C', fontSize: '0.875rem' }}>{error}</span>
              </div>
            </div>
          )}
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label htmlFor="email" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem'
                }}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#FFFFFF',
                    color: '#1F2937',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#FFB333';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(255, 179, 51, 0.1)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#D1D5DB';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    background: isLoading ? '#FFD480' : '#FFB333',
                    transition: 'all 0.2s ease',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                    boxShadow: isLoading ? 'none' : '0 4px 12px rgba(255, 179, 51, 0.3)',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      (e.target as HTMLButtonElement).style.background = '#FFD480';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      (e.target as HTMLButtonElement).style.background = '#FFB333';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send reset link
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <svg style={{ width: '4rem', height: '4rem', color: '#10B981', margin: '0 auto 1rem auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #FFB333',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  color: '#FFB333',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
            Remember your password?{' '}
            <Link href="/login" style={{ 
              fontWeight: '500', 
              color: '#FFB333', 
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 