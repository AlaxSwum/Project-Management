'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface ContentCalendarItem {
  id: number
  date: string
  content_type: string
  category: string
  social_media: string
  content_title: string
  assigned_to: number[]
  content_deadline: string | null
  graphic_deadline: string | null
  status: string
  description?: string
  folder_id?: number | null
  assignees?: User[]
  created_by: User
  created_at: string
  updated_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface ContentCalendarFolder {
  id: number
  name: string
  description?: string
  parent_folder_id?: number
  folder_type: string
  color: string
  sort_order: number
  level: number
  path: string
  created_by_id: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [contentItems, setContentItems] = useState<ContentCalendarItem[]>([])
  const [folders, setFolders] = useState<ContentCalendarFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Check if user is a project member for content calendar access
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      if (memberData && !memberError) {
        setHasAccess(true)
        setUserRole(memberData.role)
      } else {
        const { data: userData, error: userError } = await supabase
          .from('auth_user')
          .select('id, name, email, role, is_superuser, is_staff')
          .eq('id', user.id)
          .single()

        if (userError) {
          setHasAccess(false)
          return
        }

        const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr'
        
        if (hasPermission) {
          setHasAccess(true)
          setUserRole('admin')
        } else {
          setHasAccess(false)
        }
      }
    } catch (err) {
      console.error('Error checking access:', err)
      setError('Failed to check access permissions')
    }
  }

  const fetchData = async () => {
    if (!hasAccess || !user?.id) return

    try {
      const { supabaseDb } = await import('@/lib/supabase')
      
      const { data: itemsData } = await supabaseDb.getContentCalendarItems()
      const { data: foldersData } = await supabaseDb.getContentCalendarFolders()

      setContentItems(itemsData || [])
      setFolders(foldersData || [])
      
      const yearFolders = (foldersData || [])
        .filter((folder: ContentCalendarFolder) => folder.folder_type === 'year')
        .map((folder: ContentCalendarFolder) => folder.id)
      setExpandedFolders(new Set(yearFolders))
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load content calendar data')
    }
  }

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    checkAccess()
  }, [isAuthenticated, authLoading, user?.id, router])

  useEffect(() => {
    if (hasAccess) {
      fetchData().finally(() => setIsLoading(false))
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [hasAccess, user?.id, selectedFolder])

  const toggleFolderExpansion = (folderId: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const selectFolder = (folderId: number | null) => {
    setSelectedFolder(folderId)
  }

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #cccccc', 
            borderTop: '3px solid #000000', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#000000' }}>
              Access Denied
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666666', marginBottom: '2rem' }}>
              You don't have permission to access the Content Calendar.
              Please contact an administrator to request access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '1rem 2rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Ensure content doesn't get covered by sidebar */
          .content-calendar-main {
            margin-left: 256px !important;
            transition: margin-left 0.3s ease;
            min-height: 100vh;
            background: #ffffff;
          }
          
          /* Ultra-prominent folder navigation styles */
          .ultra-folder-nav {
            background: linear-gradient(135deg, #000000 0%, #333333 100%) !important;
            border: 4px solid #000000 !important;
            border-radius: 16px !important;
            padding: 2rem !important;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4) !important;
            position: relative !important;
            width: 500px !important;
            min-height: 600px !important;
          }
          
          .folder-corner-accent {
            position: absolute;
            top: 0;
            right: 0;
            width: 60px;
            height: 60px;
            background: #fbbf24;
            clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        
        <div className="content-calendar-main" style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            borderBottom: '3px solid #000000',
            paddingBottom: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '900', 
                margin: '0', 
                color: '#000000',
                textTransform: 'uppercase'
              }}>
                📅 Content Calendar
              </h1>
              <p style={{ fontSize: '1rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
                Manage your social media content planning and scheduling
              </p>
            </div>
            
            <button
              style={{
                padding: '1rem 2rem',
                background: '#000000',
                color: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              ✨ ADD CONTENT
            </button>
          </div>

          {/* Debug Info */}
          <div style={{
            background: '#f0f0f0',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            🔍 DEBUG: Folders={folders.length} | Items={contentItems.length} | Selected={selectedFolder} | User={user?.email}
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '3px solid #dc2626', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              marginBottom: '2rem',
              color: '#dc2626',
              fontWeight: '700',
              fontSize: '1.1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* MAIN LAYOUT: Ultra-Prominent Folder Navigation + Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '500px 1fr',
            gap: '3rem',
            marginBottom: '2rem'
          }}>
            
            {/* ULTRA-PROMINENT FOLDER NAVIGATION */}
            <div className="ultra-folder-nav">
              <div className="folder-corner-accent" />
              
              {/* DRAMATIC HEADER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{ fontSize: '3rem' }}>📁</span>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '900', 
                  margin: '0', 
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>
                  FOLDER SYSTEM
                </h2>
              </div>
              
              {/* STATUS BOX */}
              <div style={{
                background: folders.length > 0 ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #f59e0b, #d97706)',
                border: '4px solid #ffffff',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontWeight: '900', 
                  fontSize: '1.5rem',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {folders.length > 0 ? '🎉 FOLDERS ACTIVE!' : '⚠️ SETUP REQUIRED'}
                </div>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '1rem', 
                  marginTop: '1rem', 
                  fontWeight: '700'
                }}>
                  📊 Found: {folders.length} folders | Root: {folders.filter(f => !f.parent_folder_id).length}
                </div>
                {folders.length === 0 && (
                  <div style={{
                    background: '#ffffff',
                    color: '#000000',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginTop: '1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    border: '2px solid #000000'
                  }}>
                    🔧 RUN SQL SETUP SCRIPT
                    <br />
                    Create 2025 → month structure
                  </div>
                )}
              </div>
              
              {/* ALL FILES BUTTON */}
              <div
                onClick={() => selectFolder(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: '4px solid #ffffff',
                  background: selectedFolder === null ? 'linear-gradient(45deg, #ffffff, #f3f4f6)' : 'rgba(255,255,255,0.1)',
                  color: selectedFolder === null ? '#000000' : '#ffffff',
                  fontWeight: '900',
                  marginBottom: '2rem',
                  fontSize: '1.2rem',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedFolder === null ? '0 6px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                <FolderIcon style={{ width: '32px', height: '32px' }} />
                <span>📄 ALL FILES</span>
              </div>
              
              {/* FOLDER TREE */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                padding: '2rem',
                border: '3px solid #000000',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
              }}>
                {folders.length === 0 ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    border: '3px solid #ffffff',
                    borderRadius: '16px',
                    padding: '3rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>
                      🚫 NO STRUCTURE
                    </div>
                    <div style={{ color: '#ffffff', fontSize: '1rem', lineHeight: '1.8' }}>
                      Expected after SQL setup:
                      <br />
                      📂 2025 → 📅 January, February, March...
                    </div>
                  </div>
                ) : (
                  folders
                    .filter(folder => folder.parent_folder_id === null)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(folder => (
                      <div key={folder.id} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          borderRadius: '12px',
                          background: selectedFolder === folder.id ? '#000000' : '#f3f4f6',
                          color: selectedFolder === folder.id ? '#ffffff' : '#000000',
                          fontWeight: '800',
                          border: '3px solid #000000',
                          fontSize: '1.1rem'
                        }}>
                          <button
                            onClick={() => toggleFolderExpansion(folder.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'inherit',
                              padding: '0'
                            }}
                          >
                            {expandedFolders.has(folder.id) ? (
                              <ChevronDownIcon style={{ width: '24px', height: '24px' }} />
                            ) : (
                              <ChevronRightIcon style={{ width: '24px', height: '24px' }} />
                            )}
                          </button>
                          
                          <FolderIcon style={{ width: '32px', height: '32px' }} />
                          
                          <span
                            onClick={() => selectFolder(folder.id)}
                            style={{ fontSize: '1.2rem', flex: 1 }}
                          >
                            📅 {folder.name}
                          </span>
                        </div>
                        
                        {expandedFolders.has(folder.id) && (
                          <div style={{ marginLeft: '3rem', marginTop: '1rem' }}>
                            {folders
                              .filter(child => child.parent_folder_id === folder.id)
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map(child => (
                                <div
                                  key={child.id}
                                  onClick={() => selectFolder(child.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.5rem',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    background: selectedFolder === child.id ? '#000000' : 'transparent',
                                    color: selectedFolder === child.id ? '#ffffff' : '#555555',
                                    fontSize: '1rem',
                                    marginBottom: '0.5rem',
                                    border: selectedFolder === child.id ? '2px solid #000000' : '2px solid #e5e7eb',
                                    fontWeight: selectedFolder === child.id ? '800' : '600'
                                  }}
                                >
                                  <CalendarIcon style={{ width: '24px', height: '24px' }} />
                                  <span>📅 {child.name}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
            
            {/* CONTENT AREA */}
            <div style={{ 
              background: '#f9fafb', 
              border: '3px solid #000000', 
              borderRadius: '16px', 
              padding: '2rem',
              minHeight: '600px'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '800', 
                margin: '0 0 1.5rem 0', 
                color: '#000000',
                textTransform: 'uppercase'
              }}>
                📝 Content Items ({contentItems.length})
              </h3>
              
              {selectedFolder && (
                <div style={{ 
                  background: '#000000',
                  color: '#ffffff',
                  border: '3px solid #000000',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  fontSize: '1.1rem',
                  fontWeight: '800'
                }}>
                  <span>📁 VIEWING: </span>
                  <span style={{ color: '#fbbf24' }}>
                    {folders.find(f => f.id === selectedFolder)?.name || 'Unknown'}
                  </span>
                </div>
              )}
              
              {contentItems.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  border: '3px solid #cccccc',
                  borderRadius: '16px',
                  padding: '4rem',
                  textAlign: 'center',
                  color: '#666666'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📄</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 1rem 0' }}>
                    No Content Found
                  </h4>
                  <p style={{ margin: '0', fontStyle: 'italic', fontSize: '1.1rem' }}>
                    Create your first content item to get started.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#ffffff',
                  border: '3px solid #000000',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  {contentItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '1.5rem',
                        borderBottom: index < contentItems.length - 1 ? '2px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '800', 
                        color: '#000000', 
                        fontSize: '1.2rem', 
                        marginBottom: '0.75rem'
                      }}>
                        📝 {item.content_title}
                      </div>
                      <div style={{ 
                        color: '#666666', 
                        fontSize: '0.9rem', 
                        display: 'flex', 
                        gap: '1.5rem',
                        fontWeight: '600'
                      }}>
                        <span>🎯 {item.content_type}</span>
                        <span>📱 {item.social_media}</span>
                        <span>⚡ {item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 