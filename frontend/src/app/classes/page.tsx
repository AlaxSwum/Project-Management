'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'

interface ClassItem {
  id: number
  class_title: string
  class_type: string
  target_audience: string
  class_date: string
  start_time: string
  end_time: string
  duration: string
  location: string
  instructor_name: string
  instructor_bio: string
  class_description: string
  learning_objectives: string[]
  prerequisites: string
  max_participants: number
  current_participants: number
  status: string
  registration_deadline: string | null
  materials_needed: string
  folder_id?: number | null
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

interface ClassesMember {
  id: number
  user_id: number
  role: string
  user: User
}

const CLASS_TYPES = ['PR Workshop', 'Media Training', 'Communication Skills', 'Leadership Development', 'Crisis Management', 'Public Speaking', 'Writing Workshop', 'Strategic Planning']
const TARGET_AUDIENCES = ['Executives', 'Marketing Team', 'Sales Team', 'HR Team', 'All Staff', 'Management', 'Customer Service', 'External Clients']
const DURATIONS = ['1 hour', '2 hours', '3 hours', 'Half day', 'Full day', '2 days', '1 week']
const LOCATIONS = ['Conference Room A', 'Conference Room B', 'Training Center', 'Online - Zoom', 'Online - Teams', 'External Venue', 'Hybrid']
const STATUSES = ['planning', 'open_registration', 'full', 'in_progress', 'completed', 'cancelled']

export default function ClassesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [classItems, setClassItems] = useState<ClassItem[]>([])

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      console.log('🔍 Checking Classes access for user:', user.id, user.email);
      
      // Check if user is a classes member
      const { data: memberData, error: memberError } = await supabase
        .from('classes_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      console.log('📋 Classes member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('✅ Classes access granted: User is a member');
        setHasAccess(true)
        setUserRole(memberData.role)
      } else {
        // Check if user is admin/HR
        const { data: userData, error: userError } = await supabase
          .from('auth_user')
          .select('id, name, email, role, is_superuser, is_staff')
          .eq('id', user.id)
          .single()

        console.log('👤 Classes user data check:', userData);

        if (userError) {
          console.log('❌ Classes access denied: User data error');
          setHasAccess(false)
          return
        }

        const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr'
        console.log('🔐 Classes admin/HR check:', {
          is_superuser: userData.is_superuser,
          is_staff: userData.is_staff,
          role: userData.role,
          hasPermission
        });
        
        if (hasPermission) {
          setHasAccess(true)
          setUserRole('admin')
        } else {
          setHasAccess(false)
        }
      }
    } catch (err) {
      console.error('Error checking classes access:', err)
      setError('Failed to check access permissions')
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
      setIsLoading(false)
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [hasAccess, user?.id])

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
              You don't have permission to access the Classes section.
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
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        
        <div style={{ 
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
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                margin: '0', 
                color: '#000000'
              }}>
                Classes (PR)
              </h1>
              <p style={{ fontSize: '1rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
                Manage PR and communication training classes and workshops
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Placeholder content */}
          <div style={{
            background: '#f9f9f9',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center',
            color: '#666666'
          }}>
            <CalendarIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Classes page is ready! Database setup needed first.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Run the create_classes_tables.sql script in Supabase to complete setup.
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 