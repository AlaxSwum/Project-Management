'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
        name: `${formData.firstName} ${formData.lastName}`.trim(),
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
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 1rem',
      background: '#F5F5ED',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{ maxWidth: '32rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="firstName" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem'
                }}>
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
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
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
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
                <label htmlFor="lastName" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem'
                }}>
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
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
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
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
            </div>
            
            <div>
              <label htmlFor="email" style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
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
                placeholder="john@company.com"
                value={formData.email}
                onChange={handleChange}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="password" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
                <label htmlFor="confirmPassword" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
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
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="phone" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
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
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
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
                <label htmlFor="position" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
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
                  placeholder="Software Engineer"
                  value={formData.position}
                  onChange={handleChange}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
            Already have an account?{' '}
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