import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── Hotel Profile state ──────────────────────────────────────────────────
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState('');
  const [city, setCity] = useState('');
  const [roomCount, setRoomCount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [pmsProvider, setPmsProvider] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Account state ────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Load hotel data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const loadHotel = async () => {
      setProfileLoading(true);
      try {
        const { data: member } = await supabase
          .from('hotel_members')
          .select('hotel_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!member?.hotel_id) return;

        const { data: hotel } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', member.hotel_id)
          .maybeSingle();

        if (hotel) {
          setHotelId(hotel.id);
          setHotelName(hotel.name ?? '');
          setCity(hotel.city ?? '');
          setRoomCount(hotel.room_count ?? '');
          setCurrency(hotel.currency ?? 'USD');
          setPmsProvider(hotel.pms_provider ?? '');
        }
      } catch {
        toast({ title: 'Failed to load hotel data', variant: 'destructive' });
      } finally {
        setProfileLoading(false);
      }
    };

    loadHotel();
  }, [user]);

  // ── Save hotel profile ───────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!hotelId) return;
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          name: hotelName,
          city,
          room_count: roomCount === '' ? null : Number(roomCount),
          currency,
        })
        .eq('id', hotelId);

      if (error) throw error;
      toast({ title: 'Hotel profile saved.' });
    } catch {
      toast({ title: 'Failed to save hotel profile', variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'You';

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <Tabs defaultValue="hotel-profile">
          <TabsList className="bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger
              value="hotel-profile"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400"
            >
              Hotel Profile
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* ── Hotel Profile Tab ── */}
          <TabsContent value="hotel-profile">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
              {profileLoading ? (
                <p className="text-slate-400 text-sm">Loading hotel data…</p>
              ) : (
                <>
                  {/* Hotel Name */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-sm">Hotel Name</label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-sm">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  {/* Number of Rooms */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-sm">Number of Rooms</label>
                    <input
                      type="number"
                      min={0}
                      value={roomCount}
                      onChange={(e) =>
                        setRoomCount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-sm">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="AED">AED — UAE Dirham</option>
                      <option value="SGD">SGD — Singapore Dollar</option>
                    </select>
                  </div>

                  {/* PMS Provider (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-sm">PMS Provider</label>
                    <input
                      type="text"
                      value={pmsProvider}
                      readOnly
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                    />
                    <p className="text-slate-500 text-xs">Contact support to change your PMS provider.</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
                  >
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Account Tab ── */}
          <TabsContent value="account" className="space-y-4">
            {/* Profile info */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Profile</h2>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-sm">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  readOnly
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-sm">Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Change password */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Change Password</h2>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-sm">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-sm">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-sm">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>

            {/* Sign out */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-base font-semibold text-white mb-3">Session</h2>
              <button
                onClick={handleSignOut}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
