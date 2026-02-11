'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  Squares2X2Icon,
  UserGroupIcon,
  PaintBrushIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('edit-profile');
  const [isMobile, setIsMobile] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Profile states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    location: '',
    bio: '',
    avatar_url: ''
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Password states
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Sessions (mock data for now)
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', device: 'Chrome on MacBook Pro', ip: '222.225.225.222', lastActive: 'Nov 17, 2023', current: true },
    { id: '2', device: 'Chrome on iPhone', ip: '222.225.225.222', lastActive: 'Nov 17, 2023', current: false },
    { id: '3', device: 'Safari on MacBook Pro', ip: '222.225.225.222', lastActive: 'Nov 17, 2023', current: false }
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchProjects();
    loadProfileData();
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchProjects = async () => {
    try {
      const projectsData = await import('@/lib/api-compatibility').then(m => m.projectService.getProjects());
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      // Fetch profile data from database including avatar
      const { data, error } = await supabase
        .from('auth_user')
        .select('name, email, avatar_url, location, bio')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error);
        // Fallback to user object
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          location: '',
          bio: '',
          avatar_url: ''
        });
        return;
      }
      
      setProfileData({
        name: data?.name || user.name || '',
        email: data?.email || user.email || '',
        location: data?.location || '',
        bio: data?.bio || '',
        avatar_url: data?.avatar_url || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        location: '',
        bio: '',
        avatar_url: ''
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        try {
          // Update user profile with base64 image
          const { error } = await supabase
            .from('auth_user')
            .update({ avatar_url: base64Image })
            .eq('id', user.id);
          
          if (error) throw error;
          
          setProfileData({ ...profileData, avatar_url: base64Image });
          alert('Avatar updated successfully!');
        } catch (error) {
          console.error('Error saving avatar:', error);
          alert('Failed to save avatar');
        }
        setUploadingAvatar(false);
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read image file');
        setUploadingAvatar(false);
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('auth_user')
        .update({
          name: profileData.name,
          location: profileData.location,
          bio: profileData.bio,
          // Note: email changes might require re-authentication
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      // Note: Supabase password change requires the user to be authenticated
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });
      
      if (error) throw error;
      
      alert('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert('Failed to change password: ' + error.message);
    }
    setChangingPassword(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    if (window.confirm('Revoke this session?')) {
      setSessions(sessions.filter(s => s.id !== sessionId));
    }
  };

  const handleSignOutAll = () => {
    if (window.confirm('Sign out of all devices?')) {
      logout();
      router.push('/login');
    }
  };

  const tabs = [
    { id: 'edit-profile', label: 'Edit profile', icon: UserCircleIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'sessions', label: 'Sessions', icon: ComputerDesktopIcon },
  ];

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      
      <div className="page-main" style={{ flex: 1, marginLeft: isMobile ? 0 : '280px', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid #1F1F1F', background: '#141414' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Settings</h1>
          <p style={{ color: '#71717A', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Tabs */}
          <div style={{ 
            width: '250px', 
            background: '#141414', 
            borderRight: '1px solid #1F1F1F',
            padding: '1.5rem 1rem',
            overflowY: 'auto'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isActive ? '#3B82F6' : 'transparent',
                    border: isActive ? '1px solid #3B82F6' : '1px solid transparent',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#A1A1AA',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '0.5rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#1A1A1A';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#A1A1AA';
                    }
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                  {tab.label}
                </button>
              );
            })}
            
            {/* Delete Account */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  // Handle account deletion
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '1rem',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <XMarkIcon style={{ width: '18px', height: '18px' }} />
              Delete account
            </button>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            {activeTab === 'edit-profile' && (
              <div style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1.5rem' }}>
                  Edit profile
                </h2>
                
                {/* Avatar */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                    Avatar
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: profileData.avatar_url 
                        ? `url(${profileData.avatar_url}) center/cover` 
                        : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '2rem',
                      fontWeight: 600,
                    }}>
                      {!profileData.avatar_url && (user?.name?.charAt(0) || 'U')}
                    </div>
                    <div>
                      <label
                        htmlFor="avatar-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 1.25rem',
                          background: '#3B82F6',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: uploadingAvatar ? 0.6 : 1,
                        }}
                      >
                        <ArrowUpTrayIcon style={{ width: '16px', height: '16px' }} />
                        {uploadingAvatar ? 'Uploading...' : 'Upload new image'}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        style={{ display: 'none' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.5rem' }}>
                        At least 800x800 px recommended. JPG or PNG and GIF is allowed
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Name */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Username or email"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>
                
                {/* Location */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="Sai Gon, Vietnam"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>
                
                {/* Bio */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Bio
                    <span style={{ color: '#71717A', fontWeight: 400, marginLeft: '0.5rem' }}>880</span>
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Short bio"
                    rows={4}
                    maxLength={880}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>
                
                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                >
                  Save changes
                </button>
              </div>
            )}

            {activeTab === 'password' && (
              <div style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1.5rem' }}>
                  Password
                </h2>
                
                {/* Old Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Old password
                  </label>
                  <input
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>
                
                {/* New Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    New password
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="New password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.5rem' }}>
                    Minimum 8 characters
                  </p>
                </div>
                
                {/* Confirm Password */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.5rem' }}>
                    Minimum 8 characters
                  </p>
                </div>
                
                {/* Change Password Button */}
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !passwordData.new_password || !passwordData.confirm_password}
                  style={{
                    padding: '0.75rem 2rem',
                    background: passwordData.new_password && passwordData.confirm_password ? '#3B82F6' : '#3D3D3D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: passwordData.new_password && passwordData.confirm_password ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: changingPassword ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (passwordData.new_password && passwordData.confirm_password && !changingPassword) {
                      e.currentTarget.style.background = '#2563EB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (passwordData.new_password && passwordData.confirm_password) {
                      e.currentTarget.style.background = '#3B82F6';
                    }
                  }}
                >
                  {changingPassword ? 'Changing...' : 'Change password'}
                </button>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div style={{ maxWidth: '700px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Your sessions
                </h2>
                <p style={{ color: '#71717A', fontSize: '0.875rem', marginBottom: '2rem' }}>
                  This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#E4E4E7', fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Devices</h3>
                  
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem',
                        background: '#141414',
                        border: '1px solid #2D2D2D',
                        borderRadius: '12px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#3B82F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <ComputerDesktopIcon style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
                        </div>
                        <div>
                          <div style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 500 }}>
                            {session.device}
                            {session.current && (
                              <span style={{
                                marginLeft: '0.5rem',
                                padding: '0.125rem 0.5rem',
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.6875rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}>
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#71717A', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                            {session.ip}
                          </div>
                          <div style={{ color: '#71717A', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                            Signed in Nov 17, 2023
                          </div>
                        </div>
                      </div>
                      
                      {!session.current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: '1px solid #3D3D3D',
                            borderRadius: '6px',
                            color: '#E4E4E7',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#EF4444';
                            e.currentTarget.style.color = '#EF4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#3D3D3D';
                            e.currentTarget.style.color = '#E4E4E7';
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Sign out all devices */}
                <button
                  onClick={handleSignOutAll}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EF4444';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                >
                  Sign out all devices
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
