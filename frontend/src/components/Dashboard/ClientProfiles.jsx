import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Star, StarOff, Loader2, CheckCircle, X, Building, Mail, Phone, Tag, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const ClientProfiles = () => {
  const { darkMode } = useTheme();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    profileName: '',
    companyName: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    preferredTone: 'friendly',
    preferredStyle: 'medium',
    notes: '',
    tags: [],
    isFavorite: false
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/client-profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        // Feature not available
        alert('Client Profiles are available in Starter plan and above. Please upgrade!');
      }
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingProfile) {
        // Update existing profile
        await axios.put(`/api/client-profiles/${editingProfile._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Profile updated successfully!');
      } else {
        // Create new profile
        await axios.post('/api/client-profiles', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Profile created successfully!');
      }
      
      await loadProfiles();
      setShowModal(false);
      resetForm();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      if (error.response?.status === 403) {
        alert(error.response.data.message || 'You have reached your profile limit. Please upgrade!');
      } else {
        alert('Error saving profile. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/client-profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadProfiles();
      setSuccessMessage('Profile deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Error deleting profile');
    }
  };

  const toggleFavorite = async (profile) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/client-profiles/${profile._id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadProfiles();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const openEditModal = (profile) => {
    setEditingProfile(profile);
    setFormData({
      profileName: profile.profileName,
      companyName: profile.companyName || '',
      industry: profile.industry || '',
      contactPerson: profile.contactPerson || '',
      email: profile.email || '',
      phone: profile.phone || '',
      preferredTone: profile.preferredTone,
      preferredStyle: profile.preferredStyle,
      notes: profile.notes || '',
      tags: profile.tags || [],
      isFavorite: profile.isFavorite
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProfile(null);
    setFormData({
      profileName: '',
      companyName: '',
      industry: '',
      contactPerson: '',
      email: '',
      phone: '',
      preferredTone: 'friendly',
      preferredStyle: 'medium',
      notes: '',
      tags: [],
      isFavorite: false
    });
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.profileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardClasses = `rounded-xl p-5 border-2 transition-all duration-200 shadow-sm 
    ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
    hover:shadow-lg hover:border-indigo-300`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Client Profiles
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Save client information for faster proposals
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Add Profile
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-green-900/40 border-2 border-green-700 text-green-300' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800'}`}>
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl font-medium border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
        </div>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className={`text-center py-16 ${cardClasses}`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {searchTerm ? 'No profiles found' : 'No client profiles yet'}
          </h3>
          <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
            {searchTerm ? 'Try a different search term' : 'Add your first client profile to get started'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div key={profile._id} className={cardClasses}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {profile.profileName}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(profile)}
                      className="transition-transform hover:scale-110"
                    >
                      {profile.isFavorite ? (
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className={`w-5 h-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      )}
                    </button>
                  </div>
                  {profile.companyName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                        {profile.companyName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {profile.industry && (
                  <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="font-semibold">Industry:</span> {profile.industry}
                  </div>
                )}
                {profile.contactPerson && (
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Users className="w-4 h-4" />
                    {profile.contactPerson}
                  </div>
                )}
                {profile.email && (
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className={`flex items-center gap-4 mb-4 pb-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {profile.totalProposalsSent}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sent</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {profile.totalProposalsWon}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Won</div>
                </div>
                {profile.totalProposalsSent > 0 && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {profile.winRate}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Win Rate</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(profile)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(profile._id)}
                  className="px-4 py-2 rounded-lg font-semibold transition-all text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingProfile ? 'Edit Profile' : 'New Client Profile'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Name */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Profile Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.profileName}
                  onChange={(e) => setFormData({...formData, profileName: e.target.value})}
                  placeholder="e.g., Tech Startup Client"
                  className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              {/* Company & Industry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Preferred Tone
                  </label>
                  <select
                    value={formData.preferredTone}
                    onChange={(e) => setFormData({...formData, preferredTone: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="formal">Formal</option>
                    <option value="friendly">Friendly</option>
                    <option value="persuasive">Persuasive</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Preferred Style
                  </label>
                  <select
                    value={formData.preferredStyle}
                    onChange={(e) => setFormData({...formData, preferredStyle: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border-2 resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  placeholder="Any additional notes about this client..."
                />
              </div>

              {/* Favorite */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({...formData, isFavorite: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="favorite" className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Mark as favorite
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  {editingProfile ? 'Update Profile' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfiles;