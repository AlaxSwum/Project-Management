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
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #000000;
            min-height: 100vh;
          }
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .login-card {
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: 100%;
            max-width: 400px;
          }
          .login-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .login-title {
            font-size: 2rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .login-subtitle {
            color: #666666;
            font-size: 0.95rem;
          }
          .login-subtitle a {
            color: #000000;
            text-decoration: none;
            font-weight: 500;
          }
          .login-subtitle a:hover {
            text-decoration: underline;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            display: block;
            font-weight: 500;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .form-input::placeholder {
            color: #9ca3af;
          }
          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
          .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .checkbox-group input {
            width: 16px;
            height: 16px;
          }
          .forgot-link {
            color: #000000;
            text-decoration: none;
            font-weight: 500;
          }
          .forgot-link:hover {
            text-decoration: underline;
          }
          .login-button {
            width: 100%;
            background: #000000;
            color: white;
            border: none;
            padding: 0.875rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          .login-button:hover:not(:disabled) {
            background: #333333;
            transform: translateY(-1px);
          }
          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .login-footer {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #666666;
          }
          .login-footer a {
            color: #000000;
            text-decoration: none;
            font-weight: 500;
          }
          .login-footer a:hover {
            text-decoration: underline;
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .login-container {
              padding: 0.5rem;
            }
            
            .login-card {
              padding: 2rem;
              border-radius: 12px;
            }
            
            .login-title {
              font-size: 1.75rem;
            }
            
            .form-options {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }
            
            .checkbox-group {
              align-self: flex-start;
            }
            
            .forgot-link {
              align-self: flex-end;
            }
          }
          
          @media (max-width: 480px) {
            .login-container {
              padding: 0.25rem;
            }
            
            .login-card {
              padding: 1.5rem;
              border-radius: 8px;
              max-width: 100%;
            }
            
            .login-title {
              font-size: 1.5rem;
            }
            
            .login-subtitle {
              font-size: 0.9rem;
            }
            
            .form-input {
              padding: 0.875rem 1rem;
              font-size: 1.1rem;
            }
            
            .login-button {
              padding: 1rem;
              font-size: 1.1rem;
            }
            
            .form-options {
              font-size: 0.85rem;
            }
            
            .login-footer {
              font-size: 0.85rem;
              margin-top: 1.5rem;
            }
          }
        `
      }} />
      
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">
              Don't have an account?{' '}
              <Link href="/register">Sign up</Link>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-options">
              <div className="checkbox-group">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label htmlFor="remember-me">Remember me</label>
              </div>

              <Link href="/forgot-password" className="forgot-link">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            By signing in, you agree to our{' '}
            <Link href="/terms">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 