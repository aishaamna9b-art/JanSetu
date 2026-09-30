import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { User, MapPin, Phone, Settings as SettingsIcon, Shield, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchWithAuth('/users/me'),
  });

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => fetchWithAuth('/users/me/stats'),
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => fetchWithAuth('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['my-profile'], updatedProfile);
      alert('Profile updated successfully');
    },
    onError: (err: any) => {
      alert(`Error updating profile: ${err.message}`);
    }
  });

  const [editData, setEditData] = useState<any>({});
  
  const handleEditModeToggle = () => {
    if (!isEditing) {
      setEditData(JSON.parse(JSON.stringify(profile || {}))); // deep copy
    }
    setIsEditing(!isEditing);
  };
  
  const handleChange = (section: string, field: string, val: any) => {
    setEditData({
      ...editData,
      [section]: { ...editData[section], [field]: val }
    });
  };
  
  const handleSave = () => {
    updateProfile.mutate(editData);
    setIsEditing(false);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">{t('my_profile')}</h1>
        <div className="flex gap-2">
          {isEditing && (
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={isEditing ? handleSave : handleEditModeToggle}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${
              isEditing ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {isEditing ? t('save_changes') : t('edit_profile')}
          </button>
        </div>
      </div>
      
      {profile?.registration_id && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Shield size={100} />
          </div>
          <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">{t('citizen_reg_id')}</p>
          <p className="font-mono text-3xl font-bold mb-4">{profile.registration_id}</p>
          <div className="flex space-x-6">
            <div>
              <p className="text-blue-200 text-xs">{t('name')}</p>
              <p className="font-medium">{profile?.personal?.full_name}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">{t('district')}</p>
              <p className="font-medium">{profile?.address?.district}</p>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
          <div className="bg-white p-2 md:p-4 rounded-xl border border-gray-200 shadow-sm text-center flex flex-col justify-center h-full">
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wide md:tracking-wider break-words mt-1 leading-tight">{t('total_requests')}</p>
          </div>
          <div className="bg-white p-2 md:p-4 rounded-xl border border-gray-200 shadow-sm text-center flex flex-col justify-center h-full">
            <p className="text-xl md:text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wide md:tracking-wider break-words mt-1 leading-tight">{t('resolved')}</p>
          </div>
          <div className="bg-white p-2 md:p-4 rounded-xl border border-gray-200 shadow-sm text-center flex flex-col justify-center h-full">
            <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wide md:tracking-wider break-words mt-1 leading-tight">{t('pending')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <button onClick={() => setActiveTab('personal')} className={`flex items-center space-x-3 p-4 text-left transition-colors ${activeTab === 'personal' ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}>
            <User size={20} /><span>{t('personal_details')}</span>
          </button>
          <button onClick={() => setActiveTab('contact')} className={`flex items-center space-x-3 p-4 text-left transition-colors ${activeTab === 'contact' ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}>
            <Phone size={20} /><span>{t('contact_details')}</span>
          </button>
          <button onClick={() => setActiveTab('address')} className={`flex items-center space-x-3 p-4 text-left transition-colors ${activeTab === 'address' ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}>
            <MapPin size={20} /><span>{t('address')}</span>
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`flex items-center space-x-3 p-4 text-left transition-colors ${activeTab === 'preferences' ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}>
            <SettingsIcon size={20} /><span>{t('preferences')}</span>
          </button>
          <button onClick={() => setActiveTab('privacy')} className={`flex items-center space-x-3 p-4 text-left transition-colors ${activeTab === 'privacy' ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}>
            <Shield size={20} /><span>{t('privacy_consent')}</span>
          </button>
        </div>
        
        <div className="flex-1 p-6">
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('personal_details')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">{t('full_name')}</label>
                  {isEditing ? (
                    <input type="text" value={editData?.personal?.full_name || ''} onChange={(e) => handleChange('personal', 'full_name', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.personal?.full_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input type="date" value={editData?.personal?.dob || ''} onChange={(e) => handleChange('personal', 'dob', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.personal?.dob}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Gender</label>
                  {isEditing ? (
                    <select value={editData?.personal?.gender || ''} onChange={(e) => handleChange('personal', 'gender', e.target.value)} className="w-full px-3 py-2 border rounded-md">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{profile?.personal?.gender}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Occupation</label>
                  {isEditing ? (
                    <input type="text" value={editData?.occupation || ''} onChange={(e) => setEditData({...editData, occupation: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium capitalize">{profile?.occupation || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Mobile Number</label>
                  {isEditing ? (
                    <input type="text" value={editData?.contact?.mobile || ''} onChange={(e) => handleChange('contact', 'mobile', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.contact?.mobile} <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Verified</span></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Alternate Mobile</label>
                  {isEditing ? (
                    <input type="text" value={editData?.contact?.alt_mobile || ''} onChange={(e) => handleChange('contact', 'alt_mobile', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.contact?.alt_mobile || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Email</label>
                  {isEditing ? (
                    <input type="email" value={editData?.contact?.email || ''} onChange={(e) => handleChange('contact', 'email', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.contact?.email || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Address Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">House/Door No.</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.house_no || ''} onChange={(e) => handleChange('address', 'house_no', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.house_no}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Street</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.street || ''} onChange={(e) => handleChange('address', 'street', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.street || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Village / Ward</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.village_or_ward || ''} onChange={(e) => handleChange('address', 'village_or_ward', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.village_or_ward}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Block</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.block || ''} onChange={(e) => handleChange('address', 'block', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.block}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">District</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.district || ''} onChange={(e) => handleChange('address', 'district', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.district}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">State</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.state || ''} onChange={(e) => handleChange('address', 'state', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold uppercase mb-1">PIN Code</label>
                  {isEditing ? (
                    <input type="text" value={editData?.address?.pincode || ''} onChange={(e) => handleChange('address', 'pincode', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  ) : (
                    <p className="font-medium">{profile?.address?.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Preferences</h2>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Language</label>
                {isEditing ? (
                  <select value={editData?.preferences?.language || 'en'} onChange={(e) => handleChange('preferences', 'language', e.target.value)} className="w-full max-w-xs px-3 py-2 border rounded-md">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                  </select>
                ) : (
                  <p className="font-medium uppercase">{profile?.preferences?.language}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Notifications</label>
                <div className="flex space-x-4 mt-2">
                  {isEditing ? (
                    <>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={editData?.preferences?.notify_sms || false} onChange={(e) => handleChange('preferences', 'notify_sms', e.target.checked)} className="rounded" />
                        <span className="text-sm">SMS</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={editData?.preferences?.notify_whatsapp || false} onChange={(e) => handleChange('preferences', 'notify_whatsapp', e.target.checked)} className="rounded" />
                        <span className="text-sm">WhatsApp</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <span className={`px-3 py-1 rounded text-sm ${profile?.preferences?.notify_sms ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>SMS</span>
                      <span className={`px-3 py-1 rounded text-sm ${profile?.preferences?.notify_whatsapp ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>WhatsApp</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy & Consent</h2>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 mb-4">You have provided consent for JanSetu to use your voice, location, and photos strictly for processing your requests.</p>
                <button className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-bold rounded shadow-sm hover:bg-red-50 transition-colors">Withdraw Consent</button>
                <p className="text-xs text-gray-500 mt-2">Note: Withdrawing consent will disable your ability to submit new requests.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
