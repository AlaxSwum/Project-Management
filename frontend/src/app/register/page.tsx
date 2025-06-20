'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'member',
    position: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      router.push('/login');
    } catch (err: any) {
      if (err.response?.data) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(err.response.data)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        setError(errorMessages.join('; '));
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const roles = [
    { value: 'member', label: 'Team Member' },
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Project Manager' },
    { value: 'analyst', label: 'Business Analyst' },
    { value: 'admin', label: 'Administrator' },
  ];

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
          .register-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .register-card {
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: 100%;
            max-width: 450px;
          }
          .register-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .register-title {
            font-size: 2rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .register-subtitle {
            color: #666666;
            font-size: 0.95rem;
          }
          .register-subtitle a {
            color: #000000;
            text-decoration: none;
            font-weight: 500;
          }
          .register-subtitle a:hover {
            text-decoration: underline;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-group-full {
            grid-column: 1 / -1;
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
          .form-select {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
            box-sizing: border-box;
            background: white;
          }
          .form-select:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .form-help {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
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
          .register-button {
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
            margin-top: 1rem;
          }
          .register-button:hover:not(:disabled) {
            background: #333333;
            transform: translateY(-1px);
          }
          .register-button:disabled {
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
          .register-footer {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #666666;
          }
          .register-footer a {
            color: #000000;
            text-decoration: none;
            font-weight: 500;
          }
          .register-footer a:hover {
            text-decoration: underline;
          }
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .register-container {
              padding: 1rem 0.5rem;
            }
            
            .form-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .register-card {
              padding: 2rem;
              border-radius: 12px;
            }
            
            .register-title {
              font-size: 1.75rem;
            }
            
            .form-group {
              margin-bottom: 1.25rem;
            }
          }
          
          @media (max-width: 480px) {
            .register-container {
              padding: 0.5rem 0.25rem;
            }
            
            .register-card {
              padding: 1.5rem;
              border-radius: 8px;
              max-width: 100%;
            }
            
            .register-title {
              font-size: 1.5rem;
            }
            
            .register-subtitle {
              font-size: 0.9rem;
            }
            
            .form-input, .form-select {
              padding: 0.875rem 1rem;
              font-size: 1.1rem;
            }
            
            .register-button {
              padding: 1rem;
              font-size: 1.1rem;
            }
            
            .form-help {
              font-size: 0.7rem;
            }
            
            .register-footer {
              font-size: 0.85rem;
              margin-top: 1.5rem;
            }
            
            .form-group {
              margin-bottom: 1rem;
            }
          }
        `
      }} />
      
      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <h1 className="register-title">Create your account</h1>
            <p className="register-subtitle">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group form-group-full">
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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="name" className="form-label">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone number (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="form-input"
                  placeholder="Enter your phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="position" className="form-label">
                  Position/Title (optional)
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  className="form-input"
                  placeholder="Enter your position or title"
                  value={formData.position}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  className="form-input"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="form-help">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="password_confirm" className="form-label">
                  Confirm password
                </label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="register-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="register-footer">
            By creating an account, you agree to our{' '}
            <Link href="/terms">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 