import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Users, UserPlus, Trash2, Crown, Shield, Eye } from 'lucide-react'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelMember {
  id: string
  hotel_id: string
  user_id: string
  role: string
  invited_by: string | null
  created_at: string
}

type InviteRole = 'manager' | 'viewer'

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: Crown,
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
} as const

type KnownRole = keyof typeof ROLE_CONFIG

function getRoleConfig(role: string) {
  return ROLE_CONFIG[role as KnownRole] ?? ROLE_CONFIG.viewer
}

function abbreviateUuid(uuid: string): string {
  return uuid.slice(-8)
}

// ─── Member row skeleton ──────────────────────────────────────────────────────

function MemberSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-700" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 bg-gray-700 rounded" />
          <div className="h-3 w-24 bg-gray-700/60 rounded" />
        </div>
      </div>
      <div className="h-6 w-20 bg-gray-700 rounded-full" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Team() {
  const { hotelId } = useHotelDashboard()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('viewer')

  // ── Query: fetch members ───────────────────────────────────────────────────
  const { data: members = [], isLoading: membersLoading } = useQuery<HotelMember[]>({
    queryKey: ['hotel_members', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      const { data, error } = await supabase
        .from('hotel_members')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as HotelMember[]
    },
    enabled: !!hotelId,
  })

  // ── Mutation: remove member ────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('hotel_members')
        .delete()
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_members', hotelId] })
      toast.success('Team member removed.')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to remove member.')
    },
  })

  // ── Mutation: send invite ──────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: InviteRole }) => {
      const { error } = await supabase.functions.invoke('invite-team-member', {
        body: { hotelId, email, role },
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      toast.success(`Invite sent to ${variables.email}`)
      setInviteEmail('')
      setInviteRole('viewer')
      queryClient.invalidateQueries({ queryKey: ['hotel_members', hotelId] })
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to send invite.')
    },
  })

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inviteEmail.trim()
    if (!trimmed) {
      toast.error('Please enter an email address.')
      return
    }
    if (!hotelId) {
      toast.error('Hotel not found.')
      return
    }
    inviteMutation.mutate({ email: trimmed, role: inviteRole })
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Team</h1>
        <p className="text-slate-400 mt-1">
          Manage who has access to your hotel's Vesta workspace.
        </p>
      </div>

      {/* ── Section 1: Current Members ──────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Members
        </h2>

        {membersLoading ? (
          <Card className="bg-gray-800/50 border-gray-700 divide-y divide-gray-700">
            {[1, 2, 3].map((i) => (
              <MemberSkeleton key={i} />
            ))}
          </Card>
        ) : members.length === 0 ? (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="py-10 text-center">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No team members found.</p>
              <p className="text-slate-500 text-sm mt-1">
                Invite someone below to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-700/60">
              {members.map((member) => {
                const cfg = getRoleConfig(member.role)
                const RoleIcon = cfg.icon
                const isCurrentUser = member.user_id === user?.id
                const isOwner = member.role === 'owner'

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-700/20 transition-colors"
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        <RoleIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white font-mono">
                            …{abbreviateUuid(member.user_id)}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-slate-500">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Right: role badge + remove */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`text-xs border ${cfg.badge}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </Badge>

                      {!isOwner && !isCurrentUser && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300 h-7 px-2"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(member.id)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* ── Section 2: Invite New Member ────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite New Member
        </h2>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base font-medium text-white">
              Send an invitation
            </CardTitle>
            <p className="text-slate-400 text-sm mt-0.5">
              The recipient will receive an email with a link to join your workspace.
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-slate-500 focus:border-amber-500/60 focus:ring-amber-500/20 flex-1"
                required
                disabled={inviteMutation.isPending}
              />

              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as InviteRole)}
                disabled={inviteMutation.isPending}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-full sm:w-36 focus:border-amber-500/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="manager" className="focus:bg-gray-800 focus:text-white">
                    Manager
                  </SelectItem>
                  <SelectItem value="viewer" className="focus:bg-gray-800 focus:text-white">
                    Viewer
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail.trim() || !hotelId}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold shrink-0 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3: Role Guide ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
          Role Guide
        </h2>

        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Owner */}
              <div className="flex gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Owner</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Full access to all features including billing management and hotel deletion.
                    Automatically assigned to the account creator.
                  </p>
                </div>
              </div>

              {/* Manager */}
              <div className="flex gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Manager</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Can view and edit all data, manage integrations, and invite new members.
                    Cannot access billing or delete the hotel.
                  </p>
                </div>
              </div>

              {/* Viewer */}
              <div className="flex gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Viewer</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Read-only access to the dashboard and reports. Cannot edit data or
                    change any settings.
                  </p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
