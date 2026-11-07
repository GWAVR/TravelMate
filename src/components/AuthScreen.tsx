import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TravelMateLogo } from './TravelMateLogo';
import { loginWithApi, adminLoginWithApi, registerWithApi } from '../utils/authApi';

interface AuthScreenProps {
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  onShowToast: (msg: string) => void;
  onContinueAsGuest?: () => void;
  initialMode?: 'signin' | 'signup' | 'admin';
}

export function AuthScreen({
  currentUser,
  onLoginSuccess,
  onClose,
  onShowToast,
  onContinueAsGuest,
  initialMode = 'signin',
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'admin'>(initialMode);
  
  React.useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);
  
  // NEVER pre-fill email per explicit user instruction
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('Heritage & Explorer');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin form specific state (empty by default, zero autofill)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      onShowToast(msg);
      return;
    }

    if (!password) {
      const msg = 'Please enter your password.';
      setAuthError(msg);
      onShowToast(msg);
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify.';
      setAuthError(msg);
      onShowToast(msg);
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const result = await registerWithApi(name || 'Explorer', email, password);
        onShowToast(`✓ Welcome to TravelMate, ${result.user.name}!`);
        onLoginSuccess(result.user);
      } else {
        // Sign In
        const result = await loginWithApi(email, password, 'USER');
        onShowToast(`✓ Welcome back, ${result.user.name}!`);
        onLoginSuccess(result.user);
      }
      if (onClose) onClose();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setAuthError(msg);
      onShowToast(`⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!adminEmail || !adminEmail.includes('@')) {
      const msg = 'Please enter the administrator email address.';
      setAuthError(msg);
      onShowToast(msg);
      return;
    }

    if (!adminPassword) {
      const msg = 'Please enter the administrator password.';
      setAuthError(msg);
      onShowToast(msg);
      return;
    }

    setLoading(true);
    try {
      const result = await adminLoginWithApi(adminEmail, adminPassword);
      onShowToast(`✓ Administrator access granted. Welcome, ${result.user.name}!`);
      onLoginSuccess(result.user);
      if (onClose) onClose();
    } catch (err: any) {
      const msg = err.message || 'Invalid administrator credentials. Access denied.';
      setAuthError(msg);
      onShowToast(`🔒 ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoName: string, demoEmail = '') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const demoUser: UserProfile = {
        id: 'usr-demo-' + Math.floor(100 + Math.random() * 900),
        name: demoName,
        email: demoEmail,
        avatar: '',
        role: 'USER',
        isLoggedIn: true,
        memberSince: '2024',
      };
      onLoginSuccess(demoUser);
      onShowToast(`✓ Signed in as ${demoName}`);
      if (onClose) onClose();
    }, 400);
  };

  const handleForgotPassword = () => {
    if (!email) {
      onShowToast('Please enter your email address to receive a reset link.');
      return;
    }
    onShowToast(`Password reset link sent to ${email}!`);
  };

  return (
    <div className="flex flex-col w-full px-4 py-4 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Top Bar with Back/Close button */}
      {onClose && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white shadow-xs text-[#131b2e] flex items-center justify-center hover:bg-[#f2f3ff] active:scale-95 transition-all border border-[#e2e8f0]/60"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span className="text-xs font-bold text-[#64748b]">
            {authMode === 'admin'
              ? 'Administrator Access'
              : authMode === 'signin'
              ? 'Account Sign In'
              : 'Create New Account'}
          </span>
          <div className="w-9" />
        </div>
      )}

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="mb-2">
          <TravelMateLogo size="xl" showText={false} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#131b2e] tracking-tight flex items-center gap-1 justify-center">
          <span>Travel</span>
          <span className="text-[#0ea5e9]">Mate</span>
        </h1>
        <p className="text-xs text-[#64748b] mt-0.5 max-w-xs">
          Smart group itinerary planner, multi-currency ledger &amp; AI destination concierge
        </p>

        {/* 3-Way Mode Switcher: Sign In | Sign Up | Admin Portal */}
        <div className="flex items-center p-1 rounded-xl bg-[#eef2ff] border border-[#e2e8f0] mt-4 w-full">
          <button
            onClick={() => {
              setAuthMode('signin');
              setAuthError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              authMode === 'signin'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setAuthError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              authMode === 'signup'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              setAuthMode('admin');
              setAuthError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              authMode === 'admin'
                ? 'bg-[#0c1e33] text-[#fde047] shadow-xs'
                : 'text-amber-800 hover:text-amber-950 font-extrabold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[13px]">shield</span>
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Error Alert Box */}
      {authError && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">
            error
          </span>
          <div className="flex-1 font-medium">{authError}</div>
          <button
            onClick={() => setAuthError(null)}
            className="text-red-400 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* ADMIN LOGIN MODE */}
      {authMode === 'admin' ? (
        <div className="rounded-3xl bg-[#0c1e33] text-white p-6 shadow-xl border border-[#1e3a5f] space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#1e3a5f]">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-amber-300">
                Administrator Portal
              </h2>
              <p className="text-[10px] text-[#93c5fd]">
                Server-side salted bcrypt verification &amp; 24h JWT session
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            {/* Admin Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Admin Email Address</span>
                <span className="text-[10px] text-amber-400 font-medium">RBAC Protected</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  admin_panel_settings
                </span>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@travelmate.com"
                  required
                  autoComplete="off"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#162e4c] border border-[#2b4c74] text-xs font-medium text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">Admin Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  lock
                </span>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#162e4c] border border-[#2b4c74] text-xs font-medium text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showAdminPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0c1e33] text-xs font-black shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#1e3a5f]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthError(null);
              }}
              className="text-xs font-semibold text-[#93c5fd] hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Back to Regular Traveler Sign In</span>
            </button>
          </div>
        </div>
      ) : (
        /* REGULAR TRAVELER AUTH CARD */
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#e2e8f0]/80 space-y-4">
          <form onSubmit={handleUserSubmit} className="space-y-3.5">
            {/* Full Name for Sign Up */}
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#131b2e] flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-[#64748b]">Required</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748b]">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    required
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f8faff] border border-[#e2e8f0] text-xs font-medium text-[#131b2e] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#131b2e] flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-[#006194] font-medium">Active ID</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748b]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="off"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f8faff] border border-[#e2e8f0] text-xs font-medium text-[#131b2e] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#131b2e]">Password</label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-semibold text-[#006194] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748b]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f8faff] border border-[#e2e8f0] text-xs font-medium text-[#131b2e] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#131b2e]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password for Sign Up */}
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#131b2e]">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748b]">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f8faff] border border-[#e2e8f0] text-xs font-medium text-[#131b2e] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  />
                </div>
              </div>
            )}

            {/* Travel Style Picker on Sign Up */}
            {authMode === 'signup' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-[#64748b]">Travel Persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Heritage & Explorer', 'Foodie & Bazaars', 'Relaxed Nature', 'Group Backpacker'].map(
                    (style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left truncate ${
                          selectedStyle === style
                            ? 'bg-[#e0f2fe] border-[#006194] text-[#006194]'
                            : 'bg-[#f8faff] border-[#e2e8f0] text-[#475569]'
                        }`}
                      >
                        {style}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Remember me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194]"
                />
                <span className="text-xs text-[#64748b]">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#006194] text-white text-xs font-bold shadow-md shadow-[#006194]/20 hover:bg-[#0073af] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {authMode === 'signin' ? 'login' : 'how_to_reg'}
                  </span>
                  <span>
                    {authMode === 'signin' ? 'Sign In to TravelMate' : 'Create Your Account'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Account Mode Switcher Callout */}
          <div className="pt-3 border-t border-[#e2e8f0]/80 space-y-2.5">
            <div className="text-center">
              {authMode === 'signin' ? (
                <div className="text-xs text-[#64748b]">
                  <span>New traveler? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#006194] hover:underline"
                  >
                    Create an account / Sign Up
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#64748b]">
                  <span>Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#006194] hover:underline"
                  >
                    Sign In to your account
                  </button>
                </div>
              )}
            </div>

            {/* Portal to Admin Sign In */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('admin');
                  setAuthError(null);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">shield</span>
                <span>Super Admin Sign In Portal →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 text-center">
        <p className="text-[11px] text-[#64748b]">
          {authMode === 'admin' ? (
            <span>
              Restricted system area. Unauthorized access attempts are monitored and recorded.
            </span>
          ) : authMode === 'signin' ? (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="font-bold text-[#006194] hover:underline"
              >
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have a TravelMate account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="font-bold text-[#006194] hover:underline"
              >
                Sign in here
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
