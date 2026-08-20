import React, { useState, useEffect } from 'react';
import { updateProfile, getProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Save, Loader2, Briefcase, Code, DollarSign, Globe, FileText, CheckCircle, Mic, Target } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const ProfileSetup = () => {
  const { updateUser } = useAuth();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    experience: '',
    skills: '',
    hourlyRate: '',
    portfolio: '',
    bio: '',
    role: '',
    preferredTone: 'Professional',
    platformFocus: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setFormData(res.data);
    } catch (err) {
      console.error('Error loading profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      const res = await updateProfile(formData);
      updateUser(res.data);
      setSuccess(t('dashboard.profile.success'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platformFocus: prev.platformFocus.includes(platform)
        ? prev.platformFocus.filter(p => p !== platform)
        : [...prev.platformFocus, platform]
    }));
  };

  const cardClasses = `rounded-xl p-5 border-2 transition-all duration-200 shadow-sm 
    ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}
    hover:border-indigo-300`;
  const inputClasses = `w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 border-2
    ${darkMode ? 'bg-slate-800 border-slate-700 placeholder-slate-400 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500'}`;
  const labelClasses = `flex items-center gap-2 text-sm font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const infoBoxClasses = `mt-8 p-5 rounded-xl border-2 transition-all duration-200 
    ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'}`;
  const successClasses = `mb-6 p-4 rounded-xl flex items-center gap-3 transition-all duration-500 border-2
    ${darkMode ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800'}`;

  return (
    <div className="max-w-4xl mx-auto transition-colors duration-500">
      <div className={darkMode ? 'transition-colors duration-500' : ''}>
        
        {/* Card */}
        {/* <div className={darkMode ? 'bg-slate-900/95 border-slate-700 rounded-2xl shadow-xl p-8 transition-colors duration-500' 
                               : 'bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-xl p-8 border-2 border-indigo-100'}> */}
          
          {/* Header */}
          <div className={`flex items-center gap-3 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('dashboard.profile.title')}
              </h2>
              <p className={darkMode ? 'text-slate-400 text-sm mt-1 font-medium' : 'text-slate-500 text-sm mt-1 font-medium'}>
                {t('dashboard.profile.subtitle')}
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className={successClasses}>
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">{success}</p>
                <p className="text-sm">{t('dashboard.profile.successSub')}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Professional Role */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <Briefcase className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                {t('dashboard.profile.role')}
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder={t('dashboard.profile.rolePlaceholder')}
                className={inputClasses}
              />
              <p className={darkMode ? 'text-xs text-slate-400 mt-2 ml-1' : 'text-xs text-slate-500 mt-2 ml-1'}>
                {t('dashboard.profile.roleHint')}
              </p>
            </div>

            {/* Experience */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <Briefcase className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                {t('dashboard.profile.experience')}
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder={t('dashboard.profile.experiencePlaceholder')}
                rows={4}
                className={`${inputClasses} resize-none`}
              />
            </div>

            {/* Skills */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <Code className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                {t('dashboard.profile.skills')}
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder={t('dashboard.profile.skillsPlaceholder')}
                className={inputClasses}
              />
              <p className={darkMode ? 'text-xs text-slate-400 mt-2 ml-1' : 'text-xs text-slate-500 mt-2 ml-1'}>
                {t('dashboard.profile.skillsHint')}
              </p>
            </div>

            {/* Hourly Rate & Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cardClasses}>
                <label className={labelClasses}>
                  <DollarSign className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  {t('dashboard.profile.hourlyRate')}
                </label>
                <input
                  type="text"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder={t('dashboard.profile.ratePlaceholder')}
                  className={`${inputClasses} font-bold text-lg`}
                />
              </div>

              <div className={cardClasses}>
                <label className={labelClasses}>
                  <Globe className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  {t('dashboard.profile.portfolio')}
                </label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Professional Bio */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                {t('dashboard.profile.bio')}
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('dashboard.profile.bioPlaceholder')}
                rows={5}
                className={`${inputClasses} resize-none`}
              />
              <p className={darkMode ? 'text-xs text-slate-400 mt-2 ml-1' : 'text-xs text-slate-500 mt-2 ml-1'}>
                {t('dashboard.profile.bioHint')}
              </p>
            </div>

            {/* Preferred Tone */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <Mic className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                {t('dashboard.profile.tone')}
              </label>
              <select
                value={formData.preferredTone}
                onChange={(e) => setFormData({ ...formData, preferredTone: e.target.value })}
                className={inputClasses}
              >
                <option value="Professional">{t('dashboard.profile.toneProfessional')}</option>
                <option value="Friendly">{t('dashboard.profile.toneFriendly')}</option>
                <option value="Persuasive">{t('dashboard.profile.tonePersuasive')}</option>
              </select>
              <p className={darkMode ? 'text-xs text-slate-400 mt-2 ml-1' : 'text-xs text-slate-500 mt-2 ml-1'}>
                {t('dashboard.profile.toneHint')}
              </p>
            </div>

            {/* Platform Focus */}
            <div className={cardClasses}>
              <label className={labelClasses}>
                <Target className={`w-5 h-5 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                {t('dashboard.profile.platformFocus')}
              </label>
              <div className="space-y-3">
                {['Upwork', 'Fiverr', 'Freelancer'].map((platform) => (
                  <label key={platform} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.platformFocus.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                      className={`w-5 h-5 rounded-lg cursor-pointer transition-all
                        ${formData.platformFocus.includes(platform)
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-500'
                          : darkMode 
                            ? 'bg-slate-700 border-slate-600' 
                            : 'bg-slate-100 border-slate-300'
                        } border-2`}
                    />
                    <span className={`font-medium group-hover:translate-x-1 transition-transform ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {platform}
                    </span>
                  </label>
                ))}
              </div>
              <p className={darkMode ? 'text-xs text-slate-400 mt-3 ml-1' : 'text-xs text-slate-500 mt-3 ml-1'}>
                {t('dashboard.profile.platformHint')}
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>{t('dashboard.profile.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span>{t('dashboard.profile.save')}</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className={infoBoxClasses}>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('dashboard.profile.whyTitle')}
            </h3>
            <ul className="text-sm space-y-1 ml-7">
              {t('dashboard.profile.whyList').map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

        {/* </div> */}
      </div>
    </div>
  );
};

export default ProfileSetup;