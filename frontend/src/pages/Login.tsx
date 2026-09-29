import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleCitizenLogin = () => {
    // Mock login
    if (!otpSent) {
      setOtpSent(true);
    } else {
      localStorage.setItem('mock_role', 'citizen');
      // In real app, verify OTP via Firebase and then reload or wait for onAuthStateChanged
      // Since we are mocking and AuthProvider does check import.meta.env.VITE_USE_MOCKS
      // we can just force a window reload to trigger the auth flow again, or we can just navigate.
      // But AuthProvider only triggers onAuthStateChanged which doesn't fire if we don't actually sign in.
      // Let's just navigate to /citizen and let ProtectedRoute fetch the mock session.
      navigate('/citizen');
      // For immediate effect in AuthProvider mock:
      window.location.href = '/citizen';
    }
  };

  const handleOfficerLogin = () => {
    localStorage.setItem('mock_role', 'officer');
    window.location.href = '/officer';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          JanSetu
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('greeting')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col items-center">
          <LanguageSelector className="mb-8" />

          <div className="w-full space-y-4">
            {!otpSent ? (
              <>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('phone_placeholder')}
                  className="appearance-none block w-full px-3 py-4 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg"
                />
                <button
                  onClick={handleCitizenLogin}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('get_otp')}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t('enter_otp')}
                  className="appearance-none block w-full px-3 py-4 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg"
                />
                <button
                  onClick={handleCitizenLogin}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('verify')}
                </button>
              </>
            )}

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleOfficerLogin}
              className="w-full flex justify-center py-4 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('officer_login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
