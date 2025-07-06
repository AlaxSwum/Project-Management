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
          background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }
        
        .login-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 179, 51, 0.08) 0%, transparent 70%);
          animation: float 8s ease-in-out infinite;
        }
        
        .login-container::after {
          content: '';
          position: absolute;
          top: 20%;
          right: -30%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(196, 131, 217, 0.06) 0%, transparent 70%);
          animation: float 10s ease-in-out infinite reverse;
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 420px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        }
        
        .title-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.75rem;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.025em;
        }
        
        .subtitle {
          color: #6B7280;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .error-message {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
        }
        
        .error-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #EF4444;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }
        
        .error-text {
          color: #DC2626;
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
          color: #1F2937;
          font-family: 'Inter', sans-serif;
        }
        
        .form-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: #FFFFFF;
          color: #1F2937;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .form-input:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .form-input:hover {
          border-color: #D1D5DB;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        
        .form-input::placeholder {
          color: #9CA3AF;
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
          border: 2px solid #D1D5DB;
          border-radius: 4px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .checkbox:checked {
          background: #FFB333;
          border-color: #FFB333;
        }
        
        .checkbox-label {
          font-size: 0.875rem;
          color: #6B7280;
          cursor: pointer;
        }
        
        .forgot-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #FFB333;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .forgot-link:hover {
          color: #E69A00;
        }
        
        .submit-button {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.4);
        }
        
        .submit-button:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid transparent;
          border-top: 2px solid #FFFFFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }
        
        .divider {
          margin: 2.5rem 0;
          position: relative;
        }
        
        .divider-line {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
        }
        
        .divider-border {
          width: 100%;
          border-top: 1px solid #E5E7EB;
        }
        
        .divider-text {
          position: relative;
          display: flex;
          justify-content: center;
          font-size: 0.875rem;
        }
        
        .divider-label {
          padding: 0 1rem;
          background: rgba(255, 255, 255, 0.95);
          color: #6B7280;
        }
        
        .signup-section {
          text-align: center;
        }
        
        .signup-text {
          color: #6B7280;
          font-size: 0.875rem;
        }
        
        .signup-link {
          font-weight: 600;
          color: #FFB333;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .signup-link:hover {
          color: #E69A00;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .login-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
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

          {/* Divider */}
          <div className="divider">
            <div className="divider-line">
              <div className="divider-border"></div>
            </div>
            <div className="divider-text">
              <span className="divider-label">Don't have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="signup-section">
            <p className="signup-text">
              <Link href="/register" className="signup-link">
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 