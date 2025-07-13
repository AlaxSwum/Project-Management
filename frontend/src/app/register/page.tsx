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

    // Password strength validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
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
    <>
      <style jsx>{`
        .register-container {
          min-height: 100vh;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .register-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          padding: 3rem;
          width: 100%;
          max-width: 540px;
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
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
        
        .form-help {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        .optional-label {
          color: #9ca3af;
          font-weight: 400;
        }
        
        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        
        .checkbox {
          width: 1rem;
          height: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #ffffff;
          cursor: pointer;
          margin-top: 0.25rem;
          flex-shrink: 0;
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
          line-height: 1.4;
        }
        
        .checkbox-link {
          color: #111827;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .checkbox-link:hover {
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
        
        .signin-section {
          text-align: center;
        }
        
        .signin-text {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .signin-link {
          font-weight: 600;
          color: #111827;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .signin-link:hover {
          color: #374151;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .register-card {
            padding: 2rem 1.5rem;
          }
          
          .title {
            font-size: 1.75rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .register-container {
            padding: 1rem;
          }
          
          .register-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
      
      <div className="register-container">
        <div className="register-card">
          {/* Title */}
          <div className="title-section">
            <h1 className="title">Create Account</h1>
            <p className="subtitle">Get started with your new account</p>
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
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="form-help">Must be at least 8 characters</p>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position" className="form-label">
                  Position <span className="optional-label">(Optional)</span>
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Project Manager"
                  value={formData.position}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="optional-label">(Optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                required
                className="checkbox"
              />
              <label className="checkbox-label">
                I agree to the{' '}
                <Link href="/terms" className="checkbox-link">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="checkbox-link">Privacy Policy</Link>
              </label>
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-label">Already have an account?</span>
          </div>

          {/* Sign In Link */}
          <div className="signin-section">
            <p className="signin-text">
              <Link href="/login" className="signin-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 