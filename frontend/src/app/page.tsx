'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Force show the page after 4 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout, showing page anyway');
        setForceShow(true);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && !forceShow) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Loading...</div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          If this takes too long, <button 
            onClick={() => setForceShow(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4f46e5', 
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            click here to continue
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
            min-height: 100vh;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
          }
          .header {
            color: #000000;
            margin-bottom: 3rem;
          }
          .title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #000000;
          }
          .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            color: #666666;
          }
          .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 4rem;
          }
          .btn {
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            border: 2px solid #000000;
            cursor: pointer;
            display: inline-block;
          }
          .btn-primary {
            background: #000000;
            color: #ffffff;
          }
          .btn-primary:hover {
            background: #333333;
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .btn-secondary {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
          }
          .btn-secondary:hover {
            background: #f5f5f5;
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
          }
          .feature-card {
            background: #ffffff;
            border: 2px solid #000000;
            padding: 2rem;
            border-radius: 8px;
            transition: transform 0.3s ease;
          }
          .feature-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .feature-icon {
            width: 60px;
            height: 60px;
            background: #f5f5f5;
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: #000000;
            font-size: 1.5rem;
          }
          .feature-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .feature-desc {
            color: #666666;
            line-height: 1.6;
          }
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            
            .title { 
              font-size: 2rem; 
              line-height: 1.2;
            }
            
            .subtitle {
              font-size: 1rem;
              margin-bottom: 1.5rem;
            }
            
            .buttons { 
              flex-direction: column; 
              align-items: center;
              gap: 0.75rem;
            }
            
            .btn { 
              width: 100%;
              max-width: 280px;
              padding: 1rem 1.5rem;
            }
            
            .header {
              margin-bottom: 2rem;
            }
            
            .features {
              grid-template-columns: 1fr;
              gap: 1.5rem;
              margin-top: 2rem;
            }
            
            .feature-card {
              padding: 1.5rem;
            }
            
            .feature-title {
              font-size: 1.1rem;
            }
            
            .feature-desc {
              font-size: 0.9rem;
            }
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 0.75rem;
            }
            
            .title { 
              font-size: 1.75rem; 
            }
            
            .subtitle {
              font-size: 0.9rem;
            }
            
            .btn {
              font-size: 1rem;
              padding: 0.875rem 1.25rem;
            }
            
            .feature-card {
              padding: 1.25rem;
            }
            
            .feature-icon {
              width: 50px;
              height: 50px;
              font-size: 1.25rem;
            }
            
            .feature-title {
              font-size: 1rem;
            }
            
            .feature-desc {
              font-size: 0.85rem;
            }
          }
        `
      }} />
      
      <div className="container">
        <div className="header">
          <h1 className="title">Project Management</h1>
          <p className="subtitle">Simple, effective project management for modern teams</p>
          
          <div className="buttons">
            <Link href="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3 className="feature-title">Organize Projects</h3>
            <p className="feature-desc">Create and manage projects with ease using our intuitive interface</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-desc">Work together seamlessly with your team members</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Secure & Private</h3>
            <p className="feature-desc">Your data is protected with enterprise-grade security</p>
          </div>
        </div>
      </div>
    </div>
  );
}
