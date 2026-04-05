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
    badge: 'border border-amber-200 bg-amber-50 text-amber-900',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    badge: 'border border-blue-200 bg-blue-50 text-blue-900',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    badge: 'border border-vesta-navy/10 bg-vesta-mist/40 text-vesta-navy/90',
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
        <div className="h-9 w-9 rounded-full bg-vesta-mist/50" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 rounded bg-vesta-mist/50" />
          <div className="h-3 w-24 rounded bg-vesta-mist/40" />
        </div>
      </div>
      <div className="h-6 w-20 rounded-full bg-vesta-mist/50" />
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
    <div className="min-h-full space-y-8 p-6 text-vesta-navy">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-vesta-navy">Team</h1>
        <p className="mt-1 text-vesta-navy/80">
          Manage who has access to your hotel's Vesta workspace.
        </p>
      </div>

      {/* ── Section 1: Current Members ──────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-vesta-navy/80">
          <Users className="h-4 w-4" />
          Members
        </h2>

        {membersLoading ? (
          <Card className="divide-y divide-vesta-navy/10 border border-vesta-navy/10 bg-white shadow-sm">
            {[1, 2, 3].map((i) => (
              <MemberSkeleton key={i} />
            ))}
          </Card>
        ) : members.length === 0 ? (
          <Card className="border border-vesta-navy/10 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-vesta-navy-muted" />
              <p className="text-vesta-navy/80">No team members found.</p>
              <p className="text-vesta-navy/65 text-sm mt-1">
                Invite someone below to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-vesta-navy/10 bg-white shadow-sm">
            <div className="divide-y divide-vesta-navy/10">
              {members.map((member) => {
                const cfg = getRoleConfig(member.role)
                const RoleIcon = cfg.icon
                const isCurrentUser = member.user_id === user?.id
                const isOwner = member.role === 'owner'

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-vesta-mist/25"
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-vesta-navy/10 bg-vesta-mist/40">
                        <RoleIcon className="h-4 w-4 text-vesta-navy/80" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-vesta-navy">
                            …{abbreviateUuid(member.user_id)}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-vesta-navy/65">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-vesta-navy/65 mt-0.5">
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
                          className="h-7 border-red-200 px-2 text-red-700 hover:border-red-300 hover:bg-red-50"
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
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-vesta-navy/80">
          <UserPlus className="h-4 w-4" />
          Invite New Member
        </h2>

        <Card className="border border-vesta-navy/10 bg-white shadow-sm">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="text-base font-medium text-vesta-navy">
              Send an invitation
            </CardTitle>
            <p className="mt-0.5 text-sm text-vesta-navy/80">
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
                className="flex-1 border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                required
                disabled={inviteMutation.isPending}
              />

              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as InviteRole)}
                disabled={inviteMutation.isPending}
              >
                <SelectTrigger className="w-full border-vesta-navy/10 bg-white text-vesta-navy sm:w-36 focus:border-vesta-gold/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-vesta-navy/10 bg-white text-vesta-navy">
                  <SelectItem value="manager" className="focus:bg-vesta-mist/40 focus:text-vesta-navy">
                    Manager
                  </SelectItem>
                  <SelectItem value="viewer" className="focus:bg-vesta-mist/40 focus:text-vesta-navy">
                    Viewer
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail.trim() || !hotelId}
                className="shrink-0 bg-vesta-gold font-semibold text-vesta-navy hover:bg-vesta-gold/90 disabled:opacity-50"
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
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-vesta-navy/80">
          Role Guide
        </h2>

        <Card className="border border-vesta-navy/10 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Owner */}
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vesta-gold/15">
                  <Crown className="h-4 w-4 text-vesta-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium text-vesta-navy">Owner</p>
                  <p className="mt-1 text-xs leading-relaxed text-vesta-navy/80">
                    Full access to all features including billing management and hotel deletion.
                    Automatically assigned to the account creator.
                  </p>
                </div>
              </div>

              {/* Manager */}
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-vesta-navy">Manager</p>
                  <p className="mt-1 text-xs leading-relaxed text-vesta-navy/80">
                    Can view and edit all data, manage integrations, and invite new members.
                    Cannot access billing or delete the hotel.
                  </p>
                </div>
              </div>

              {/* Viewer */}
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vesta-mist/40">
                  <Eye className="h-4 w-4 text-vesta-navy/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-vesta-navy">Viewer</p>
                  <p className="mt-1 text-xs leading-relaxed text-vesta-navy/80">
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
