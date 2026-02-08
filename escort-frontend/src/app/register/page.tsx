'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const serviceOptions = [
  'Three some',
  'Incalls',
  'Outcalls',
  'Blow job',
  'Anal',
  'Erotic Massage',
  'Deep Throats',
  'Cum on Body',
  'GFE',
  'PSE',
  'BDSM',
  'Role Play'
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: '',
    gender: '',
    sexualOrientation: '',
    age: '',
    nationality: '',
    location: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
  const orientationOptions = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual'];
  const nationalityOptions = ['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Burundian', 'Other'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleCustomServiceAdd = () => {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      setSelectedServices(prev => [...prev, customService.trim()]);
      setCustomService('');
    }
  };

  const handleCustomServiceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomServiceAdd();
    }
  };

  const removeService = (service: string) => {
    setSelectedServices(prev => prev.filter(s => s !== service));
  };

  const validateForm = (): string | null => {
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNo', 'password', 'confirmPassword', 'gender'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        return `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Service selection validation
    if (selectedServices.length === 0) {
      return 'Please select at least one service you offer';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    // Phone validation (Kenyan format)
    const phoneRegex = /^(254|0)[17]\d{8}$/;
    const cleanPhone = formData.phoneNo.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)';
    }

    // Password validation
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    // Age validation
    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18 || age > 100) {
        return 'Age must be between 18 and 100';
      }
    }

    return null;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Convert to 254 format
    let cleanPhone = phone.replace(/\s+/g, '');
    
    if (cleanPhone.startsWith('0')) {
      return '254' + cleanPhone.substring(1);
    }
    
    if (cleanPhone.startsWith('+254')) {
      return cleanPhone.substring(1);
    }
    
    return cleanPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(formData.phoneNo);

      const response = await fetch('https://escort-vcix.onrender.com/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNo: formattedPhone,
          password: formData.password,
          gender: formData.gender,
          sexualOrientation: formData.sexualOrientation || 'Straight',
          age: formData.age ? parseInt(formData.age) : 25,
          nationality: formData.nationality || 'Kenyan',
          location: formData.location || 'Nairobi',
          services: selectedServices, // Add services to the registration data
        }),
      });

      const data = await response.json();
      console.log('Register response:', data);

      if (response.ok && data.success) {
        setSuccess('Registration successful! Your account is pending admin approval. You will be notified once approved.');
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNo: '',
          password: '',
          confirmPassword: '',
          gender: '',
          sexualOrientation: '',
          age: '',
          nationality: '',
          location: '',
        });
        setSelectedServices([]);

        // Optionally redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message || data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Service Provider Account
          </h1>
          <p className="text-lg text-gray-600">
            Register to start offering services on our platform
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phoneNo"
                    name="phoneNo"
                    type="tel"
                    required
                    value={formData.phoneNo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="0712345678 or 254712345678"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kenyan numbers only</p>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sexualOrientation" className="block text-sm font-medium text-gray-700 mb-2">
                    Sexual Orientation
                  </label>
                  <select
                    id="sexualOrientation"
                    name="sexualOrientation"
                    value={formData.sexualOrientation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  >
                    <option value="">Select Orientation</option>
                    {orientationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  >
                    <option value="">Select Nationality</option>
                    {nationalityOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location/City
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                  placeholder="Nairobi, Westlands"
                />
              </div>
            </div>

           {/* Services Section - NEW */}
<div>
  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
    Services Offered *
  </h2>
  
  <div className="mb-6">
    <p className="text-sm text-gray-600 mb-4">
      Select all services you offer. You can add or remove services later from your dashboard.
    </p>
    
    {/* Selected Services Preview */}
    {selectedServices.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Services ({selectedServices.length})</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedServices.map(service => (
            <div
              key={service}
              className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm"
            >
              <span>{service}</span>
              <button
                type="button"
                onClick={() => removeService(service)}
                className="text-purple-600 hover:text-purple-800 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Service Selection Grid - FIXED TEXT COLOR */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {serviceOptions.map(service => (
        <button
          type="button"
          key={service}
          onClick={() => toggleService(service)}
          className={`p-3 rounded-lg border-2 transition-all duration-200 text-black ${
            selectedServices.includes(service)
              ? 'border-purple-500 bg-purple-50 text-purple-800' // Changed to purple-800 for better contrast
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900' // Changed to gray-900 (almost black)
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{service}</span>
            {selectedServices.includes(service) ? (
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="w-5 h-5 border-2 border-gray-400 rounded"></div> // Changed to gray-400
            )}
          </div>
        </button>
      ))}
    </div>

    {/* Custom Service Input */}
    <div className="mb-2">
      <label htmlFor="customService" className="block text-sm font-medium text-gray-900 mb-2">
        Add Custom Service
      </label>
      <div className="flex gap-2">
        <input
          id="customService"
          type="text"
          value={customService}
          onChange={(e) => setCustomService(e.target.value)}
          onKeyDown={handleCustomServiceKeyDown}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
          placeholder="Type a service not listed above"
        />
        <button
          type="button"
          onClick={handleCustomServiceAdd}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  </div>
</div>

            {/* Account Security Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Account Security
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-purple-600 hover:text-purple-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || selectedServices.length === 0}
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 ${
                  selectedServices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Important Notice */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 font-medium">
                  Account Approval Required
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  All new accounts require admin approval before activation. You will be notified via email once your account is approved. This process typically takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}