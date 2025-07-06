'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Transform data to match AuthContext expectations
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        phone: formData.phone,
        position: formData.position,
        role: formData.role
      };

      await register(registrationData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '500px',
        padding: '3rem 2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: '#1a202c',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.025em'
            }}>
              Create Account
            </h1>
            <p style={{ 
              fontSize: '1rem', 
              color: '#718096',
              margin: 0,
              fontWeight: '400'
            }}>
              Join us and start your journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px', 
              border: '1px solid #fed7d7', 
              background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#e53e3e', marginRight: '0.75rem', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#c53030', fontSize: '0.875rem', fontWeight: '500' }}>{error}</span>
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="name" style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#2d3748', 
                marginBottom: '0.5rem'
              }}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  background: '#ffffff',
                  color: '#2d3748',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontWeight: '400'
                }}
                value={formData.name}
                onChange={handleChange}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#667eea';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                  (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                }}
              />
            </div>
            
            <div>
              <label htmlFor="email" style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#2d3748', 
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  background: '#ffffff',
                  color: '#2d3748',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontWeight: '400'
                }}
                value={formData.email}
                onChange={handleChange}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#667eea';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                  (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="password" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#2d3748', 
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#2d3748',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: '400'
                  }}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#667eea';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#2d3748', 
                  marginBottom: '0.5rem'
                }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#2d3748',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: '400'
                  }}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#667eea';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="phone" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#2d3748', 
                  marginBottom: '0.5rem'
                }}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#2d3748',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: '400'
                  }}
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#667eea';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="position" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#2d3748', 
                  marginBottom: '0.5rem'
                }}>
                  Position
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#2d3748',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: '400'
                  }}
                  value={formData.position}
                  onChange={handleChange}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#667eea';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    (e.target as HTMLInputElement).style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.transform = 'translateY(0)';
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px',
                color: '#ffffff',
                background: isLoading ? 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'all 0.3s ease',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 8px 20px rgba(102, 126, 234, 0.3)',
                outline: 'none',
                transform: isLoading ? 'none' : 'translateY(0)',
                marginTop: '1rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          {/* Sign In Link */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#718096', 
              margin: 0,
              fontWeight: '500'
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{ 
                fontWeight: '600', 
                color: '#667eea', 
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}>
                Sign in
              </Link>
            </p>
          </div>
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