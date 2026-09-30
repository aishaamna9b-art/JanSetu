import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    personal: {}, contact: {}, address: {}, preferences: {}, id_proof: {}
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchWithAuth('/users/me'),
  });

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchWithAuth('/regions'),
  });

  useEffect(() => {
    if (profile) {
      if (profile.profile_complete) {
        navigate('/citizen');
      } else {
        setFormData({
          personal: profile.personal || {},
          contact: profile.contact || {},
          address: profile.address || {},
          preferences: profile.preferences || {},
          id_proof: profile.id_proof || {},
          occupation: profile.occupation || '',
          is_differently_abled: profile.is_differently_abled || false,
          consent_given: profile.consent_given || false,
          declaration_accepted: profile.declaration_accepted || false
        });
      }
    }
  }, [profile, navigate]);

  const updateProfile = useMutation({
    mutationFn: (data: any) => fetchWithAuth('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['my-profile'], updatedProfile);
      if (updatedProfile.profile_complete) {
        navigate('/citizen/success', { state: { data: updatedProfile } });
      }
    }
  });

  const handleNext = () => {
    updateProfile.mutate(formData);
    setStep(s => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));
  
  const handlePincodeChange = async (val: string) => {
    updateField('address', 'pincode', val);
    if (val.length === 6) {
      try {
        const res = await fetchWithAuth(`/pincode/${val}`);
        setFormData((prev: any) => ({
          ...prev,
          address: {
            ...prev.address,
            state: res.state,
            district: res.district,
            block: res.block
          }
        }));
      } catch(e) {
        console.error(e);
      }
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    if (section === 'root') {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white to-green-500" />
      <header className="bg-white px-4 py-4 shadow-sm flex items-center justify-between border-b border-gray-200 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">LOGO</div>
          <h1 className="font-serif font-bold text-xl text-gray-900">JanSetu Registration</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Step {step} of 5</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>

        <p className="text-sm text-red-600 font-medium mb-6">Fields marked * are mandatory</p>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Details</h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={formData.personal.full_name || ''} onChange={e => updateField('personal', 'full_name', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Relation Type *</label>
                  <select value={formData.personal.relation_type || ''} onChange={e => updateField('personal', 'relation_type', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select...</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="spouse">Spouse</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Relation Name *</label>
                  <input type="text" value={formData.personal.relation_name || ''} onChange={e => updateField('personal', 'relation_name', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" value={formData.personal.dob || ''} onChange={e => updateField('personal', 'dob', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Gender *</label>
                  <select value={formData.personal.gender || ''} onChange={e => updateField('personal', 'gender', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Details</h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label>
                <input type="text" disabled value={formData.contact.mobile || ''} className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-600 outline-none cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">Verified via login</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Alternate Mobile Number</label>
                <input type="text" value={formData.contact.alt_mobile || ''} onChange={e => updateField('contact', 'alt_mobile', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={formData.contact.email || ''} onChange={e => updateField('contact', 'email', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-bold text-gray-700 mb-2">Notification Preferences</p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="checkbox" checked={formData.preferences.notify_sms || false} onChange={e => updateField('preferences', 'notify_sms', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="checkbox" checked={formData.preferences.notify_whatsapp || false} onChange={e => updateField('preferences', 'notify_whatsapp', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Address Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">House/Door No. *</label>
                  <input type="text" value={formData.address.house_no || ''} onChange={e => updateField('address', 'house_no', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">PIN Code *</label>
                  <input type="text" maxLength={6} value={formData.address.pincode || ''} onChange={e => handlePincodeChange(e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Street / Locality</label>
                <input type="text" value={formData.address.street || ''} onChange={e => updateField('address', 'street', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Village or Ward *</label>
                <input type="text" value={formData.address.village_or_ward || ''} onChange={e => updateField('address', 'village_or_ward', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">State *</label>
                  <select value={formData.address.state || ''} onChange={e => updateField('address', 'state', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select...</option>
                    {regions?.states?.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">District *</label>
                  <select value={formData.address.district || ''} onChange={e => updateField('address', 'district', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select...</option>
                    {formData.address.state && regions?.states?.find((s:any) => s.name === formData.address.state)?.districts?.map((d: any) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Block *</label>
                  <select value={formData.address.block || ''} onChange={e => updateField('address', 'block', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select...</option>
                    {formData.address.district && regions?.states?.find((s:any) => s.name === formData.address.state)?.districts?.find((d:any) => d.name === formData.address.district)?.blocks?.map((b: any) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Occupation</label>
                <select value={formData.occupation || ''} onChange={e => updateField('root', 'occupation', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                  <option value="">Select...</option>
                  <option value="farmer">Farmer</option>
                  <option value="student">Student</option>
                  <option value="homemaker">Homemaker</option>
                  <option value="daily_wage">Daily wage worker</option>
                  <option value="self_employed">Self-employed</option>
                  <option value="salaried">Salaried</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <label className="flex items-center space-x-2 mt-4 text-sm text-gray-700 p-4 border border-gray-200 rounded">
                <input type="checkbox" checked={formData.is_differently_abled || false} onChange={e => updateField('root', 'is_differently_abled', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div>
                  <p className="font-bold">I am differently-abled</p>
                  <p className="text-xs text-gray-500">This helps us prioritise accessibility needs in your requests.</p>
                </div>
              </label>
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="block text-sm font-bold text-gray-700 mb-1">Optional ID Proof</p>
                <p className="text-xs text-gray-500 mb-2">We never store your full ID number.</p>
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.id_proof?.type || ''} onChange={e => updateField('id_proof', 'type', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                    <option value="">Select ID type...</option>
                    <option value="aadhaar">Aadhaar (Last 4 only)</option>
                    <option value="voter">Voter ID</option>
                    <option value="pan">PAN</option>
                  </select>
                  <input type="text" maxLength={4} placeholder="Last 4 characters" value={formData.id_proof?.last4 || ''} onChange={e => updateField('id_proof', 'last4', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 mt-4">Preferred Language *</label>
                <select value={formData.preferences.language || ''} onChange={e => updateField('preferences', 'language', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 outline-none">
                  <option value="">Select...</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Declaration</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-700">Personal Details</h3>
                    <button onClick={() => setStep(1)} className="text-blue-600 text-sm font-bold hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-gray-600">{formData.personal.full_name}, {formData.personal.gender}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <label className="flex items-start space-x-3 text-sm text-gray-700 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <input type="checkbox" checked={formData.consent_given || false} onChange={e => updateField('root', 'consent_given', e.target.checked)} className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span><strong>Consent *</strong>: I consent to the platform using my submitted voice recordings, photos, and location data solely for the purpose of analyzing and routing my requests to the appropriate authorities.</span>
                </label>
                <label className="flex items-start space-x-3 text-sm text-gray-700 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <input type="checkbox" checked={formData.declaration_accepted || false} onChange={e => updateField('root', 'declaration_accepted', e.target.checked)} className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span><strong>Declaration *</strong>: I declare that the information given is true and correct to the best of my knowledge.</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className="px-6 py-3 font-bold text-gray-600 disabled:opacity-50"
          >
            Back
          </button>
          
          <button 
            onClick={handleNext}
            disabled={updateProfile.isPending}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow disabled:opacity-70 flex items-center"
          >
            {updateProfile.isPending ? 'Saving...' : step === 5 ? 'Submit' : 'Save & Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
