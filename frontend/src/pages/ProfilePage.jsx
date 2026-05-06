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
          setErrorMessage('Mật khẩu mới không khớp');
          setIsSubmitting(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
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
        setSuccessMessage('Cập nhật thông tin thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
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
            <h2>Vui lòng đăng nhập</h2>
            <p>Bạn cần đăng nhập để xem và chỉnh sửa thông tin cá nhân.</p>
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
              Quay lại
            </button>
            <h1 className="profile-page-title">
              <User size={24} />
              Thông tin cá nhân
            </h1>
            <div className="profile-role-badge">
              <ShieldCheck size={14} />
              {currentUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
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
              <h3 className="profile-section-title">Thông tin cơ bản</h3>
              <div className="profile-field-grid">
                <label className="profile-field">
                  <span className="profile-field-label">
                    <User size={14} /> Họ và tên
                  </span>
                  <input
                    type="text"
                    className="profile-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
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
                    <Phone size={14} /> Số điện thoại
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
                    <MapPin size={14} /> Địa chỉ
                  </span>
                  <input
                    type="text"
                    className="profile-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Nguyễn Trãi, Quận 1, TP.HCM"
                  />
                </label>
              </div>
            </div>

            <div className="profile-form-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">
                  <Lock size={16} /> Đổi mật khẩu
                </h3>
                <button
                  type="button"
                  className="profile-toggle-password-btn"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Ẩn' : 'Đổi mật khẩu'}
                </button>
              </div>

              {showPasswordForm && (
                <div className="profile-field-grid">
                  <label className="profile-field">
                    <span className="profile-field-label">Mật khẩu hiện tại</span>
                    <input
                      type="password"
                      className="profile-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Mật khẩu mới</span>
                    <input
                      type="password"
                      className="profile-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Xác nhận mật khẩu mới</span>
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
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
