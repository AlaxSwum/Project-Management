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
    <>
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .login-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          padding: 3rem;
          width: 100%;
          max-width: 420px;
          position: relative;
        }
        
        .title-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.5;
          font-weight: 400;
        }
        
        .error-message {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }
        
        .error-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #ef4444;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }
        
        .error-text {
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .form-input:hover {
          border-color: #9ca3af;
        }
        
        .form-input::placeholder {
          color: #9ca3af;
        }
        
        .remember-forgot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.5rem 0;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .checkbox {
          width: 1rem;
          height: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .checkbox:checked {
          background: #111827;
          border-color: #111827;
        }
        
        .checkbox-label {
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
        }
        
        .forgot-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .forgot-link:hover {
          color: #374151;
        }
        
        .submit-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #1f2937;
        }
        
        .submit-button:active:not(:disabled) {
          background: #374151;
        }
        
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid transparent;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }
        
        .divider {
          margin: 2rem 0;
          position: relative;
          text-align: center;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e5e7eb;
        }
        
        .divider-label {
          background: #ffffff;
          padding: 0 1rem;
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .signup-section {
          text-align: center;
        }
        
        .signup-text {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .signup-link {
          font-weight: 600;
          color: #111827;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .signup-link:hover {
          color: #374151;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .login-container {
            padding: 1rem;
          }
          
          .login-card {
            padding: 2rem 1.5rem;
          }
          
          .title {
            font-size: 1.75rem;
          }
          
          .remember-forgot {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
      
      <div className="login-container">
        <div className="login-card">
          {/* Title */}
          <div className="title-section">
            <h1 className="title">Welcome Back</h1>
            <p className="subtitle">Sign in to continue to your dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="remember-forgot">
              <label className="remember-me">
                <input type="checkbox" className="checkbox" />
                <span className="checkbox-label">Remember me</span>
              </label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Registration disabled for internal-use app */}
        </div>
      </div>
    </>
  );
} 