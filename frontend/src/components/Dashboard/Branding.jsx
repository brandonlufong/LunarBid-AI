import React, { useState, useEffect } from 'react';
import { Palette, Upload, Save, RotateCcw, Eye, Loader2, CheckCircle, Image as ImageIcon, Globe, Briefcase } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import axios from 'axios';

const Branding = () => {
  const { darkMode } = useTheme();
  const toast = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [formData, setFormData] = useState({
    logoUrl: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    companyName: '',
    tagline: '',
    website: ''
  });

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/branding', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(response.data.branding);
      if (response.data.branding.logoUrl) {
        setLogoPreview(response.data.branding.logoUrl);
      }
      setHasAccess(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      }
      console.error('Error loading branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('dashboard.branding.fileTooLarge'));
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    const formDataUpload = new FormData();
    formDataUpload.append('logo', logoFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/branding/logo', formDataUpload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({ ...prev, logoUrl: response.data.logoUrl }));
      setLogoFile(null);
      setSuccessMessage(t('dashboard.branding.logoUploaded'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      toast.error(t('dashboard.branding.logoUploadError'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload logo first if there's a new one
      if (logoFile) {
        await uploadLogo();
      }

      // Update branding settings
      const token = localStorage.getItem('token');
      await axios.put('/api/branding', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage(t('dashboard.branding.saved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      toast.error(t('dashboard.branding.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset branding to defaults?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/branding/reset', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadBranding();
      setLogoPreview('');
      setLogoFile(null);
      setSuccessMessage(t('dashboard.branding.resetDone'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      toast.error(t('dashboard.branding.resetError'));
    }
  };

  const removeLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/branding/logo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      setLogoPreview('');
      setLogoFile(null);
      setSuccessMessage(t('dashboard.branding.logoRemoved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      toast.error(t('dashboard.branding.logoRemoveError'));
    }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className={`p-12 rounded-2xl ${darkMode ? 'bg-slate-800 border-2 border-slate-700' : 'bg-white border-2 border-indigo-100'}`}>
          <Palette className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('dashboard.branding.lockedTitle')}
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.branding.lockedDesc')}
          </p>
          <div className={`inline-block px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            {t('dashboard.branding.lockedCta')}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('dashboard.branding.title')}
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.branding.subtitle')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleReset}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
        >
          <RotateCcw className="w-4 h-4" />
          {t('dashboard.branding.reset')}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-green-900/40 border-2 border-green-700 text-green-300' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800'}`}>
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.branding.companyLogo')}
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo Preview */}
            <div className={`w-48 h-48 rounded-xl border-2 border-dashed flex items-center justify-center ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-slate-50'}`}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain p-4" />
              ) : (
                <ImageIcon className={`w-12 h-12 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all ${darkMode ? 'bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
              >
                <Upload className="w-4 h-4" />
                {t('dashboard.branding.chooseFile')}
              </label>
              
              {logoPreview && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="block px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-semibold transition-all"
                >
                  {t('dashboard.branding.removeLogo')}
                </button>
              )}

              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('dashboard.branding.logoSupport')}
              </p>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.branding.brandColors')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {t('dashboard.branding.primaryColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  className="w-16 h-16 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  placeholder="#6366f1"
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-mono ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {t('dashboard.branding.secondaryColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                  className="w-16 h-16 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                  placeholder="#8b5cf6"
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-mono ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.branding.companyInfo')}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {t('dashboard.branding.companyName')}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder={t('dashboard.branding.companyNamePlaceholder')}
                className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
            </div>

            {/* Tagline */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {t('dashboard.branding.tagline')}
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                placeholder={t('dashboard.branding.taglinePlaceholder')}
                className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
            </div>

            {/* Website */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {t('dashboard.branding.website')}
              </label>
              <div className="flex items-center gap-2">
                <Globe className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://yourwebsite.com"
                  className={`flex-1 px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center gap-2 mb-4">
            <Eye className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.branding.previewTitle')}
            </h3>
          </div>

          <div className={`p-8 rounded-lg border-2 border-dashed ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'}`}>
            <div className="border-b-3 pb-4 mb-4" style={{ borderBottomColor: formData.primaryColor }}>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="max-w-[200px] h-auto mb-4" />
              )}
              {formData.companyName && (
                <div className="text-2xl font-bold mb-2" style={{ color: formData.primaryColor }}>
                  {formData.companyName}
                </div>
              )}
              {formData.tagline && (
                <div className="text-sm italic" style={{ color: formData.secondaryColor }}>
                  {formData.tagline}
                </div>
              )}
            </div>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
              {t('dashboard.branding.previewNote')}
            </p>
            <button
              type="button"
              className="mt-4 px-6 py-3 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: formData.primaryColor }}
            >
              {t('dashboard.branding.sampleCta')}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('dashboard.branding.saving')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('dashboard.branding.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Branding;