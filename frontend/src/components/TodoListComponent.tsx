'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { todoService } from '@/lib/api-compatibility';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface TodoItem {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  created_by: User;
}

interface TodoListComponentProps {
  projectId: number;
  projectMembers: User[];
}

// Removed priority and category constants - simplified to title, description, due_date only

export default function TodoListComponent({ projectId, projectMembers }: TodoListComponentProps) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State (simplified)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Form State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    due_date: ''
  });

  // Load todos from database
  useEffect(() => {
    const loadTodos = async () => {
      if (!projectId || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const todoData = await todoService.getTodos(projectId);
        setTodos(todoData);
        setError('');
      } catch (err) {
        console.error('Error loading todos:', err);
        setError('Failed to load todos');
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodos();
  }, [projectId, user]);

  // Filtered and sorted todos (simplified)
  const filteredTodos = todos
    .filter(todo => {
      if (filterBy === 'pending' && todo.completed) return false;
      if (filterBy === 'completed' && !todo.completed) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'due_date':
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;
    
    try {
      const createdTodo = await todoService.createTodo(projectId, {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || undefined,
        due_date: newTodo.due_date || undefined
      });
      
      setTodos([createdTodo, ...todos]);
      setNewTodo({
        title: '',
        description: '',
        due_date: ''
      });
      setShowQuickAdd(false);
      setError('');
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create todo');
    }
  };

  const handleToggleComplete = async (todoId: number) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    try {
      const updatedTodo = await todoService.toggleTodoComplete(todoId, !todo.completed);
      setTodos(todos.map(t => 
        t.id === todoId ? updatedTodo : t
      ));
      setError('');
    } catch (err) {
      console.error('Error toggling todo:', err);
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await todoService.deleteTodo(todoId);
      setTodos(todos.filter(todo => todo.id !== todoId));
      setError('');
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo');
    }
  };

  const handleEditTodo = (todo: TodoItem) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date || ''
    });
    setShowQuickAdd(true);
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !newTodo.title.trim()) return;
    
    try {
      const updatedTodo = await todoService.updateTodo(editingTodo.id, {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || undefined,
        due_date: newTodo.due_date || undefined,
        completed: editingTodo.completed
      });
      
      setTodos(todos.map(todo => 
        todo.id === editingTodo.id ? updatedTodo : todo
      ));
      
      setEditingTodo(null);
      setNewTodo({
        title: '',
        description: '',
        due_date: ''
      });
      setShowQuickAdd(false);
      setError('');
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
    }
  };

  const handleBulkComplete = async () => {
    try {
      // Update each selected todo to completed
      const updatePromises = Array.from(selectedTodos).map(todoId =>
        todoService.toggleTodoComplete(todoId, true)
      );
      
      const updatedTodos = await Promise.all(updatePromises);
      
      // Update local state with the results
      setTodos(todos.map(todo => {
        const updatedTodo = updatedTodos.find(ut => ut.id === todo.id);
        return updatedTodo || todo;
      }));
      
      setSelectedTodos(new Set());
      setShowBulkActions(false);
      setError('');
    } catch (err) {
      console.error('Error bulk completing todos:', err);
      setError('Failed to complete some todos');
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Delete each selected todo
      const deletePromises = Array.from(selectedTodos).map(todoId =>
        todoService.deleteTodo(todoId)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setTodos(todos.filter(todo => !selectedTodos.has(todo.id)));
      setSelectedTodos(new Set());
      setShowBulkActions(false);
      setError('');
    } catch (err) {
      console.error('Error bulk deleting todos:', err);
      setError('Failed to delete some todos');
    }
  };

  const handleSelectTodo = (todoId: number) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;
  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.due_date)).length;

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #2D2D2D', borderTop: '3px solid #FFFFFF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div className="todo-list-container">
      <style dangerouslySetInnerHTML={{
        __html: `
          .todo-list-container {
            background: #1A1A1A;
            border: 2px solid #2D2D2D;
            border-radius: 12px;
            overflow: hidden;
          }
          
          .todo-header {
            background: #141414;
            border-bottom: 2px solid #2D2D2D;
            padding: 1.5rem;
          }
          
          .todo-stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
          }
          
          .stat-card {
            background: #1A1A1A;
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            min-width: 120px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #FFFFFF;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.875rem;
            color: #71717A;
            font-weight: 500;
          }
          
          .stat-card.overdue {
            border-color: #ef4444;
            background: #fef2f2;
          }
          
          .stat-card.overdue .stat-value {
            color: #dc2626;
          }
          
          .todo-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
            justify-content: space-between;
          }
          
          .control-group {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            flex-wrap: wrap;
          }
          
          .control-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 2px solid #2D2D2D;
            border-radius: 6px;
            background: #1A1A1A;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .control-btn:hover {
            border-color: #2D2D2D;
            transform: translateY(-1px);
          }
          
          .control-btn.active {
            background: #2D2D2D;
            color: #ffffff;
            border-color: #2D2D2D;
          }
          
          .control-btn.primary {
            background: #2D2D2D;
            color: #ffffff;
            border-color: #2D2D2D;
          }
          
          .search-box {
            position: relative;
            min-width: 250px;
          }
          
          .search-input {
            width: 100%;
            padding: 0.5rem 0.5rem 0.5rem 2.5rem;
            border: 2px solid #2D2D2D;
            border-radius: 6px;
            font-size: 0.875rem;
          }
          
          .search-input:focus {
            outline: none;
            border-color: #2D2D2D;
          }
          
          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #71717A;
          }
          
          .filter-select {
            padding: 0.5rem;
            border: 2px solid #2D2D2D;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            background: #1A1A1A;
            cursor: pointer;
          }
          
          .filter-select:focus {
            outline: none;
            border-color: #2D2D2D;
          }
          
          .todo-content {
            padding: 1.5rem;
          }
          
          .bulk-actions {
            background: rgba(245, 158, 11, 0.1);
            border: 2px solid #fb923c;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .bulk-actions-text {
            font-weight: 600;
            color: #ea580c;
          }
          
          .bulk-actions-buttons {
            display: flex;
            gap: 0.75rem;
          }
          
          .bulk-btn {
            padding: 0.375rem 0.75rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
          }
          
          .bulk-btn.complete {
            background: #10b981;
            color: #ffffff;
          }
          
          .bulk-btn.delete {
            background: #ef4444;
            color: #ffffff;
          }
          
          .bulk-btn.cancel {
            background: #2D2D2D;
            color: #A1A1AA;
          }
          
          .todo-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .todo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
          }
          
          .todo-item {
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.2s ease;
            background: #1A1A1A;
          }
          
          .todo-item:hover {
            border-color: #3D3D3D;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .todo-item.completed {
            opacity: 0.7;
            background: #141414;
          }
          
          .todo-item.overdue {
            border-color: #fecaca;
            background: #fef2f2;
          }
          
          .todo-item-header {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          
          .todo-checkbox {
            margin-top: 0.125rem;
            cursor: pointer;
          }
          
          .todo-checkbox input {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
          
          .todo-content-main {
            flex: 1;
            min-width: 0;
          }
          
          .todo-title {
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 0.25rem;
            line-height: 1.4;
          }
          
          .todo-title.completed {
            text-decoration: line-through;
            color: #71717A;
          }
          
          .todo-description {
            font-size: 0.875rem;
            color: #71717A;
            margin-bottom: 0.75rem;
            line-height: 1.4;
          }
          
          .todo-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }
          
          .todo-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          

          
          .due-date-badge {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #dbeafe;
          }
          
          .due-date-badge.overdue {
            background: #fef2f2;
            color: #dc2626;
            border-color: #fecaca;
          }
          
          .todo-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
          }
          
          .action-btn {
            padding: 0.375rem;
            border: 1px solid #2D2D2D;
            border-radius: 4px;
            background: #1A1A1A;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .action-btn:hover {
            border-color: #2D2D2D;
            transform: translateY(-1px);
          }
          
          .action-btn.edit {
            color: #71717A;
          }
          
          .action-btn.delete {
            color: #ef4444;
          }
          
          .empty-state {
            text-align: center;
            padding: 3rem;
            color: #71717A;
          }
          
          .empty-state h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 0.5rem;
          }
          
          .quick-add-form {
            background: #141414;
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .form-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
            min-width: 200px;
          }
          
          .form-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #FFFFFF;
          }
          
          .form-input, .form-textarea, .form-select {
            padding: 0.5rem;
            border: 2px solid #2D2D2D;
            border-radius: 4px;
            font-size: 0.875rem;
          }
          
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #2D2D2D;
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 60px;
            font-family: inherit;
          }
          
          .form-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
          }
          
          .form-btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border: 2px solid;
            transition: all 0.2s ease;
          }
          
          .form-btn.primary {
            background: #2D2D2D;
            color: #ffffff;
            border-color: #2D2D2D;
          }
          
          .form-btn.secondary {
            background: #1A1A1A;
            color: #A1A1AA;
            border-color: #2D2D2D;
          }
          
          .form-btn:hover {
            transform: translateY(-1px);
          }
          
          @media (max-width: 768px) {
            .todo-controls {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
            }
            
            .control-group {
              justify-content: center;
            }
            
            .search-box {
              min-width: auto;
              width: 100%;
            }
            
            .todo-grid {
              grid-template-columns: 1fr;
            }
            
            .form-row {
              flex-direction: column;
            }
            
            .form-group {
              min-width: auto;
            }
            
            .form-actions {
              flex-direction: column;
            }
          }
        `
      }} />

      <div className="todo-header">
        <div className="todo-stats">
          <div className="stat-card">
            <div className="stat-value">{todos.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          {overdueCount > 0 && (
            <div className="stat-card overdue">
              <div className="stat-value">{overdueCount}</div>
              <div className="stat-label">Overdue</div>
            </div>
          )}
        </div>

        <div className="todo-controls">
          <div className="control-group">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="control-btn primary"
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Add Todo
            </button>

            <div className="control-group">
              <button
                onClick={() => setViewMode('list')}
                className={`control-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <ListBulletIcon style={{ width: '16px', height: '16px' }} />
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`control-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <Squares2X2Icon style={{ width: '16px', height: '16px' }} />
                Grid
              </button>
            </div>
          </div>

          <div className="control-group">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Todos</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="filter-select"
            >
              <option value="created_at-desc">Latest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="due_date-asc">Due Date (Earliest)</option>
              <option value="due_date-desc">Due Date (Latest)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="todo-content">
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '2px solid #ef4444', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            color: '#dc2626',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {showQuickAdd && (
          <div className="quick-add-form">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
              {editingTodo ? 'Edit Todo' : 'Add New Todo'}
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  value={newTodo.due_date}
                  onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Additional details..."
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setEditingTodo(null);
                  setNewTodo({
                    title: '',
                    description: '',  
                    due_date: ''
                  });
                }}
                className="form-btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingTodo ? handleUpdateTodo : handleAddTodo}
                className="form-btn primary"
                disabled={!newTodo.title.trim()}
              >
                {editingTodo ? 'Update Todo' : 'Add Todo'}
              </button>
            </div>
          </div>
        )}

        {showBulkActions && (
          <div className="bulk-actions">
            <span className="bulk-actions-text">
              {selectedTodos.size} todo{selectedTodos.size !== 1 ? 's' : ''} selected
            </span>
            <div className="bulk-actions-buttons">
              <button onClick={handleBulkComplete} className="bulk-btn complete">
                Mark Complete
              </button>
              <button onClick={handleBulkDelete} className="bulk-btn delete">
                Delete
              </button>
              <button 
                onClick={() => {
                  setSelectedTodos(new Set());
                  setShowBulkActions(false);
                }}
                className="bulk-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <h3>No todos found</h3>
            <p>
              {filterBy !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first todo to get started!'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'todo-grid' : 'todo-list'}>
            {filteredTodos.map((todo) => {
              const isOverdueTodo = isOverdue(todo.due_date);
              
              return (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdueTodo ? 'overdue' : ''}`}
                >
                  <div className="todo-item-header">
                    <div className="todo-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTodos.has(todo.id)}
                        onChange={() => handleSelectTodo(todo.id)}
                      />
                    </div>
                    <div className="todo-content-main">
                      <h4 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className="todo-description">{todo.description}</p>
                      )}
                      
                      {todo.due_date && (
                        <div className="todo-meta">
                          <span className={`todo-badge due-date-badge ${isOverdueTodo ? 'overdue' : ''}`}>
                            <CalendarIcon style={{ width: '12px', height: '12px' }} />
                            {formatDate(todo.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="todo-actions">
                      <button
                        onClick={() => handleToggleComplete(todo.id)}
                        className="action-btn"
                        title={todo.completed ? 'Mark as pending' : 'Mark as complete'}
                      >
                        <CheckIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleEditTodo(todo)}
                        className="action-btn edit"
                        title="Edit todo"
                      >
                        <PencilIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="action-btn delete"
                        title="Delete todo"
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 