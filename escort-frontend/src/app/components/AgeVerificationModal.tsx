'use client';

import { useEffect, useState } from 'react';

export default function AgeVerificationModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem('ageVerified');
    if (verified) {
      setHasVerified(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = (isOver18: boolean) => {
    if (isOver18) {
      sessionStorage.setItem('ageVerified', 'true');
      setIsVisible(false);
      setHasVerified(true);
    } else {
      window.location.href = '/not-eligible';
    }
  };

  if (hasVerified || !isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Age verification</h2>
            <p className="mt-1 text-sm text-gray-600">You must be 18 or older to access this site</p>
          </div>
          <div className="px-6 py-6">
            <p className="mb-6 text-gray-700">This site is for adults only. By clicking "I'm 18 or older," you confirm that you are at least 18 years old and agree to our terms of service.</p>
            <div className="flex gap-3">
              <button onClick={() => handleConfirm(false)} className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 active:scale-95">
                I'm under 18
              </button>
              <button onClick={() => handleConfirm(true)} className="flex-1 rounded-md bg-violet-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-violet-700 active:scale-95">
                I'm 18 or older
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center text-xs text-gray-600">
            <p>Misrepresenting your age may result in account termination.</p>
          </div>
        </div>
      </div>
    </>
  );
}