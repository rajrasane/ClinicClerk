'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Trash2, User, Phone, Building, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DoctorProfile {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  clinic_name: string;
  clinic_address: string;
}

export default function ProfilePage() {
  const { doctor, signOut, refreshDoctorData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [profile, setProfile] = useState<DoctorProfile>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    clinic_name: '',
    clinic_address: ''
  });

  const [originalProfile, setOriginalProfile] = useState<DoctorProfile>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    clinic_name: '',
    clinic_address: ''
  });

  useEffect(() => {
    if (doctor && !originalProfile.first_name) {
      const doctorProfile = {
        first_name: doctor.first_name || '',
        middle_name: doctor.middle_name || '',
        last_name: doctor.last_name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        clinic_name: doctor.clinic_name || '',
        clinic_address: doctor.clinic_address || ''
      };
      setProfile(doctorProfile);
      setOriginalProfile(doctorProfile);
    }
  }, [doctor, originalProfile.first_name]);

  const handleInputChange = (field: keyof DoctorProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Check if profile has changes
  const hasChanges = () => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  const handleSave = async () => {
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (profile.phone && !/^\d{10}$/.test(profile.phone)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    setLoading(true);
    try {
      // Get the session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in again');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        // Update the original profile state to reflect changes
        setOriginalProfile(profile);
        // Refresh the doctor data in AuthContext
        await refreshDoctorData();
        // Navigate back smoothly without full page reload
        router.push('/');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Get the session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in again');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        await signOut();
        router.push('/login');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="sm:text-center">
            <h1 className="text-2xl font-bold text-gray-900 ml-2 mb-[-8] sm:ml-0">My Profile</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              
              <div className="space-y-3 lg:space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={profile.middle_name}
                      onChange={(e) => handleInputChange('middle_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
              </div>
            </div>

            {/* Clinic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-3 lg:mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Clinic Information
              </h2>
              
              <div className="space-y-3 lg:space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clinic Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clinic Name
                    </label>
                    <input
                      type="text"
                      value={profile.clinic_name}
                      onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter clinic name"
                    />
                  </div>

                  {/* Clinic Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Clinic Address
                    </label>
                    <textarea
                      value={profile.clinic_address}
                      onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter complete clinic address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button - Mobile centered, above Actions */}
          <div className="md:hidden">
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges()}
                className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            {/* Gray divider for small screens only */}
            <div className="sm:hidden border-t border-gray-200 mt-6"></div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 lg:mb-3">Actions</h3>

              {/* Delete Account Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1 lg:mb-2">Danger Zone</h4>
                <p className="text-xs text-gray-600 mb-2 lg:mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-50 text-red-700 py-2 lg:py-2.5 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center border border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-800 bg-red-50 p-2 rounded border border-red-200">
                      Are you sure? This will permanently delete your account and all patient data.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button - Directly below Actions on lg screens */}
            <div className="hidden lg:block mt-4">
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges()}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button - Medium screens only, centered below Actions */}
        <div className="hidden md:block lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges()}
              className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
