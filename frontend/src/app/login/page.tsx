'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F5F5ED',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f0f0f0',
        width: '100%',
        maxWidth: '420px',
        padding: '3rem 2.5rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            color: '#1a1a1a',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#666666',
            margin: 0,
            fontWeight: '400'
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem 1.25rem', 
            borderRadius: '8px', 
            border: '1px solid #fecaca', 
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#333333', 
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
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: '#ffffff',
                color: '#333333',
                boxSizing: 'border-box',
                outline: 'none',
                fontWeight: '400'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#333333';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#e5e5e5';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#333333', 
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
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: '#ffffff',
                color: '#333333',
                boxSizing: 'border-box',
                outline: 'none',
                fontWeight: '400'
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#333333';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#e5e5e5';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  borderRadius: '4px', 
                  border: '1px solid #e5e5e5',
                  marginRight: '0.5rem'
                }}
              />
              <span style={{ 
                fontSize: '0.875rem', 
                color: '#666666',
                fontWeight: '400'
              }}>
                Remember me
              </span>
            </label>

            <Link href="/forgot-password" style={{ 
              fontSize: '0.875rem',
              fontWeight: '500', 
              color: '#333333', 
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}>
              Forgot password?
            </Link>
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
              borderRadius: '8px',
              color: '#ffffff',
              background: isLoading ? '#999999' : '#333333',
              transition: 'all 0.2s ease',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              marginTop: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.background = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.background = '#333333';
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {/* Sign Up Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #f0f0f0'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#666666', 
            margin: 0,
            fontWeight: '400'
          }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ 
              fontWeight: '600', 
              color: '#333333', 
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 