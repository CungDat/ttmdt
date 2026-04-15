import React, { useMemo, useState } from 'react';

function AuthModal({
  isOpen,
  onClose,
  onSubmit,
  initialMode = 'login',
  isSubmitting = false,
  errorMessage = ''
}) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const title = useMemo(() => (mode === 'login' ? 'Log In' : 'Create Account'), [mode]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({ mode, name, email, password });
  };

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-modal-head">
          <h2 className="auth-modal-title">{title}</h2>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close authentication form">
            x
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="auth-label">
              Full Name
              <input
                type="text"
                className="auth-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Nguyen Van A"
              />
            </label>
          ) : null}

          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@email.com"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </label>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch-row">
          <span className="auth-switch-text">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
            }}
          >
            {mode === 'login' ? 'Create one' : 'Log in'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default AuthModal;
