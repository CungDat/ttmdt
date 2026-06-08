import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, ArrowLeft, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Footer from '../components/Footer';

function ProfilePage({ currentUser, authToken, onUserUpdate, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = { name, phone, address };

      if (showPasswordForm && currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          setErrorMessage('New passwords do not match');
          setIsSubmitting(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMessage('New password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.data?.user) {
        onUserUpdate?.(res.data.user);
        setSuccessMessage('Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <main className="profile-page-main">
          <div className="profile-not-logged">
            <User size={48} />
            <h2>Please log in</h2>
            <p>You need to log in to view and edit your profile.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="profile-page-main">
        <div className="profile-page-container">
          <div className="profile-page-header">
            <button type="button" className="profile-back-btn" onClick={onBack}>
              <ArrowLeft size={18} />
              Back
            </button>
            <h1 className="profile-page-title">
              <User size={24} />
              Profile Info
            </h1>
            <div className="profile-role-badge">
              <ShieldCheck size={14} />
              {currentUser.role === 'admin' ? 'Administrator' : 'Customer'}
            </div>
          </div>

          {successMessage && (
            <div className="profile-success-toast">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="profile-error-toast">{errorMessage}</div>
          )}

          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="profile-form-section">
              <h3 className="profile-section-title">Basic Information</h3>
              <div className="profile-field-grid">
                <label className="profile-field">
                  <span className="profile-field-label">
                    <User size={14} /> Full Name
                  </span>
                  <input
                    type="text"
                    className="profile-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-field-label">
                    <Mail size={14} /> Email
                  </span>
                  <input
                    type="email"
                    className="profile-input profile-input-readonly"
                    value={email}
                    readOnly
                    disabled
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-field-label">
                    <Phone size={14} /> Phone Number
                  </span>
                  <input
                    type="tel"
                    className="profile-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123456789"
                  />
                </label>
                <label className="profile-field profile-field-full">
                  <span className="profile-field-label">
                    <MapPin size={14} /> Address
                  </span>
                  <input
                    type="text"
                    className="profile-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, New York, NY"
                  />
                </label>
              </div>
            </div>

            <div className="profile-form-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">
                  <Lock size={16} /> Change Password
                </h3>
                <button
                  type="button"
                  className="profile-toggle-password-btn"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Hide' : 'Change Password'}
                </button>
              </div>

              {showPasswordForm && (
                <div className="profile-field-grid">
                  <label className="profile-field">
                    <span className="profile-field-label">Current Password</span>
                    <input
                      type="password"
                      className="profile-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">New Password</span>
                    <input
                      type="password"
                      className="profile-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Confirm New Password</span>
                    <input
                      type="password"
                      className="profile-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ProfilePage;
