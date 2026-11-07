import { UserProfile } from '../types';
import { AuthScreen } from './AuthScreen';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  initialMode?: 'signin' | 'signup' | 'admin';
}

export function AuthModal({
  isOpen,
  currentUser,
  onLoginSuccess,
  onClose,
  onShowToast,
  initialMode = 'signin',
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-[#faf8ff] rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden">
        <AuthScreen
          currentUser={currentUser}
          initialMode={initialMode}
          onLoginSuccess={(user) => {
            onLoginSuccess(user);
            onClose();
          }}
          onClose={onClose}
          onShowToast={onShowToast}
        />
      </div>
    </div>
  );
}
