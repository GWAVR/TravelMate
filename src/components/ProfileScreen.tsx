import { useState, useRef, useEffect } from 'react';
import { APP_ASSETS, INITIAL_MEMBERS } from '../data/mockData';
import { UserProfile, Member } from '../types';
import { UserAvatar } from './UserAvatar';
import { TravelMateLogo } from './TravelMateLogo';
import { changePasswordApi } from '../utils/authApi';

interface ProfileScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  activeTripName?: string;
  onUpdateActiveTrip?: (tripName: string) => void;
  members?: Member[];
  onUpdateMembers?: (members: Member[]) => void;
  onResetData?: (newExpenses: any[], newActivities: any[]) => void;
  appMode?: 'fresh' | 'demo';
  onResetToFresh?: () => void;
  onLoadDemoTrip?: () => void;
  customLogoUrl?: string;
  onUpdateCustomLogo?: (logoUrl: string) => void;
  onOpenAdmin?: () => void;
}

const PRESET_AVATARS = [
  { id: 'alex', name: 'Alex / Abhijeet', url: APP_ASSETS.alexProfileHeader },
  { id: 'maya', name: 'Maya (Design)', url: APP_ASSETS.mayaAvatar },
  { id: 'sarah', name: 'Sarah (Photo)', url: APP_ASSETS.sarahAvatar },
  { id: 'kenji', name: 'Kenji (Local)', url: APP_ASSETS.kenjiAvatar },
  {
    id: 'wanderer1',
    name: 'Mountain Trekker',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'wanderer2',
    name: 'Adventure Nomad',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'wanderer3',
    name: 'City Explorer',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'wanderer4',
    name: 'Backpacker Neil',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  },
];

const DEFAULT_INTEREST_OPTIONS = [
  'Cultural Heritage',
  'Culinary & Foodie',
  'Scenic Nature',
  'Nightlife',
  'Art & Museums',
  'Thrift & Shopping',
  'Historical Forts',
  'Street Food & Bazaars',
  'Hiking & Trekking',
  'Beaches & Coastal',
  'Spiritual & Temples',
  'Wildlife & Safari',
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Jain Vegetarian',
  'Halal',
  'Pescatarian',
  'Gluten-Free',
  'No Restrictions',
];

const LANGUAGE_OPTIONS = [
  'English (India)',
  'English (US)',
  'English (UK)',
  'Hindi (हिन्दी)',
  'Japanese (日本語)',
  'Spanish (Español)',
  'French (Français)',
  'German (Deutsch)',
];

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
];

export function ProfileScreen({
  currentUser,
  onBack,
  onShowToast,
  onOpenAuth,
  onLogout,
  onUpdateUser,
  activeTripName = 'Kyoto & Tokyo',
  onUpdateActiveTrip,
  members = INITIAL_MEMBERS,
  onUpdateMembers,
  appMode = 'fresh',
  onResetToFresh,
  onLoadDemoTrip,
  onOpenAdmin,
}: ProfileScreenProps) {
  // Global Edit Mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Profile fields state
  const [name, setName] = useState(currentUser.name || 'Traveler');
  const [username, setUsername] = useState(currentUser.username || 'traveler');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [bio, setBio] = useState(
    currentUser.bio ||
      'Passionate wanderer exploring ancient trails, street delicacies & vibrant landscapes worldwide.'
  );
  const [homeCity, setHomeCity] = useState(currentUser.homeCity || 'New Delhi, India');
  const [nationality, setNationality] = useState(currentUser.nationality || 'Indian');
  const [passportNumber, setPassportNumber] = useState(currentUser.passportNumber || 'Z1894207');
  const [passportExpiry, setPassportExpiry] = useState(currentUser.passportExpiry || '2032-08-15');
  const [emergencyContactName, setEmergencyContactName] = useState(
    currentUser.emergencyContactName || 'Rajesh Rao'
  );
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(
    currentUser.emergencyContactRelation || 'Brother'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    currentUser.emergencyContactPhone || '+91 98111 22334'
  );

  // Active Trip state
  const [tripTitle, setTripTitle] = useState(activeTripName);
  const [tripDates, setTripDates] = useState('Nov 12 - 20, 2026');

  // Persona & Preferences state
  const [pace, setPace] = useState<'Relaxed' | 'Balanced' | 'Fast-Paced'>(
    currentUser.pace || 'Balanced'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser.interests || [
      'Cultural Heritage',
      'Culinary & Foodie',
      'Scenic Nature',
      'Art & Museums',
      'Street Food & Bazaars',
    ]
  );
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [dietary, setDietary] = useState(currentUser.dietary || 'Vegetarian');
  const [customDietaryInput, setCustomDietaryInput] = useState('');
  const [walkingGoalSteps, setWalkingGoalSteps] = useState(currentUser.walkingGoalSteps || 15000);
  const [preferredCurrency, setPreferredCurrency] = useState(currentUser.preferredCurrency || 'INR');
  const [preferredLanguage, setPreferredLanguage] = useState(
    currentUser.preferredLanguage || 'English (India)'
  );

  // Ledger & Financial Split Defaults
  const [defaultSplitMode, setDefaultSplitMode] = useState<'equal' | 'percent' | 'exact'>(
    currentUser.defaultSplitMode || 'equal'
  );
  const [settlementMethod, setSettlementMethod] = useState(
    currentUser.settlementMethod || 'Google Pay / UPI (abhijeet@okhdfcbank)'
  );
  const [tripBudgetLimit, setTripBudgetLimit] = useState<number>(
    currentUser.tripBudgetLimit && currentUser.tripBudgetLimit > 1000 ? currentUser.tripBudgetLimit : 45000
  );

  // Automation & Toggles
  const [dynamicWeather, setDynamicWeather] = useState(currentUser.dynamicWeather ?? true);
  const [pushAlerts, setPushAlerts] = useState(currentUser.pushAlerts ?? true);
  const [faceId, setFaceId] = useState(currentUser.faceId ?? true);
  const [offlineMapPack, setOfflineMapPack] = useState(currentUser.offlineMapPack ?? true);

  // Avatar Picker Modal
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Change Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Travel Crew Management Modal / State
  const [crew, setCrew] = useState<Member[]>(members);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Traveler');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberNameInput, setEditMemberNameInput] = useState('');
  const [editMemberPhoneInput, setEditMemberPhoneInput] = useState('');
  const [isEditingUserPhoneModal, setIsEditingUserPhoneModal] = useState(false);
  const [userPhoneModalInput, setUserPhoneModalInput] = useState(currentUser.phone || '+91 98765 43210');

  // Keep form synchronized when currentUser prop changes (e.g. login or switch)
  useEffect(() => {
    if (!isEditing) {
      setName(currentUser.name || 'Traveler');
      setUsername(currentUser.username || 'traveler');
      setEmail(currentUser.email || '');
      const defaultOrUserPhone = currentUser.phone || '+91 98765 43210';
      setPhone(defaultOrUserPhone);
      setUserPhoneModalInput(defaultOrUserPhone);
      setAvatar(currentUser.avatar || '');
      setBio(
        currentUser.bio ||
          'Passionate wanderer exploring ancient trails, street delicacies & vibrant landscapes worldwide.'
      );
      setHomeCity(currentUser.homeCity || 'Pune, Maharashtra');
      setNationality(currentUser.nationality || 'Indian');
      setPassportNumber(currentUser.passportNumber || 'Z1894207');
      setPassportExpiry(currentUser.passportExpiry || '2032-08-15');
      setEmergencyContactName(currentUser.emergencyContactName || 'Rajesh Rao');
      setEmergencyContactRelation(currentUser.emergencyContactRelation || 'Brother');
      setEmergencyContactPhone(currentUser.emergencyContactPhone || '+91 98111 22334');
      setPace(currentUser.pace || 'Balanced');
      if (currentUser.interests) setSelectedInterests(currentUser.interests);
      if (currentUser.dietary) setDietary(currentUser.dietary);
      if (currentUser.tripBudgetLimit) {
        setTripBudgetLimit(currentUser.tripBudgetLimit > 1000 ? currentUser.tripBudgetLimit : 45000);
      }
    }
  }, [currentUser, isEditing]);

  // Save changes handler
  const handleSaveChanges = () => {
    const updatedUser: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      username: username.trim(),
      email: email.trim() || currentUser.email,
      phone: phone.trim(),
      avatar: avatar || currentUser.avatar,
      bio: bio.trim(),
      homeCity: homeCity.trim(),
      nationality: nationality.trim(),
      passportNumber: passportNumber.trim(),
      passportExpiry: passportExpiry.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      pace,
      interests: selectedInterests,
      dietary: customDietaryInput.trim() || dietary,
      walkingGoalSteps,
      preferredCurrency,
      preferredLanguage,
      defaultSplitMode,
      settlementMethod: settlementMethod.trim(),
      tripBudgetLimit,
      dynamicWeather,
      pushAlerts,
      faceId,
      offlineMapPack,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    if (onUpdateActiveTrip && tripTitle.trim()) {
      onUpdateActiveTrip(tripTitle.trim());
    }

    if (onUpdateMembers) {
      onUpdateMembers(crew);
    }

    setIsEditing(false);
    onShowToast('✓ Profile, persona & settings saved successfully!');
  };

  const handleDiscardChanges = () => {
    // Reset back to current props
    setName(currentUser.name || 'Traveler');
    setUsername(currentUser.username || 'traveler');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '+91 98765 43210');
    setAvatar(currentUser.avatar || '');
    setBio(
      currentUser.bio ||
        'Passionate wanderer exploring ancient trails, street delicacies & vibrant landscapes worldwide.'
    );
    setHomeCity(currentUser.homeCity || 'New Delhi, India');
    setNationality(currentUser.nationality || 'Indian');
    setPassportNumber(currentUser.passportNumber || 'Z1894207');
    setPassportExpiry(currentUser.passportExpiry || '2032-08-15');
    setEmergencyContactName(currentUser.emergencyContactName || 'Rajesh Rao');
    setEmergencyContactRelation(currentUser.emergencyContactRelation || 'Brother');
    setEmergencyContactPhone(currentUser.emergencyContactPhone || '+91 98111 22334');
    setPace(currentUser.pace || 'Balanced');
    setSelectedInterests(
      currentUser.interests || [
        'Cultural Heritage',
        'Culinary & Foodie',
        'Scenic Nature',
        'Art & Museums',
        'Street Food & Bazaars',
      ]
    );
    setDietary(currentUser.dietary || 'Vegetarian');
    setWalkingGoalSteps(currentUser.walkingGoalSteps || 15000);
    setPreferredCurrency(currentUser.preferredCurrency || 'INR');
    setPreferredLanguage(currentUser.preferredLanguage || 'English (India)');
    setDefaultSplitMode(currentUser.defaultSplitMode || 'equal');
    setSettlementMethod(
      currentUser.settlementMethod || 'Google Pay / UPI (abhijeet@okhdfcbank)'
    );
    setTripBudgetLimit(currentUser.tripBudgetLimit ?? 650);
    setDynamicWeather(currentUser.dynamicWeather ?? true);
    setPushAlerts(currentUser.pushAlerts ?? true);
    setFaceId(currentUser.faceId ?? true);
    setTripTitle(activeTripName);
    setIsEditing(false);
    onShowToast('Changes discarded.');
  };

  // Toggle Interest
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Add custom interest
  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInterestInput.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterestInput('');
      onShowToast(`Added "${trimmed}" to your interests!`);
    }
  };

  // File Upload reader for avatar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast('Image exceeds 2MB limit. Please choose a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
          setIsAvatarModalOpen(false);
          onShowToast('Profile photo updated!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new Crew Member with Name & Phone Number
  const handleAddCrewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      onShowToast('Please provide a companion name.');
      return;
    }
    const initials = newMemberName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      initials: initials || 'TR',
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@travel.co`,
      phone: newMemberPhone.trim() || '+91 98000 00000',
      avatar: '',
      color: '#006194',
      netBalance: 0,
      subtext: newMemberRole || 'Traveler',
    };

    const updated = [...crew, newMember];
    setCrew(updated);
    if (onUpdateMembers) {
      onUpdateMembers(updated);
    }
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberRole('Traveler');
    setIsAddMemberModalOpen(false);
    onShowToast(`✓ Added ${newMember.name} (${newMember.phone}) to the travel crew!`);
  };

  // Delete Crew Member
  const handleDeleteMember = (memberId: string) => {
    if (crew.length <= 1) {
      onShowToast('Cannot remove the trip owner.');
      return;
    }
    const updated = crew.filter((m) => m.id !== memberId);
    setCrew(updated);
    if (onUpdateMembers) {
      onUpdateMembers(updated);
    }
    onShowToast('Member removed from travel crew.');
  };

  // Edit Crew Member Name & Phone
  const handleSaveMemberEdit = (memberId: string) => {
    if (!editMemberNameInput.trim()) return;
    const updated = crew.map((m) =>
      m.id === memberId
        ? {
            ...m,
            name: editMemberNameInput.trim(),
            phone: editMemberPhoneInput.trim() || m.phone,
          }
        : m
    );
    setCrew(updated);
    if (onUpdateMembers) {
      onUpdateMembers(updated);
    }
    setEditingMemberId(null);
    setEditMemberNameInput('');
    setEditMemberPhoneInput('');
    onShowToast('Member name and phone updated.');
  };

  // Quick User Phone Update Handler
  const handleQuickUpdateUserPhone = () => {
    const trimmed = userPhoneModalInput.trim();
    if (!trimmed) {
      onShowToast('Please enter your phone number.');
      return;
    }
    setPhone(trimmed);
    const updatedUser: UserProfile = {
      ...currentUser,
      phone: trimmed,
    };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    if (crew.length > 0) {
      const updatedCrew = crew.map((m, idx) =>
        idx === 0 || m.id === currentUser.id ? { ...m, phone: trimmed } : m
      );
      setCrew(updatedCrew);
      if (onUpdateMembers) onUpdateMembers(updatedCrew);
    }
    setIsEditingUserPhoneModal(false);
    onShowToast(`✓ Your phone number set to ${trimmed}`);
  };

  return (
    <div className="flex flex-col w-full px-4 pb-28 space-y-4">
      {/* Sticky / Top Header Bar */}
      <section className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white shadow-xs text-[#131b2e] flex items-center justify-center hover:bg-[#f2f3ff] active:scale-95 transition-all border border-[#e2e8f0]/60"
          type="button"
          aria-label="Back to dashboard"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-sm font-bold text-[#131b2e]">Profile &amp; Settings</h1>
          <span className="text-[10px] text-[#64748b]">
            {isEditing ? 'Editing Mode Active' : 'Account & Preferences'}
          </span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDiscardChanges}
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-all"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-3 py-1.5 rounded-full bg-[#006194] text-white shadow-xs text-xs font-bold hover:bg-[#0073af] active:scale-95 transition-all flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">check</span>
              <span>Save</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#e0f2fe] text-[#006194] text-xs font-bold hover:bg-[#bae6fd] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            <span>Edit</span>
          </button>
        )}
      </section>

      {/* Editing Mode Banner when active */}
      {isEditing && (
        <div className="p-3 rounded-2xl bg-[#006194] text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Edit Profile &amp; Preferences</span>
              <span className="text-[11px] text-white/80">
                Update your details, emergency info, and ledger defaults below.
              </span>
            </div>
          </div>
          <button
            onClick={handleSaveChanges}
            className="px-3 py-1 bg-white text-[#006194] font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
            type="button"
          >
            Done
          </button>
        </div>
      )}

      {/* ==================== 1. MAIN PROFILE CARD ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3 relative">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
            Personal Profile
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[#006194] flex items-center gap-1 hover:underline"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span>Edit Details</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar with edit overlay */}
          <div className="relative group shrink-0">
            <UserAvatar
              name={name}
              avatar={avatar}
              size="xl"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              title={avatar ? 'Change or Remove Profile Photo' : 'Upload or Choose Profile Photo'}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#006194] text-white shadow-md flex items-center justify-center hover:bg-[#0073af] active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">photo_camera</span>
            </button>
          </div>

          {/* Details or Form Inputs */}
          <div className="flex-1 w-full space-y-2.5">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                      Username / Handle
                    </label>
                    <div className="flex items-center px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl focus-within:border-[#006194] focus-within:bg-white">
                      <span className="text-xs text-[#94a3b8] font-bold mr-0.5">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="handle"
                        className="w-full text-xs font-semibold text-[#131b2e] bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                      Home City &amp; Country
                    </label>
                    <input
                      type="text"
                      value={homeCity}
                      onChange={(e) => setHomeCity(e.target.value)}
                      placeholder="e.g. New Delhi, India"
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@travel.co"
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                    Bio / Travel Mantra
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio or travel bucket list..."
                    className="w-full px-3 py-1.5 text-xs text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white resize-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#131b2e]">{name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentUser.isLoggedIn
                        ? 'bg-[#e0f2fe] text-[#006194]'
                        : 'bg-[#f1f5f9] text-[#64748b]'
                    }`}
                  >
                    {currentUser.isLoggedIn ? 'SIGNED IN' : 'GUEST'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b] mt-0.5">
                  <span className="font-semibold text-[#006194]">@{username}</span>
                  <span>•</span>
                  <span>{email || 'No email set'}</span>
                </div>

                {/* User Phone Number Row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">call</span>
                    <span>Your Phone: <strong className="text-emerald-900">{phone || 'Not added yet'}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserPhoneModalInput(phone || '');
                      setIsEditingUserPhoneModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-200"
                    title="Update your mobile/WhatsApp number"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    <span>{phone ? 'Edit Phone' : '+ Add Your Phone'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#475569] mt-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#006194]">
                    location_on
                  </span>
                  <span>{homeCity}</span>
                </div>

                {bio && (
                  <p className="text-xs text-[#334155] italic bg-[#f8fafc] p-2 rounded-xl mt-2 border border-[#e2e8f0]/40">
                    "{bio}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#e2e8f0]/60 text-center">
          <div className="p-2 rounded-xl bg-[#f2f3ff]">
            <span className="text-sm font-bold text-[#131b2e] block">36</span>
            <span className="text-[9px] text-[#64748b]">MH Districts</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f2f3ff]">
            <span className="text-sm font-bold text-[#131b2e] block">{crew.length}</span>
            <span className="text-[9px] text-[#64748b]">Travel Crew</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f2f3ff]">
            <span className="text-sm font-bold text-[#006c49] block">4.9 ★</span>
            <span className="text-[9px] text-[#64748b]">Rating</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f2f3ff]">
            <span className="text-sm font-bold text-[#006194] block">₹45k</span>
            <span className="text-[9px] text-[#64748b]">Trip Budget</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onOpenAuth}
            className="flex-1 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">account_circle</span>
            <span>{currentUser.isLoggedIn ? 'Switch / Sign In' : 'Sign In / Register'}</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              onShowToast('TravelMate Pass & profile link copied!');
            }}
            className="flex-1 py-2 rounded-xl bg-[#e2e7ff] text-[#131b2e] text-xs font-bold hover:bg-[#dae2fd] active:scale-95 transition-all flex items-center justify-center gap-1"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Share Pass</span>
          </button>
        </div>
      </section>

      {/* ==================== 2. ACTIVE TRIP SETTINGS ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
            Active Journey Configuration
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-bold">
            Live Trip
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                Trip Name / Destination
              </label>
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                placeholder="e.g. Kyoto & Tokyo or Golden Triangle"
                className="w-full px-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                Journey Dates
              </label>
              <input
                type="text"
                value={tripDates}
                onChange={(e) => setTripDates(e.target.value)}
                placeholder="e.g. Nov 12 - 20, 2026"
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#f2f3ff] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[24px] text-[#006194]">flight_takeoff</span>
              <div>
                <span className="font-bold text-xs text-[#131b2e] block">{tripTitle}</span>
                <span className="text-[10px] text-[#64748b]">{tripDates} • {crew.length} Travelers</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[#006194] hover:underline"
              type="button"
            >
              Rename
            </button>
          </div>
        )}
      </section>

      {/* ==================== 3. PASSPORT & EMERGENCY CONTACTS ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
            Travel Documents &amp; Emergency
          </span>
          <span className="text-[10px] text-[#64748b] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-[#006c49]">lock</span>
            Stored Locally
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Indian"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Passport Number
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="Z1894207"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Passport Expiry
                </label>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e2e8f0]/40">
              <span className="text-[11px] font-bold text-[#131b2e] block mb-1.5">
                Emergency Contact Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-0.5">Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Rajesh Rao"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-0.5">Relationship</label>
                  <input
                    type="text"
                    value={emergencyContactRelation}
                    onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    placeholder="Brother / Spouse"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-0.5">Emergency Phone</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#f2f3ff]">
                <span className="text-[10px] text-[#64748b] block">Nationality &amp; Passport</span>
                <span className="font-bold text-[#131b2e] block">
                  {nationality} • {passportNumber ? `${passportNumber.slice(0, 2)}••••${passportNumber.slice(-3)}` : 'Not set'}
                </span>
                <span className="text-[10px] text-[#64748b]">Exp: {passportExpiry || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f2f3ff]">
                <span className="text-[10px] text-[#64748b] block">Emergency Contact</span>
                <span className="font-bold text-[#131b2e] block">
                  {emergencyContactName} ({emergencyContactRelation})
                </span>
                <span className="text-[10px] text-[#006194] font-medium">{emergencyContactPhone}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================== 4. TRAVEL PERSONA & PACING ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
            Travel Persona &amp; Preferences
          </span>
          <span className="text-[10px] text-[#006194] font-semibold">AI Tailored</span>
        </div>

        {/* Trip Pace Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b]">Trip Pace Preference</span>
            <span className="text-[10px] text-[#006194] font-bold">{pace}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['Relaxed', 'Balanced', 'Fast-Paced'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPace(p)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                  pace === p
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#f2f3ff] text-[#475569] hover:bg-[#e2e7ff]'
                }`}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Interests */}
        <div className="space-y-2 pt-1 border-t border-[#e2e8f0]/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b]">Discovery Interests</span>
            <span className="text-[10px] text-[#64748b]">
              {selectedInterests.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_INTEREST_OPTIONS.map((item) => {
              const active = selectedInterests.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#006194] text-white shadow-xs'
                      : 'bg-[#f2f3ff] text-[#475569] hover:bg-[#e2e7ff]'
                  }`}
                  type="button"
                >
                  {item} {active && '✓'}
                </button>
              );
            })}
            {selectedInterests
              .filter((item) => !DEFAULT_INTEREST_OPTIONS.includes(item))
              .map((custom) => (
                <button
                  key={custom}
                  onClick={() => toggleInterest(custom)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#006194] text-white shadow-xs flex items-center gap-1"
                  type="button"
                >
                  <span>{custom} ✓</span>
                  <span className="text-[10px] opacity-75">✕</span>
                </button>
              ))}
          </div>

          {/* Add custom interest form */}
          {isEditing && (
            <form onSubmit={handleAddCustomInterest} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                placeholder="Add custom interest (e.g. Scuba, Paragliding)..."
                className="flex-1 px-3 py-1.5 text-xs text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#006194] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0073af]"
              >
                + Add
              </button>
            </form>
          )}
        </div>

        {/* Dietary & Step Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e2e8f0]/40">
          {/* Dietary Profile */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#64748b] block">
              Dietary Profile
            </label>
            {isEditing ? (
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-xs">
                <span className="font-bold text-[#131b2e]">{dietary}</span>
              </div>
            )}
          </div>

          {/* Daily Step Goal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#64748b]">Daily Walking Goal</label>
              <span className="text-xs font-extrabold text-[#006194]">
                {walkingGoalSteps.toLocaleString()} steps
              </span>
            </div>
            {isEditing ? (
              <div className="space-y-1">
                <input
                  type="range"
                  min="5000"
                  max="25000"
                  step="1000"
                  value={walkingGoalSteps}
                  onChange={(e) => setWalkingGoalSteps(Number(e.target.value))}
                  className="w-full accent-[#006194]"
                />
                <div className="flex justify-between text-[10px] text-[#94a3b8]">
                  <span>5k</span>
                  <span>10k</span>
                  <span>15k</span>
                  <span>20k</span>
                  <span>25k</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-xs">
                <span className="font-bold text-[#131b2e]">{walkingGoalSteps.toLocaleString()} steps / day</span>
              </div>
            )}
          </div>
        </div>

        {/* Currency & Language Defaults */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e2e8f0]/40">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#64748b] block">Preferred Currency</label>
            {isEditing ? (
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-xs flex items-center justify-between">
                <span className="font-bold text-[#131b2e]">
                  {preferredCurrency} (
                  {CURRENCY_OPTIONS.find((c) => c.code === preferredCurrency)?.symbol || '$'})
                </span>
                <span className="text-[10px] text-[#64748b]">Default</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#64748b] block">App Language</label>
            {isEditing ? (
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-xs">
                <span className="font-bold text-[#131b2e]">{preferredLanguage}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 5. LEDGER & SPLIT SETTINGS ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
            Ledger &amp; Split Settings
          </span>
          <span className="text-[10px] text-[#006194] font-semibold">Expense Defaults</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Split Mode default */}
          <div className="p-3 rounded-xl bg-[#f2f3ff] space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#131b2e] block">Default Split Mode</span>
                <span className="text-[10px] text-[#64748b]">
                  Automated share calculated when adding bills
                </span>
              </div>
              <span className="text-[#006194] font-bold capitalize">{defaultSplitMode} split</span>
            </div>
            {isEditing && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['equal', 'percent', 'exact'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDefaultSplitMode(mode)}
                    className={`py-1 rounded-lg text-[11px] font-bold transition-all ${
                      defaultSplitMode === mode
                        ? 'bg-[#006194] text-white shadow-2xs'
                        : 'bg-white text-[#64748b] border border-[#cbd5e1]'
                    }`}
                    type="button"
                  >
                    {mode === 'equal' ? 'Equal (25%)' : mode === 'percent' ? 'Percent' : 'Exact'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settlement Account */}
          <div className="p-3 rounded-xl bg-[#f2f3ff] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#131b2e] block">Settlement Method / UPI</span>
              <span className="text-[10px] text-[#006c49] font-bold">Linked</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={settlementMethod}
                onChange={(e) => setSettlementMethod(e.target.value)}
                placeholder="e.g. Google Pay / UPI: yourname@upi"
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-white border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#006194]">account_balance_wallet</span>
                <span className="font-semibold text-[#131b2e]">{settlementMethod}</span>
              </div>
            )}
          </div>

          {/* Predefined Trip Budget Limit (INR ₹) */}
          <div className="p-3 rounded-xl bg-[#f2f3ff] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#131b2e] block">Predefined Trip Budget Limit (INR ₹)</span>
                <span className="text-[10px] text-[#64748b]">
                  Triggers an automated budget warning toast in Expenses when total trip spend exceeds this limit
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#006194] text-xs font-bold">
                ₹{tripBudgetLimit.toLocaleString('en-IN')}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#64748b]">₹</span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={tripBudgetLimit}
                    onChange={(e) => setTripBudgetLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-white border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#64748b] mr-0.5">Quick Presets:</span>
                  {[25000, 45000, 75000, 100000, 150000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTripBudgetLimit(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        tripBudgetLimit === preset
                          ? 'bg-[#006194] text-white shadow-2xs'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:border-[#006194]'
                      }`}
                    >
                      ₹{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#64748b]">Configured Threshold</span>
                <span className="text-xs font-bold text-[#131b2e]">₹{tripBudgetLimit.toLocaleString('en-IN')} INR</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 6. SMART AUTOMATION & DATA ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3">
        <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
          Automation &amp; Offline Data
        </span>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#131b2e] block">Dynamic Rain Routing</span>
              <span className="text-[10px] text-[#64748b]">
                Auto-suggest indoor temples &amp; arcades when rain &gt; 60%
              </span>
            </div>
            <input
              type="checkbox"
              checked={dynamicWeather}
              onChange={(e) => setDynamicWeather(e.target.checked)}
              className="w-4 h-4 rounded text-[#006194] accent-[#006194]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#131b2e] block">OCR &amp; Split Push Alerts</span>
              <span className="text-[10px] text-[#64748b]">Notify crew when bills or receipts are logged</span>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[#006194] accent-[#006194]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#131b2e] block">Biometric / PIN Ledger Security</span>
              <span className="text-[10px] text-[#64748b]">Require verification for debt settlement</span>
            </div>
            <input
              type="checkbox"
              checked={faceId}
              onChange={(e) => setFaceId(e.target.checked)}
              className="w-4 h-4 rounded text-[#006194] accent-[#006194]"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#e0f2fe] text-[#006194]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">cloud_done</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Offline Journey Pack &amp; Map Data</span>
                <span className="text-[10px] text-[#006194]/80">142 MB cached • 100% available offline</span>
              </div>
            </div>
            <button
              onClick={() => onShowToast('Local offline cache refreshed & synchronized.')}
              className="px-2.5 py-1 bg-white text-[#006194] font-bold text-[11px] rounded-lg shadow-2xs hover:bg-[#bae6fd]"
              type="button"
            >
              Re-sync
            </button>
          </div>
        </div>
      </section>

      {/* ==================== 7. TRAVEL CREW MANAGEMENT ==================== */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
              Travel Crew Members
            </span>
            <span className="px-2 py-0.2 rounded-full bg-[#f1f5f9] text-[#475569] text-[10px] font-bold">
              {crew.length}
            </span>
          </div>
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="text-xs font-bold text-[#006194] flex items-center gap-0.5 hover:underline"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            <span>+ Add Member</span>
          </button>
        </div>

        <div className="space-y-2">
          {crew.map((m, idx) => {
            const isEditingThisMember = editingMemberId === m.id;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f2f3ff] text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                  <UserAvatar
                    name={m.name}
                    avatar={m.avatar}
                    initials={m.initials}
                    size="sm"
                  />
                  {isEditingThisMember ? (
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editMemberNameInput}
                          onChange={(e) => setEditMemberNameInput(e.target.value)}
                          placeholder="Member Name"
                          className="px-2 py-1 bg-white border border-[#cbd5e1] rounded-lg text-xs font-bold outline-none flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveMemberEdit(m.id)}
                          className="p-1 bg-[#006194] text-white rounded-md hover:bg-[#0073af]"
                          type="button"
                          title="Save changes"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </button>
                        <button
                          onClick={() => setEditingMemberId(null)}
                          className="p-1 bg-[#f1f5f9] text-[#64748b] rounded-md hover:bg-[#e2e8f0]"
                          type="button"
                          title="Cancel"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                      <input
                        type="tel"
                        value={editMemberPhoneInput}
                        onChange={(e) => setEditMemberPhoneInput(e.target.value)}
                        placeholder="Phone: +91 98765 43210"
                        className="px-2 py-0.5 bg-white border border-[#cbd5e1] rounded-lg text-[11px] font-semibold outline-none w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#131b2e] truncate">{m.name}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#e0f2fe] text-[#006194]">
                            Owner
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[#006194] bg-[#006194]/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">call</span>
                          <span>{m.phone || 'No phone added'}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#64748b] truncate">{m.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-[#64748b] bg-white px-2 py-0.5 rounded-md">
                    {m.subtext || 'Member'}
                  </span>
                  {idx !== 0 && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMemberId(m.id);
                          setEditMemberNameInput(m.name);
                          setEditMemberPhoneInput(m.phone || '');
                        }}
                        className="w-7 h-7 rounded-lg bg-white text-[#64748b] hover:text-[#006194] flex items-center justify-center"
                        type="button"
                        title="Edit member name & phone"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="w-7 h-7 rounded-lg bg-white text-[#f43f5e] hover:bg-[#ffe4e6] flex items-center justify-center"
                        type="button"
                        title="Remove member"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== 8. APP EXPERIENCE & DATA MODE ==================== */}
      <section className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006194] text-[20px]">
              settings_backup_restore
            </span>
            <div>
              <h3 className="text-xs font-bold text-[#131b2e]">App Experience &amp; Data Mode</h3>
              <p className="text-[10px] text-[#64748b]">Switch between a fresh clean slate or interactive sample demo</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            appMode === 'fresh' ? 'bg-[#d1fae5] text-[#006c49]' : 'bg-[#fed7aa] text-[#c2410c]'
          }`}>
            {appMode === 'fresh' ? 'Fresh Mode' : 'Demo Mode'}
          </span>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onResetToFresh}
            className="w-full p-3 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] text-left transition-all flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">cleaning_services</span>
                Clean Slate &amp; Reset Active Trips
              </span>
            </div>
            <p className="text-[10px] text-[#64748b]">
              Clear local cached trips and start fresh for planning your custom Maharashtra journey.
            </p>
          </button>
        </div>
      </section>

      {/* ==================== 9. LOGOUT & FOOTER ==================== */}
      <div className="pt-2 flex flex-col items-center gap-2 text-center">
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full py-3 rounded-xl bg-[#0c1e33] text-[#fde047] font-bold text-xs hover:bg-[#162e4c] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs border border-amber-400/30"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-400">shield</span>
            <span>
              {currentUser?.role === 'ADMIN' ? 'Open Administrator Console' : 'Administrator Sign In Portal'}
            </span>
          </button>
        )}

        {currentUser.isLoggedIn && (
          <button
            onClick={() => {
              setCurrentPasswordInput('');
              setNewPasswordInput('');
              setConfirmNewPasswordInput('');
              setIsChangePasswordOpen(true);
            }}
            className="w-full py-2.5 rounded-xl bg-white border border-[#cbd5e1] text-[#131b2e] font-bold text-xs hover:bg-[#f8fafc] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006194]">lock_reset</span>
            <span>Change Account Password</span>
          </button>
        )}

        {currentUser.isLoggedIn ? (
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-[#ffe4e6] text-[#f43f5e] font-bold text-xs hover:bg-[#fecdd3] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out of TravelMate</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-3 rounded-xl bg-[#006194] text-white font-bold text-xs hover:bg-[#0073af] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In / Create Account</span>
          </button>
        )}
        <span className="text-[10px] text-[#64748b]">
          TravelMate AI Studio • Multi-Currency &amp; Worldwide Destinations Edition
        </span>
      </div>

      {/* ==================== STICKY BOTTOM SAVE ACTION BAR WHEN EDITING ==================== */}
      {isEditing && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md p-3 border-t border-[#e2e8f0] shadow-lg z-50 flex items-center justify-between max-w-xl mx-auto gap-3">
          <button
            onClick={handleDiscardChanges}
            className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-[#475569] font-bold text-xs hover:bg-[#e2e8f0] transition-all"
            type="button"
          >
            Cancel / Discard
          </button>
          <button
            onClick={handleSaveChanges}
            className="flex-1 py-2.5 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-md hover:bg-[#0073af] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save All Changes</span>
          </button>
        </div>
      )}

      {/* ==================== AVATAR SELECTOR MODAL ==================== */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-xl border border-[#e2e8f0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194] text-[20px]">
                  account_box
                </span>
                <h3 className="text-sm font-bold text-[#131b2e]">Choose Profile Avatar</h3>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Option to have No Profile Photo (Use Clean Initials) */}
            <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#004d77] to-[#0284c7] text-white font-bold text-sm flex items-center justify-center ring-2 ring-white shadow-xs">
                  {name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">No Profile Photo</span>
                  <span className="text-[10px] text-[#64748b]">Display your clean initials &ldquo;{name.substring(0, 2).toUpperCase()}&rdquo;</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAvatar('');
                  setIsAvatarModalOpen(false);
                  onShowToast('Switched to clean initials badge (no photo).');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !avatar
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {!avatar ? 'Current' : 'Use Initials'}
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#64748b]">Optional Traveler Photos</span>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      setAvatar(av.url);
                      setIsAvatarModalOpen(false);
                      onShowToast(`Selected ${av.name} avatar!`);
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      avatar === av.url
                        ? 'border-[#006194] bg-[#e0f2fe]/40 ring-2 ring-[#006194]'
                        : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
                    }`}
                    type="button"
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-12 h-12 rounded-full object-cover shadow-2xs mb-1"
                    />
                    <span className="text-[10px] font-bold text-[#131b2e] truncate max-w-full">
                      {av.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload File option */}
            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
              <span className="text-[11px] font-bold text-[#131b2e] block">
                Upload from Camera or Device
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs hover:bg-[#0073af] flex items-center justify-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">file_upload</span>
                <span>Select Image File</span>
              </button>
            </div>

            {/* Custom URL input */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#64748b]">Or Paste Image URL</span>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="flex-1 px-3 py-1.5 text-xs text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                />
                <button
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setAvatar(customAvatarUrl.trim());
                      setCustomAvatarUrl('');
                      setIsAvatarModalOpen(false);
                      onShowToast('Custom photo URL applied!');
                    }
                  }}
                  className="px-3 py-1.5 bg-[#e2e7ff] text-[#131b2e] text-xs font-bold rounded-xl hover:bg-[#dae2fd]"
                  type="button"
                >
                  Use URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD CREW MEMBER MODAL ==================== */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-[#e2e8f0] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006194] text-[20px]">
                  group_add
                </span>
                <h3 className="text-sm font-bold text-[#131b2e]">Add Travel Companion</h3>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCrewMember} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Phone Number (Mobile / WhatsApp) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#006194]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="priya@travel.co"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Trip Role / Archetype
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                >
                  <option value="Traveler">Traveler</option>
                  <option value="Co-Pilot">Co-Pilot &amp; Navigator</option>
                  <option value="Foodie Guide">Foodie &amp; Dining Scout</option>
                  <option value="Photographer">Trip Photographer</option>
                  <option value="Ledger Keeper">Ledger &amp; Split Keeper</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold text-xs hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-xs hover:bg-[#0073af]"
                >
                  Add Companion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006194]/10 text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">Change Password</h3>
                  <p className="text-[10px] text-[#64748b]">Update your account security credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!currentPasswordInput) {
                  onShowToast('Please enter your current password.');
                  return;
                }
                if (!newPasswordInput || newPasswordInput.length < 6) {
                  onShowToast('New password must be at least 6 characters.');
                  return;
                }
                if (newPasswordInput !== confirmNewPasswordInput) {
                  onShowToast('New passwords do not match.');
                  return;
                }

                setPasswordChangeLoading(true);
                try {
                  await changePasswordApi(currentPasswordInput, newPasswordInput);
                  onShowToast('✓ Password updated successfully in database.');
                  setIsChangePasswordOpen(false);
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmNewPasswordInput('');
                } catch (err: any) {
                  onShowToast(`❌ ${err.message || 'Failed to change password'}`);
                } finally {
                  setPasswordChangeLoading(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  New Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPasswordInput}
                  onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold text-xs hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="flex-1 py-2 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-xs hover:bg-[#0073af] active:scale-95 transition-all disabled:opacity-50"
                >
                  {passwordChangeLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== QUICK EDIT USER PHONE MODAL ==================== */}
      {isEditingUserPhoneModal && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006194]/10 text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">Your Phone Number</h3>
                  <p className="text-[10px] text-[#64748b]">Add or update your contact / WhatsApp number</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingUserPhoneModal(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuickUpdateUserPhone();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#006194]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={userPhoneModalInput}
                    onChange={(e) => setUserPhoneModalInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">
                  This phone number will be attached to your profile and visible to your travel crew.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingUserPhoneModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold text-xs hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-xs hover:bg-[#0073af] active:scale-95 transition-all"
                >
                  Save Phone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
