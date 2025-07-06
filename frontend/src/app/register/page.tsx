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
          background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }
        
        .register-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 179, 51, 0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        .register-container::after {
          content: '';
          position: absolute;
          top: 20%;
          right: -30%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(196, 131, 217, 0.08) 0%, transparent 70%);
          animation: float 8s ease-in-out infinite reverse;
        }
        
        .register-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .register-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        }
        
        .logo-container {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .logo-link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: transform 0.3s ease;
        }
        
        .logo-link:hover {
          transform: scale(1.05);
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #FFB333, #FFD480);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
        }
        
        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          font-family: 'Inter', sans-serif;
        }
        
        .title-section {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.5rem;
          font-family: 'Inter', sans-serif;
        }
        
        .subtitle {
          color: #6B7280;
          font-size: 1rem;
        }
        
        .error-message {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
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
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1F2937;
          font-family: 'Inter', sans-serif;
        }
        
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: #FFFFFF;
          color: #1F2937;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .form-input:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .form-input:hover {
          border-color: #D1D5DB;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .form-input::placeholder {
          color: #9CA3AF;
        }
        
        .form-help {
          font-size: 0.75rem;
          color: #6B7280;
          margin-top: 0.25rem;
        }
        
        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .checkbox {
          width: 1rem;
          height: 1rem;
          border: 2px solid #D1D5DB;
          border-radius: 4px;
          background: #FFFFFF;
          cursor: pointer;
          margin-top: 0.25rem;
          flex-shrink: 0;
        }
        
        .checkbox:checked {
          background: #FFB333;
          border-color: #FFB333;
        }
        
        .checkbox-label {
          font-size: 0.875rem;
          color: #6B7280;
          cursor: pointer;
          line-height: 1.4;
        }
        
        .checkbox-link {
          color: #FFB333;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .checkbox-link:hover {
          color: #E69A00;
        }
        
        .submit-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
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
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.4);
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
          margin: 2rem 0;
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
          padding: 0 0.5rem;
          background: rgba(255, 255, 255, 0.95);
          color: #6B7280;
        }
        
        .signin-section {
          text-align: center;
        }
        
        .signin-text {
          color: #6B7280;
          font-size: 0.875rem;
        }
        
        .signin-link {
          font-weight: 600;
          color: #FFB333;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .signin-link:hover {
          color: #E69A00;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .feature-card {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-2px);
        }
        
        .feature-icon {
          width: 32px;
          height: 32px;
          margin: 0 auto 0.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }
        
        .feature-icon.primary {
          background: linear-gradient(135deg, #FFB333, #FFD480);
        }
        
        .feature-icon.blue {
          background: linear-gradient(135deg, #5884FD, #8BA4FE);
        }
        
        .feature-icon.purple {
          background: linear-gradient(135deg, #C483D9, #D9A3E6);
        }
        
        .feature-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1F2937;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .register-card {
            padding: 1.5rem;
            margin: 1rem;
          }
          
          .title {
            font-size: 1.5rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .feature-card {
            padding: 0.75rem;
          }
        }
      `}</style>
      
      <div className="register-container">
        <div className="register-card">
          {/* Logo */}
          <div className="logo-container">
            <Link href="/" className="logo-link">
              <div className="logo-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFFFFF' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="logo-text">ProjectHub</span>
            </Link>
          </div>

          {/* Title */}
          <div className="title-section">
            <h1 className="title">Create Account</h1>
            <p className="subtitle">Join ProjectHub and start managing projects professionally</p>
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
                  Position <span style={{ color: '#9CA3AF' }}>(Optional)</span>
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
                  Phone Number <span style={{ color: '#9CA3AF' }}>(Optional)</span>
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
            <div className="divider-line">
              <div className="divider-border"></div>
            </div>
            <div className="divider-text">
              <span className="divider-label">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="signin-section">
            <p className="signin-text">
              Ready to sign in?{' '}
              <Link href="/login" className="signin-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon primary">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="feature-text">Task Management</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="feature-text">Team Collaboration</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="feature-text">Analytics</p>
          </div>
        </div>
      </div>
    </>
  );
} 