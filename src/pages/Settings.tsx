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
    <div className="min-h-full text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>

        <Tabs defaultValue="hotel-profile">
          <TabsList className="mb-6 border border-vesta-navy/10 bg-white">
            <TabsTrigger
              value="hotel-profile"
              className="text-slate-600 data-[state=active]:bg-vesta-gold/15 data-[state=active]:text-vesta-navy"
            >
              Hotel Profile
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="text-slate-600 data-[state=active]:bg-vesta-gold/15 data-[state=active]:text-vesta-navy"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* ── Hotel Profile Tab ── */}
          <TabsContent value="hotel-profile">
            <div className="space-y-5 rounded-xl border border-vesta-navy/10 bg-white p-6 shadow-sm">
              {profileLoading ? (
                <p className="text-sm text-slate-600">Loading hotel data…</p>
              ) : (
                <>
                  {/* Hotel Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-600">Hotel Name</label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-600">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                    />
                  </div>

                  {/* Number of Rooms */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-600">Number of Rooms</label>
                    <input
                      type="number"
                      min={0}
                      value={roomCount}
                      onChange={(e) =>
                        setRoomCount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-600">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
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
                    <label className="text-sm text-slate-600">PMS Provider</label>
                    <input
                      type="text"
                      value={pmsProvider}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                    <p className="text-xs text-slate-500">Contact support to change your PMS provider.</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="rounded-lg bg-vesta-gold px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-vesta-gold/90 disabled:opacity-60"
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
            <div className="space-y-5 rounded-xl border border-vesta-navy/10 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Profile</h2>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-600">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-600">Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </div>
            </div>

            {/* Change password */}
            <div className="space-y-5 rounded-xl border border-vesta-navy/10 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Change Password</h2>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-600">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-600">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-600">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-vesta-gold/35"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="rounded-lg bg-vesta-gold px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-vesta-gold/90 disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>

            {/* Sign out */}
            <div className="rounded-xl border border-vesta-navy/10 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Session</h2>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
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
