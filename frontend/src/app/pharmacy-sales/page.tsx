'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { ShoppingBagIcon, WrenchScrewdriverIcon, PlusIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface SalesItem {
  id: string;
  entry_date: string;
  category: string;
  sub_category: string;
  item_type: string;
  item_name: string;
  quantity: number;
  price: number;
  total_amount: number;
  notes: string;
  created_by: number;
}

interface ServiceItem {
  id: string;
  entry_date: string;
  category: string;
  sub_category: string;
  service_type: string;
  service_name: string;
  quantity: number;
  price: number;
  total_amount: number;
  notes: string;
  created_by: number;
}

interface Category {
  id: string;
  type: 'sale' | 'service';
  category_name: string;
  sub_category_name: string;
  item_type_name: string;
  display_order: number;
}

export default function PharmacySalesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'sales' | 'services'>('sales');
  
  // Data states
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    category: '',
    sub_category: '',
    item_type: '',
    name: '',
    quantity: 0,
    price: 0,
    notes: ''
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { supabase } = await import('@/lib/supabase');
      
      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from('pharmacy_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!catError) setCategories(categoriesData || []);
      
      // Fetch sales items
      const { data: salesData, error: salesError } = await supabase
        .from('pharmacy_sales_items')
        .select('*')
        .eq('entry_date', selectedDate)
        .order('category', { ascending: true });
      
      if (!salesError) setSalesItems(salesData || []);
      
      // Fetch service items
      const { data: servicesData, error: servicesError } = await supabase
        .from('pharmacy_service_items')
        .select('*')
        .eq('entry_date', selectedDate)
        .order('category', { ascending: true });
      
      if (!servicesError) setServiceItems(servicesData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, selectedDate]);

  // Add item
  const addItem = async () => {
    if (!user) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const tableName = activeTab === 'sales' ? 'pharmacy_sales_items' : 'pharmacy_service_items';
      
      const itemData: any = {
        entry_date: formData.entry_date,
        category: formData.category,
        sub_category: formData.sub_category || null,
        quantity: formData.quantity,
        price: formData.price || 0,
        total_amount: formData.quantity * (formData.price || 0),
        notes: formData.notes,
        created_by: user.id
      };
      
      if (activeTab === 'sales') {
        itemData.item_type = formData.item_type;
        itemData.item_name = formData.name;
      } else {
        itemData.service_type = formData.item_type;
        itemData.service_name = formData.name;
      }
      
      const { error } = await supabase
        .from(tableName)
        .insert([itemData]);
      
      if (error) throw error;
      
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        category: '',
        sub_category: '',
        item_type: '',
        name: '',
        quantity: 0,
        price: 0,
        notes: ''
      });
      setShowAddForm(false);
      await fetchData();
      alert('Item added successfully!');
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert('Error: ' + error.message);
    }
  };

  // Delete item
  const deleteItem = async (id: string, type: 'sales' | 'services') => {
    if (!confirm('Delete this item?')) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const tableName = type === 'sales' ? 'pharmacy_sales_items' : 'pharmacy_service_items';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      alert('Item deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert('Error: ' + error.message);
    }
  };

  // Calculate totals
  const calculateDailyTotal = (items: SalesItem[] | ServiceItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Get categories for current tab
  const getCurrentCategories = () => {
    return categories.filter(c => c.type === (activeTab === 'sales' ? 'sale' : 'service'));
  };

  // Group items by category and type
  const groupItems = (items: SalesItem[] | ServiceItem[]) => {
    const grouped: any = {};
    items.forEach(item => {
      const key = `${item.category}-${(item as any).item_type || (item as any).service_type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #C483D9', 
            borderTop: '3px solid #5884FD', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile && <MobileHeader title="Pharmacy Sales" isMobile={isMobile} />}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div className="pharmacy-sales-container" style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        
        <div className="pharmacy-sales-main" style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '80px' : '2rem',
          background: '#F5F5ED', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div className="pharmacy-sales-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '0',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '1.75rem' : '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Daily Sales Tracking
              </h1>
              <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Rother Care Pharmacy - Sales and Services Management
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon style={{ width: '20px', height: '20px', color: '#666666' }} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                Add Item
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid #e0e0e0'
          }}>
            <button
              onClick={() => setActiveTab('sales')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'sales' ? '#ffffff' : 'transparent',
                color: activeTab === 'sales' ? '#5884FD' : '#666666',
                border: 'none',
                borderBottom: activeTab === 'sales' ? '3px solid #5884FD' : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShoppingBagIcon style={{ width: '20px', height: '20px' }} />
              Sales Items
            </button>
            
            <button
              onClick={() => setActiveTab('services')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'services' ? '#ffffff' : 'transparent',
                color: activeTab === 'services' ? '#10b981' : '#666666',
                border: 'none',
                borderBottom: activeTab === 'services' ? '3px solid #10b981' : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <WrenchScrewdriverIcon style={{ width: '20px', height: '20px' }} />
              Services
            </button>
          </div>

          {/* Sales Items Tab */}
          {activeTab === 'sales' && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(to bottom, #dbeafe, #bfdbfe)', borderBottom: '2px solid #3b82f6' }}>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Category</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Sub Category</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Item Type</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Item Name</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Quantity</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Price</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Total</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#999999' }}>
                            No sales items for this date. Click "Add Item" to get started.
                          </td>
                        </tr>
                      ) : (
                        salesItems.map(item => (
                          <tr 
                            key={item.id}
                            style={{ borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                              {new Date(item.entry_date).toLocaleDateString('en-GB')}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                              {item.category}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.sub_category || '-'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.item_type}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                              {item.item_name}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', textAlign: 'right', fontWeight: '600' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'right' }}>
                              £{item.price?.toFixed(2) || '0.00'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', textAlign: 'right', fontWeight: '600' }}>
                              £{item.total_amount?.toFixed(2) || '0.00'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteItem(item.id, 'sales')}
                                style={{
                                  padding: '0.5rem',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  borderRadius: '6px'
                                }}
                                title="Delete"
                              >
                                <TrashIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {/* Total Row */}
                      {salesItems.length > 0 && (
                        <tr style={{ background: '#eff6ff', borderTop: '2px solid #3b82f6' }}>
                          <td colSpan={5} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1e40af', fontWeight: '700' }}>
                            DAILY TOTAL
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1e40af', fontWeight: '700', textAlign: 'right' }}>
                            {calculateDailyTotal(salesItems)}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}></td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1e40af', fontWeight: '700', textAlign: 'right' }}>
                            £{salesItems.reduce((sum, item) => sum + (item.total_amount || 0), 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(to bottom, #d1fae5, #a7f3d0)', borderBottom: '2px solid #10b981' }}>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Category</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Sub Category</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Service Type</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Service Name</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Quantity</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Price</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Total</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#999999' }}>
                            No services for this date. Click "Add Item" to get started.
                          </td>
                        </tr>
                      ) : (
                        serviceItems.map(item => (
                          <tr 
                            key={item.id}
                            style={{ borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                              {new Date(item.entry_date).toLocaleDateString('en-GB')}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                              {item.category}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.sub_category || '-'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.service_type}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                              {item.service_name}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', textAlign: 'right', fontWeight: '600' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'right' }}>
                              £{item.price?.toFixed(2) || '0.00'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', textAlign: 'right', fontWeight: '600' }}>
                              £{item.total_amount?.toFixed(2) || '0.00'}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteItem(item.id, 'services')}
                                style={{
                                  padding: '0.5rem',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  borderRadius: '6px'
                                }}
                                title="Delete"
                              >
                                <TrashIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {/* Total Row */}
                      {serviceItems.length > 0 && (
                        <tr style={{ background: '#d1fae5', borderTop: '2px solid #10b981' }}>
                          <td colSpan={5} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#065f46', fontWeight: '700' }}>
                            DAILY TOTAL
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#065f46', fontWeight: '700', textAlign: 'right' }}>
                            {calculateDailyTotal(serviceItems)}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}></td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#065f46', fontWeight: '700', textAlign: 'right' }}>
                            £{serviceItems.reduce((sum, item) => sum + (item.total_amount || 0), 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', marginBottom: '1.5rem', color: '#1a1a1a' }}>
              Add {activeTab === 'sales' ? 'Sales' : 'Service'} Item
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {activeTab === 'sales' ? (
                    <>
                      <option value="ETP">ETP</option>
                      <option value="Green">Green</option>
                      <option value="New Service">New Service</option>
                    </>
                  ) : (
                    <>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Sub Category
                </label>
                <input
                  type="text"
                  value={formData.sub_category}
                  onChange={(e) => setFormData({...formData, sub_category: e.target.value})}
                  placeholder="e.g., New User, Existing User"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Item/Service Type *
                </label>
                <input
                  type="text"
                  value={formData.item_type}
                  onChange={(e) => setFormData({...formData, item_type: e.target.value})}
                  placeholder={activeTab === 'sales' ? 'e.g., ETP New User Items' : 'e.g., Consultation Services'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  {activeTab === 'sales' ? 'Item' : 'Service'} Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={activeTab === 'sales' ? 'Product name' : 'Service name'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                    Price (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                disabled={!formData.category || !formData.name || !formData.quantity}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'sales' ? '#5884FD' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (!formData.category || !formData.name || !formData.quantity) ? 0.5 : 1
                }}
              >
                Add {activeTab === 'sales' ? 'Sale' : 'Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

