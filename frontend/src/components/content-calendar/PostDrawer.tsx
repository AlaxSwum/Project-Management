'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { 
  ContentPost, 
  Platform, 
  PostStatus,
  ContentType,
  STATUS_CONFIG, 
  PLATFORM_CONFIG,
  CONTENT_TYPE_CONFIG,
  Campaign,
  User
} from '@/types/content-calendar';
import { StatusBadge, PlatformBadge } from './Calendar';

interface PostDrawerProps {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create';
  post: ContentPost | null;
  campaigns: Campaign[];
  members: { user: User }[];
  isLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (data: any) => void;
  onDelete: (postId: number) => void;
  onStatusChange: (postId: number, status: PostStatus) => void;
}

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
const CONTENT_TYPES: ContentType[] = ['image', 'video', 'carousel', 'story', 'reel', 'article', 'poll'];
const STATUSES: PostStatus[] = ['idea', 'draft', 'design', 'review', 'approved', 'scheduled', 'published', 'reported'];

export default function PostDrawer({
  isOpen,
  mode,
  post,
  campaigns,
  members,
  isLoading,
  isSubmitting,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onStatusChange
}: PostDrawerProps) {
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    content_type: 'image' as ContentType,
    visual_concept: '',
    key_points: [] as string[],
    hashtags: [] as string[],
    planned_publish_at: '',
    campaign_id: null as number | null,
    owner_id: null as number | null,
    designer_id: null as number | null,
    editor_id: null as number | null,
    content_deadline: '',
    design_deadline: '',
    review_deadline: '',
    is_boosted: false,
    boost_budget: 0,
    boost_notes: '',
    notes: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    platforms: [] as Platform[],
    checklist_items: [] as string[]
  });

  const [newKeyPoint, setNewKeyPoint] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Reset form when post changes
  useEffect(() => {
    if (post && mode !== 'create') {
      setFormData({
        title: post.title || '',
        caption: post.caption || '',
        content_type: post.content_type || 'image',
        visual_concept: post.visual_concept || '',
        key_points: post.key_points || [],
        hashtags: post.hashtags || [],
        planned_publish_at: post.planned_publish_at ? new Date(post.planned_publish_at).toISOString().slice(0, 16) : '',
        campaign_id: post.campaign_id || null,
        owner_id: post.owner_id || null,
        designer_id: post.designer_id || null,
        editor_id: post.editor_id || null,
        content_deadline: post.content_deadline ? new Date(post.content_deadline).toISOString().slice(0, 16) : '',
        design_deadline: post.design_deadline ? new Date(post.design_deadline).toISOString().slice(0, 16) : '',
        review_deadline: post.review_deadline ? new Date(post.review_deadline).toISOString().slice(0, 16) : '',
        is_boosted: post.is_boosted || false,
        boost_budget: post.boost_budget || 0,
        boost_notes: post.boost_notes || '',
        notes: post.notes || '',
        priority: post.priority || 'normal',
        platforms: post.platforms || [],
        checklist_items: post.checklist?.map(c => c.item_text) || []
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        caption: '',
        content_type: 'image',
        visual_concept: '',
        key_points: [],
        hashtags: [],
        planned_publish_at: '',
        campaign_id: null,
        owner_id: null,
        designer_id: null,
        editor_id: null,
        content_deadline: '',
        design_deadline: '',
        review_deadline: '',
        is_boosted: false,
        boost_budget: 0,
        boost_notes: '',
        notes: '',
        priority: 'normal',
        platforms: [],
        checklist_items: []
      });
    }
  }, [post, mode]);

  const handleSubmit = () => {
    onSave(formData);
  };

  const togglePlatform = (platform: Platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        key_points: [...prev.key_points, newKeyPoint.trim()]
      }));
      setNewKeyPoint('');
    }
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag.trim()]
      }));
      setNewHashtag('');
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist_items: [...prev.checklist_items, newChecklistItem.trim()]
      }));
      setNewChecklistItem('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`
        fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200
        transition-transform duration-300 ease-in-out z-50
        w-full md:w-[500px] lg:w-[600px]
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'New Post' : mode === 'edit' ? 'Edit Post' : 'Post Details'}
          </h2>
          {post && mode === 'view' && <StatusBadge status={post.status} />}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'view' && post && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100% - 140px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : mode === 'view' && post ? (
          // View Mode
          <div className="space-y-6">
            {/* Title & Type */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  {CONTENT_TYPE_CONFIG[post.content_type]?.label || post.content_type}
                </span>
                {post.campaign && (
                  <span 
                    className="px-2 py-1 text-sm rounded"
                    style={{ backgroundColor: post.campaign.color + '20', color: post.campaign.color }}
                  >
                    {post.campaign.name}
                  </span>
                )}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {post.platforms?.map(platform => (
                  <PlatformBadge key={platform} platform={platform} />
                ))}
              </div>
            </div>

            {/* Caption */}
            {post.caption && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {post.caption}
                </p>
              </div>
            )}

            {/* Schedule */}
            {post.planned_publish_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
                <div className="flex items-center gap-2 text-gray-600">
                  <ClockIcon className="w-5 h-5" />
                  {new Date(post.planned_publish_at).toLocaleString()}
                </div>
              </div>
            )}

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
              <div className="space-y-2">
                {post.owner && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-20">Owner:</span>
                    <span className="text-sm font-medium">{post.owner.name}</span>
                  </div>
                )}
                {post.designer && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-20">Designer:</span>
                    <span className="text-sm font-medium">{post.designer.name}</span>
                  </div>
                )}
                {post.editor && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-20">Editor:</span>
                    <span className="text-sm font-medium">{post.editor.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            {post.checklist && post.checklist.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checklist ({post.checklist.filter(c => c.is_completed).length}/{post.checklist.length})
                </label>
                <div className="space-y-2">
                  {post.checklist.map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded ${item.is_completed ? 'bg-green-50' : 'bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded border ${item.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {item.is_completed && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                      <span className={item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                        {item.item_text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Workflow */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(post.id, status)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      post.status === status
                        ? 'ring-2 ring-offset-1'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: STATUS_CONFIG[status].bgColor,
                      color: STATUS_CONFIG[status].color,
                      ...(post.status === status ? { ringColor: STATUS_CONFIG[status].color } : {})
                    }}
                  >
                    {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Edit/Create Mode
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter post title"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value as ContentType })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{CONTENT_TYPE_CONFIG[type].label}</option>
                ))}
              </select>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platforms <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      formData.platforms.includes(platform)
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: formData.platforms.includes(platform) 
                        ? PLATFORM_CONFIG[platform].color 
                        : undefined
                    }}
                  >
                    {PLATFORM_CONFIG[platform].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Write your caption..."
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
              <input
                type="datetime-local"
                value={formData.planned_publish_at}
                onChange={(e) => setFormData({ ...formData, planned_publish_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Campaign */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
              <select
                value={formData.campaign_id || ''}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </select>
            </div>

            {/* Team Assignment */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                <select
                  value={formData.owner_id || ''}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designer</label>
                <select
                  value={formData.designer_id || ''}
                  onChange={(e) => setFormData({ ...formData, designer_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Editor</label>
                <select
                  value={formData.editor_id || ''}
                  onChange={(e) => setFormData({ ...formData, editor_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
              <div className="space-y-2 mb-2">
                {formData.checklist_items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{item}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        checklist_items: prev.checklist_items.filter((_, i) => i !== index)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Add checklist item"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {(mode === 'edit' || mode === 'create') && (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || formData.platforms.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Post' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
