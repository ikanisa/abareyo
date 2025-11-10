export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string | null
          id: string
          last_seen_at: string | null
          revoked: boolean
          token_hash: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          revoked?: boolean
          token_hash: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          revoked?: boolean
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          display_name: string | null
          email: string
          id: string
          last_login: string | null
          password_hash: string
          status: string | null
        }
        Insert: {
          display_name?: string | null
          email: string
          id?: string
          last_login?: string | null
          password_hash: string
          status?: string | null
        }
        Update: {
          display_name?: string | null
          email?: string
          id?: string
          last_login?: string | null
          password_hash?: string
          status?: string | null
        }
        Relationships: []
      }
      admin_users_roles: {
        Row: {
          admin_user_id: string
          role_id: string
        }
        Insert: {
          admin_user_id: string
          role_id: string
        }
        Update: {
          admin_user_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_roles_admin_user_id_fkey"
            columns: ["admin_user_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_roles_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      AdminAction: {
        Row: {
          action: string
          actorId: string | null
          createdAt: string
          details: Json | null
          id: string
          targetId: string
          targetType: string
        }
        Insert: {
          action: string
          actorId?: string | null
          createdAt?: string
          details?: Json | null
          id?: string
          targetId: string
          targetType: string
        }
        Update: {
          action?: string
          actorId?: string | null
          createdAt?: string
          details?: Json | null
          id?: string
          targetId?: string
          targetType?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminAction_actorId_fkey"
            columns: ["actorId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AdminRole: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      AdminSession: {
        Row: {
          adminUserId: string
          createdAt: string
          expiresAt: string | null
          id: string
          ip: string | null
          revoked: boolean
          userAgent: string | null
        }
        Insert: {
          adminUserId: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          ip?: string | null
          revoked?: boolean
          userAgent?: string | null
        }
        Update: {
          adminUserId?: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          ip?: string | null
          revoked?: boolean
          userAgent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AdminSession_adminUserId_fkey"
            columns: ["adminUserId"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      AdminUser: {
        Row: {
          createdAt: string
          displayName: string
          email: string
          id: string
          lastLoginAt: string | null
          passwordHash: string
          status: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          displayName: string
          email: string
          id?: string
          lastLoginAt?: string | null
          passwordHash: string
          status?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          displayName?: string
          email?: string
          id?: string
          lastLoginAt?: string | null
          passwordHash?: string
          status?: string
          updatedAt?: string
        }
        Relationships: []
      }
      AdminUsersOnRoles: {
        Row: {
          adminUserId: string
          assignedAt: string
          roleId: string
        }
        Insert: {
          adminUserId: string
          assignedAt?: string
          roleId: string
        }
        Update: {
          adminUserId?: string
          assignedAt?: string
          roleId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminUsersOnRoles_adminUserId_fkey"
            columns: ["adminUserId"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AdminUsersOnRoles_roleId_fkey"
            columns: ["roleId"]
            referencedRelation: "AdminRole"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          admin_user_id: string | null
          after: Json | null
          at: string | null
          before: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: string | null
          ua: string | null
        }
        Insert: {
          action?: string | null
          admin_user_id?: string | null
          after?: Json | null
          at?: string | null
          before?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          ua?: string | null
        }
        Update: {
          action?: string | null
          admin_user_id?: string | null
          after?: Json | null
          at?: string | null
          before?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          ua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      AuditLog: {
        Row: {
          action: string
          adminUserId: string | null
          after: Json | null
          at: string
          before: Json | null
          entityId: string | null
          entityType: string
          id: string
          ip: string | null
          userAgent: string | null
        }
        Insert: {
          action: string
          adminUserId?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entityId?: string | null
          entityType: string
          id?: string
          ip?: string | null
          userAgent?: string | null
        }
        Update: {
          action?: string
          adminUserId?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entityId?: string | null
          entityType?: string
          id?: string
          ip?: string | null
          userAgent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_adminUserId_fkey"
            columns: ["adminUserId"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          created_at: string | null
          id: string
          media_url: string | null
          status: string | null
          text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_url?: string | null
          status?: string | null
          text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          media_url?: string | null
          status?: string | null
          text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          kind: string
          media_url: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          kind: string
          media_url?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          media_url?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      fan_clubs: {
        Row: {
          city: string | null
          id: string
          members: number
          name: string
        }
        Insert: {
          city?: string | null
          id?: string
          members?: number
          name: string
        }
        Update: {
          city?: string | null
          id?: string
          members?: number
          name?: string
        }
        Relationships: []
      }
      fan_posts: {
        Row: {
          comments: number
          created_at: string
          id: string
          likes: number
          media_url: string | null
          text: string | null
          user_id: string | null
        }
        Insert: {
          comments?: number
          created_at?: string
          id?: string
          likes?: number
          media_url?: string | null
          text?: string | null
          user_id?: string | null
        }
        Update: {
          comments?: number
          created_at?: string
          id?: string
          likes?: number
          media_url?: string | null
          text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      FanClub: {
        Row: {
          bio: string | null
          id: string
          isOfficial: boolean
          name: string
          region: string | null
        }
        Insert: {
          bio?: string | null
          id?: string
          isOfficial?: boolean
          name: string
          region?: string | null
        }
        Update: {
          bio?: string | null
          id?: string
          isOfficial?: boolean
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      FanClubMember: {
        Row: {
          fanClubId: string
          joinedAt: string
          role: string
          userId: string
        }
        Insert: {
          fanClubId: string
          joinedAt?: string
          role?: string
          userId: string
        }
        Update: {
          fanClubId?: string
          joinedAt?: string
          role?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FanClubMember_fanClubId_fkey"
            columns: ["fanClubId"]
            referencedRelation: "FanClub"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FanClubMember_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      FanSession: {
        Row: {
          createdAt: string
          expiresAt: string | null
          id: string
          ip: string | null
          revoked: boolean
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt?: string | null
          id?: string
          ip?: string | null
          revoked?: boolean
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string | null
          id?: string
          ip?: string | null
          revoked?: boolean
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FanSession_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      FeatureFlag: {
        Row: {
          description: string | null
          key: string
          updatedAt: string
          updatedById: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updatedAt?: string
          updatedById?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updatedAt?: string
          updatedById?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "FeatureFlag_updatedById_fkey"
            columns: ["updatedById"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_donations: {
        Row: {
          amount: number | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fund_projects: {
        Row: {
          goal: number | null
          id: string
          progress: number | null
          title: string | null
        }
        Insert: {
          goal?: number | null
          id?: string
          progress?: number | null
          title?: string | null
        }
        Update: {
          goal?: number | null
          id?: string
          progress?: number | null
          title?: string | null
        }
        Relationships: []
      }
      FundDonation: {
        Row: {
          amount: number
          createdAt: string
          id: string
          projectId: string
          status: Database["public"]["Enums"]["PaymentStatus"]
          userId: string | null
        }
        Insert: {
          amount: number
          createdAt?: string
          id?: string
          projectId: string
          status?: Database["public"]["Enums"]["PaymentStatus"]
          userId?: string | null
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          projectId?: string
          status?: Database["public"]["Enums"]["PaymentStatus"]
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FundDonation_projectId_fkey"
            columns: ["projectId"]
            referencedRelation: "FundProject"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FundDonation_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      FundProject: {
        Row: {
          coverImage: string | null
          createdAt: string
          description: string | null
          goal: number
          id: string
          progress: number
          status: string
          title: string
        }
        Insert: {
          coverImage?: string | null
          createdAt?: string
          description?: string | null
          goal: number
          id?: string
          progress?: number
          status?: string
          title: string
        }
        Update: {
          coverImage?: string | null
          createdAt?: string
          description?: string | null
          goal?: number
          id?: string
          progress?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      gamification_events: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          kind: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          kind?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          kind?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: []
      }
      GamificationEvent: {
        Row: {
          context: Json | null
          id: string
          kind: Database["public"]["Enums"]["GamificationKind"]
          occurredAt: string
          userId: string
          value: number
        }
        Insert: {
          context?: Json | null
          id?: string
          kind: Database["public"]["Enums"]["GamificationKind"]
          occurredAt?: string
          userId: string
          value: number
        }
        Update: {
          context?: Json | null
          id?: string
          kind?: Database["public"]["Enums"]["GamificationKind"]
          occurredAt?: string
          userId?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "GamificationEvent_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      GateScan: {
        Row: {
          createdAt: string
          id: string
          passId: string
          result: string
          stewardId: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          passId: string
          result: string
          stewardId?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          passId?: string
          result?: string
          stewardId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "GateScan_passId_fkey"
            columns: ["passId"]
            referencedRelation: "TicketPass"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_quotes: {
        Row: {
          created_at: string
          id: string
          moto_type: string | null
          plate: string | null
          premium: number
          ref: string | null
          status: Database["public"]["Enums"]["insurance_status"]
          ticket_perk: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          moto_type?: string | null
          plate?: string | null
          premium: number
          ref?: string | null
          status?: Database["public"]["Enums"]["insurance_status"]
          ticket_perk?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          moto_type?: string | null
          plate?: string | null
          premium?: number
          ref?: string | null
          status?: Database["public"]["Enums"]["insurance_status"]
          ticket_perk?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_quotes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_quotes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Leaderboard: {
        Row: {
          period: Database["public"]["Enums"]["LeaderboardPeriod"]
          points: number
          rank: number
          snapshotAt: string
          userId: string
        }
        Insert: {
          period: Database["public"]["Enums"]["LeaderboardPeriod"]
          points: number
          rank: number
          snapshotAt?: string
          userId: string
        }
        Update: {
          period?: Database["public"]["Enums"]["LeaderboardPeriod"]
          points?: number
          rank?: number
          snapshotAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Leaderboard_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          period: string
          points: number | null
          user_id: string
        }
        Insert: {
          period: string
          points?: number | null
          user_id: string
        }
        Update: {
          period?: string
          points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      Match: {
        Row: {
          competition: string | null
          createdAt: string
          id: string
          kickoff: string
          opponent: string
          status: Database["public"]["Enums"]["MatchStatus"]
          venue: string
        }
        Insert: {
          competition?: string | null
          createdAt?: string
          id?: string
          kickoff: string
          opponent: string
          status?: Database["public"]["Enums"]["MatchStatus"]
          venue: string
        }
        Update: {
          competition?: string | null
          createdAt?: string
          id?: string
          kickoff?: string
          opponent?: string
          status?: Database["public"]["Enums"]["MatchStatus"]
          venue?: string
        }
        Relationships: []
      }
      match_gates: {
        Row: {
          created_at: string
          id: string
          location: string | null
          match_id: string
          max_throughput: number | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          match_id: string
          max_throughput?: number | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          match_id?: string
          max_throughput?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_gates_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_zones: {
        Row: {
          capacity: number
          created_at: string
          default_gate: string | null
          id: string
          match_id: string
          name: string
          price: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          default_gate?: string | null
          id?: string
          match_id: string
          name: string
          price?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          default_gate?: string | null
          id?: string
          match_id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_zones_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          blue_price: number | null
          id: string
          kickoff: string
          opponent: string | null
          regular_price: number | null
          seats_blue: number | null
          seats_regular: number | null
          seats_vip: number | null
          status: Database["public"]["Enums"]["match_status"]
          venue: string | null
          vip_price: number | null
        }
        Insert: {
          blue_price?: number | null
          id?: string
          kickoff: string
          opponent?: string | null
          regular_price?: number | null
          seats_blue?: number | null
          seats_regular?: number | null
          seats_vip?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
          vip_price?: number | null
        }
        Update: {
          blue_price?: number | null
          id?: string
          kickoff?: string
          opponent?: string | null
          regular_price?: number | null
          seats_blue?: number | null
          seats_regular?: number | null
          seats_vip?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
          vip_price?: number | null
        }
        Relationships: []
      }
      MatchGate: {
        Row: {
          createdAt: string
          id: string
          location: string | null
          matchId: string
          maxThroughput: number | null
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          location?: string | null
          matchId: string
          maxThroughput?: number | null
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          location?: string | null
          matchId?: string
          maxThroughput?: number | null
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "MatchGate_matchId_fkey"
            columns: ["matchId"]
            referencedRelation: "Match"
            referencedColumns: ["id"]
          },
        ]
      }
      Membership: {
        Row: {
          autoRenew: boolean
          createdAt: string
          expiresAt: string | null
          id: string
          planId: string
          startedAt: string | null
          status: Database["public"]["Enums"]["MembershipStatus"]
          userId: string
        }
        Insert: {
          autoRenew?: boolean
          createdAt?: string
          expiresAt?: string | null
          id?: string
          planId: string
          startedAt?: string | null
          status?: Database["public"]["Enums"]["MembershipStatus"]
          userId: string
        }
        Update: {
          autoRenew?: boolean
          createdAt?: string
          expiresAt?: string | null
          id?: string
          planId?: string
          startedAt?: string | null
          status?: Database["public"]["Enums"]["MembershipStatus"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Membership_planId_fkey"
            columns: ["planId"]
            referencedRelation: "MembershipPlan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Membership_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          id: string
          name: string | null
          perks: Json | null
          price: number | null
        }
        Insert: {
          id?: string
          name?: string | null
          perks?: Json | null
          price?: number | null
        }
        Update: {
          id?: string
          name?: string | null
          perks?: Json | null
          price?: number | null
        }
        Relationships: []
      }
      MembershipPlan: {
        Row: {
          id: string
          isActive: boolean
          name: string
          perks: Json
          price: number
          slug: string
        }
        Insert: {
          id?: string
          isActive?: boolean
          name: string
          perks: Json
          price: number
          slug: string
        }
        Update: {
          id?: string
          isActive?: boolean
          name?: string
          perks?: Json
          price?: number
          slug?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          expires_at: string | null
          id: string
          plan_id: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          createdAt: string
          fulfilledAt: string | null
          fulfillmentNotes: Json | null
          id: string
          shippingAddress: Json | null
          status: string
          total: number
          trackingNumber: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string
          fulfilledAt?: string | null
          fulfillmentNotes?: Json | null
          id?: string
          shippingAddress?: Json | null
          status?: string
          total: number
          trackingNumber?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string
          fulfilledAt?: string | null
          fulfillmentNotes?: Json | null
          id?: string
          shippingAddress?: Json | null
          status?: string
          total?: number
          trackingNumber?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Order_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          qty: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          qty: number
        }
        Update: {
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderItem: {
        Row: {
          id: string
          orderId: string
          price: number
          productId: string
          qty: number
        }
        Insert: {
          id?: string
          orderId: string
          price: number
          productId: string
          qty: number
        }
        Update: {
          id?: string
          orderId?: string
          price?: number
          productId?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderId_fkey"
            columns: ["orderId"]
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_productId_fkey"
            columns: ["productId"]
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          momo_ref: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          momo_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          momo_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Payment: {
        Row: {
          amount: number
          confirmedAt: string | null
          createdAt: string
          currency: string
          donationId: string | null
          id: string
          kind: Database["public"]["Enums"]["PaymentKind"]
          membershipId: string | null
          metadata: Json | null
          orderId: string | null
          smsParsedId: string | null
          status: Database["public"]["Enums"]["PaymentStatus"]
        }
        Insert: {
          amount: number
          confirmedAt?: string | null
          createdAt?: string
          currency?: string
          donationId?: string | null
          id?: string
          kind: Database["public"]["Enums"]["PaymentKind"]
          membershipId?: string | null
          metadata?: Json | null
          orderId?: string | null
          smsParsedId?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
        }
        Update: {
          amount?: number
          confirmedAt?: string | null
          createdAt?: string
          currency?: string
          donationId?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["PaymentKind"]
          membershipId?: string | null
          metadata?: Json | null
          orderId?: string | null
          smsParsedId?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "Payment_donationId_fkey"
            columns: ["donationId"]
            referencedRelation: "FundDonation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payment_membershipId_fkey"
            columns: ["membershipId"]
            referencedRelation: "Membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payment_orderId_fkey"
            columns: ["orderId"]
            referencedRelation: "TicketOrder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payment_smsParsedId_fkey"
            columns: ["smsParsedId"]
            referencedRelation: "SmsParsed"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          donation_id: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          membership_id: string | null
          metadata: Json | null
          order_id: string | null
          sms_parsed_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          ticket_order_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          donation_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          membership_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          sms_parsed_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          ticket_order_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          donation_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          membership_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          sms_parsed_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          ticket_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sms_parsed_id_fkey"
            columns: ["sms_parsed_id"]
            referencedRelation: "sms_parsed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_ticket_order_id_fkey"
            columns: ["ticket_order_id"]
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      Permission: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          key: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          description: string | null
          id: string
          key: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          free_ticket_issued: boolean
          id: string
          number: string
          quote_id: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          free_ticket_issued?: boolean
          id?: string
          number: string
          quote_id?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          free_ticket_issued?: boolean
          id?: string
          number?: string
          quote_id?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "insurance_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      Poll: {
        Row: {
          authorId: string | null
          createdAt: string
          id: string
          postId: string | null
          question: string
        }
        Insert: {
          authorId?: string | null
          createdAt?: string
          id?: string
          postId?: string | null
          question: string
        }
        Update: {
          authorId?: string | null
          createdAt?: string
          id?: string
          postId?: string | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "Poll_authorId_fkey"
            columns: ["authorId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Poll_postId_fkey"
            columns: ["postId"]
            referencedRelation: "Post"
            referencedColumns: ["id"]
          },
        ]
      }
      PollOption: {
        Row: {
          id: string
          label: string
          pollId: string
        }
        Insert: {
          id?: string
          label: string
          pollId: string
        }
        Update: {
          id?: string
          label?: string
          pollId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PollOption_pollId_fkey"
            columns: ["pollId"]
            referencedRelation: "Poll"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          active: boolean
          id: string
          options: Json
          question: string
          results: Json
        }
        Insert: {
          active?: boolean
          id?: string
          options: Json
          question: string
          results?: Json
        }
        Update: {
          active?: boolean
          id?: string
          options?: Json
          question?: string
          results?: Json
        }
        Relationships: []
      }
      PollVote: {
        Row: {
          createdAt: string
          id: string
          optionId: string
          pollId: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          optionId: string
          pollId: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          optionId?: string
          pollId?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PollVote_optionId_fkey"
            columns: ["optionId"]
            referencedRelation: "PollOption"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PollVote_pollId_fkey"
            columns: ["pollId"]
            referencedRelation: "Poll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PollVote_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Post: {
        Row: {
          authorId: string
          content: string
          createdAt: string
          id: string
          media: Json | null
          status: string
          visibility: string
        }
        Insert: {
          authorId: string
          content: string
          createdAt?: string
          id?: string
          media?: Json | null
          status?: string
          visibility?: string
        }
        Update: {
          authorId?: string
          content?: string
          createdAt?: string
          id?: string
          media?: Json | null
          status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "Post_authorId_fkey"
            columns: ["authorId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PostReaction: {
        Row: {
          createdAt: string
          kind: string
          postId: string
          userId: string
        }
        Insert: {
          createdAt?: string
          kind?: string
          postId: string
          userId: string
        }
        Update: {
          createdAt?: string
          kind?: string
          postId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PostReaction_postId_fkey"
            columns: ["postId"]
            referencedRelation: "Post"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PostReaction_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PredictionFixture: {
        Row: {
          createdAt: string
          deadline: string
          id: string
          matchId: string
          question: string
          rewardPoints: number
        }
        Insert: {
          createdAt?: string
          deadline: string
          id?: string
          matchId: string
          question: string
          rewardPoints?: number
        }
        Update: {
          createdAt?: string
          deadline?: string
          id?: string
          matchId?: string
          question?: string
          rewardPoints?: number
        }
        Relationships: [
          {
            foreignKeyName: "PredictionFixture_matchId_fkey"
            columns: ["matchId"]
            referencedRelation: "Match"
            referencedColumns: ["id"]
          },
        ]
      }
      Product: {
        Row: {
          category: string | null
          createdAt: string
          id: string
          images: Json
          isActive: boolean
          name: string
          price: number
          slug: string
          stock: number
        }
        Insert: {
          category?: string | null
          createdAt?: string
          id?: string
          images: Json
          isActive?: boolean
          name: string
          price: number
          slug: string
          stock: number
        }
        Update: {
          category?: string | null
          createdAt?: string
          id?: string
          images?: Json
          isActive?: boolean
          name?: string
          price?: number
          slug?: string
          stock?: number
        }
        Relationships: []
      }
      job_run_audit: {
        Row: {
          detail: Json
          environment: string
          id: number
          job_name: string
          ran_at: string
          status: string
        }
        Insert: {
          detail?: Json
          environment: string
          id?: number
          job_name: string
          ran_at?: string
          status: string
        }
        Update: {
          detail?: Json
          environment?: string
          id?: number
          job_name?: string
          ran_at?: string
          status?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          images: Json | null
          name: string | null
          price: number | null
          stock: number | null
        }
        Insert: {
          id?: string
          images?: Json | null
          name?: string | null
          price?: number | null
          stock?: number | null
        }
        Update: {
          id?: string
          images?: Json | null
          name?: string | null
          price?: number | null
          stock?: number | null
        }
        Relationships: []
      }
      products_legacy: {
        Row: {
          id: string
          images: Json | null
          name: string | null
          price: number | null
          stock: number | null
        }
        Insert: {
          id?: string
          images?: Json | null
          name?: string | null
          price?: number | null
          stock?: number | null
        }
        Update: {
          id?: string
          images?: Json | null
          name?: string | null
          price?: number | null
          stock?: number | null
        }
        Relationships: []
      }
      Quiz: {
        Row: {
          activeFrom: string
          activeUntil: string | null
          correctAnswer: string
          createdAt: string
          id: string
          prompt: string
          rewardPoints: number
        }
        Insert: {
          activeFrom?: string
          activeUntil?: string | null
          correctAnswer: string
          createdAt?: string
          id?: string
          prompt: string
          rewardPoints?: number
        }
        Update: {
          activeFrom?: string
          activeUntil?: string | null
          correctAnswer?: string
          createdAt?: string
          id?: string
          prompt?: string
          rewardPoints?: number
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          cron: string
          destination: string
          id: string
          name: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cron: string
          destination: string
          id?: string
          name: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cron?: string
          destination?: string
          id?: string
          name?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_events: {
        Row: {
          created_at: string | null
          id: string
          meta: Json | null
          points: number
          ref_id: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          points: number
          ref_id?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          points?: number
          ref_id?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      RolePermission: {
        Row: {
          grantedAt: string
          permissionId: string
          roleId: string
        }
        Insert: {
          grantedAt?: string
          permissionId: string
          roleId: string
        }
        Update: {
          grantedAt?: string
          permissionId?: string
          roleId?: string
        }
        Relationships: [
          {
            foreignKeyName: "RolePermission_permissionId_fkey"
            columns: ["permissionId"]
            referencedRelation: "Permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RolePermission_roleId_fkey"
            columns: ["roleId"]
            referencedRelation: "AdminRole"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_permissions_permission_id_fkey"
            columns: ["permission_id"]
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_permissions_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sacco_deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref: string | null
          sacco_name: string
          status: Database["public"]["Enums"]["sacco_status"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref?: string | null
          sacco_name: string
          status?: Database["public"]["Enums"]["sacco_status"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref?: string | null
          sacco_name?: string
          status?: Database["public"]["Enums"]["sacco_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sacco_deposits_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sacco_deposits_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          badge: string | null
          category: string | null
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          name: string
          price: number
          stock: number
        }
        Insert: {
          badge?: string | null
          category?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name: string
          price: number
          stock?: number
        }
        Update: {
          badge?: string | null
          category?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name?: string
          price?: number
          stock?: number
        }
        Relationships: []
      }
      shop_promotions: {
        Row: {
          created_at: string | null
          description: string | null
          discount_pct: number | null
          ends_at: string
          id: string
          product_ids: string[]
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          ends_at: string
          id?: string
          product_ids?: string[]
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          ends_at?: string
          id?: string
          product_ids?: string[]
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      sms_parsed: {
        Row: {
          amount: number
          confidence: number | null
          created_at: string | null
          currency: string | null
          id: string
          matched_entity: string | null
          payer_mask: string | null
          ref: string | null
          sms_id: string | null
        }
        Insert: {
          amount: number
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          matched_entity?: string | null
          payer_mask?: string | null
          ref?: string | null
          sms_id?: string | null
        }
        Update: {
          amount?: number
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          matched_entity?: string | null
          payer_mask?: string | null
          ref?: string | null
          sms_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_parsed_sms_id_fkey"
            columns: ["sms_id"]
            referencedRelation: "sms_raw"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_raw: {
        Row: {
          from_msisdn: string | null
          id: string
          received_at: string | null
          source: string | null
          text: string
        }
        Insert: {
          from_msisdn?: string | null
          id?: string
          received_at?: string | null
          source?: string | null
          text: string
        }
        Update: {
          from_msisdn?: string | null
          id?: string
          received_at?: string | null
          source?: string | null
          text?: string
        }
        Relationships: []
      }
      SmsParsed: {
        Row: {
          amount: number
          confidence: number
          currency: string
          id: string
          matchedEntity: string | null
          parsedPayload: Json | null
          parserVersion: string | null
          payerMask: string | null
          ref: string
          smsId: string
          timestamp: string
        }
        Insert: {
          amount: number
          confidence: number
          currency?: string
          id?: string
          matchedEntity?: string | null
          parsedPayload?: Json | null
          parserVersion?: string | null
          payerMask?: string | null
          ref: string
          smsId: string
          timestamp?: string
        }
        Update: {
          amount?: number
          confidence?: number
          currency?: string
          id?: string
          matchedEntity?: string | null
          parsedPayload?: Json | null
          parserVersion?: string | null
          payerMask?: string | null
          ref?: string
          smsId?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "SmsParsed_smsId_fkey"
            columns: ["smsId"]
            referencedRelation: "SmsRaw"
            referencedColumns: ["id"]
          },
        ]
      }
      SmsParserPrompt: {
        Row: {
          body: string
          createdAt: string
          createdById: string | null
          id: string
          isActive: boolean
          label: string
          version: number
        }
        Insert: {
          body: string
          createdAt?: string
          createdById?: string | null
          id?: string
          isActive?: boolean
          label: string
          version?: number
        }
        Update: {
          body?: string
          createdAt?: string
          createdById?: string | null
          id?: string
          isActive?: boolean
          label?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "SmsParserPrompt_createdById_fkey"
            columns: ["createdById"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      SmsRaw: {
        Row: {
          fromMsisdn: string
          id: string
          ingestStatus: Database["public"]["Enums"]["SmsIngestStatus"]
          metadata: Json
          receivedAt: string
          text: string
          toMsisdn: string | null
        }
        Insert: {
          fromMsisdn: string
          id?: string
          ingestStatus?: Database["public"]["Enums"]["SmsIngestStatus"]
          metadata: Json
          receivedAt?: string
          text: string
          toMsisdn?: string | null
        }
        Update: {
          fromMsisdn?: string
          id?: string
          ingestStatus?: Database["public"]["Enums"]["SmsIngestStatus"]
          metadata?: Json
          receivedAt?: string
          text?: string
          toMsisdn?: string | null
        }
        Relationships: []
      }
      ticket_order_items: {
        Row: {
          id: string
          order_id: string | null
          price: number
          quantity: number
          zone: Database["public"]["Enums"]["ticket_zone"]
        }
        Insert: {
          id?: string
          order_id?: string | null
          price: number
          quantity: number
          zone: Database["public"]["Enums"]["ticket_zone"]
        }
        Update: {
          id?: string
          order_id?: string | null
          price?: number
          quantity?: number
          zone?: Database["public"]["Enums"]["ticket_zone"]
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          match_id: string | null
          sms_ref: string | null
          status: Database["public"]["Enums"]["ticket_order_status"] | null
          total: number
          user_id: string | null
          ussd_code: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          match_id?: string | null
          sms_ref?: string | null
          status?: Database["public"]["Enums"]["ticket_order_status"] | null
          total: number
          user_id?: string | null
          ussd_code?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          match_id?: string | null
          sms_ref?: string | null
          status?: Database["public"]["Enums"]["ticket_order_status"] | null
          total?: number
          user_id?: string | null
          ussd_code?: string | null
        }
        Relationships: []
      }
      ticket_passes: {
        Row: {
          created_at: string | null
          gate: string | null
          id: string
          order_id: string | null
          qr_token_hash: string | null
          state: string | null
          zone: string | null
        }
        Insert: {
          created_at?: string | null
          gate?: string | null
          id?: string
          order_id?: string | null
          qr_token_hash?: string | null
          state?: string | null
          zone?: string | null
        }
        Update: {
          created_at?: string | null
          gate?: string | null
          id?: string
          order_id?: string | null
          qr_token_hash?: string | null
          state?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_passes_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      TicketOrder: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          matchId: string
          smsRef: string | null
          status: Database["public"]["Enums"]["TicketOrderStatus"]
          total: number
          userId: string | null
          ussdCode: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          matchId: string
          smsRef?: string | null
          status?: Database["public"]["Enums"]["TicketOrderStatus"]
          total: number
          userId?: string | null
          ussdCode: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          matchId?: string
          smsRef?: string | null
          status?: Database["public"]["Enums"]["TicketOrderStatus"]
          total?: number
          userId?: string | null
          ussdCode?: string
        }
        Relationships: [
          {
            foreignKeyName: "TicketOrder_matchId_fkey"
            columns: ["matchId"]
            referencedRelation: "Match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TicketOrder_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TicketOrderItem: {
        Row: {
          gate: string | null
          id: string
          orderId: string
          price: number
          quantity: number
          zone: string
        }
        Insert: {
          gate?: string | null
          id?: string
          orderId: string
          price: number
          quantity: number
          zone: string
        }
        Update: {
          gate?: string | null
          id?: string
          orderId?: string
          price?: number
          quantity?: number
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "TicketOrderItem_orderId_fkey"
            columns: ["orderId"]
            referencedRelation: "TicketOrder"
            referencedColumns: ["id"]
          },
        ]
      }
      TicketPass: {
        Row: {
          activatedAt: string | null
          consumedAt: string | null
          gate: string | null
          id: string
          orderId: string
          qrTokenHash: string
          state: Database["public"]["Enums"]["TicketPassState"]
          transferredAt: string | null
          transferredToUserId: string | null
          transferTokenHash: string | null
          updatedAt: string
          zone: string
        }
        Insert: {
          activatedAt?: string | null
          consumedAt?: string | null
          gate?: string | null
          id?: string
          orderId: string
          qrTokenHash: string
          state?: Database["public"]["Enums"]["TicketPassState"]
          transferredAt?: string | null
          transferredToUserId?: string | null
          transferTokenHash?: string | null
          updatedAt?: string
          zone: string
        }
        Update: {
          activatedAt?: string | null
          consumedAt?: string | null
          gate?: string | null
          id?: string
          orderId?: string
          qrTokenHash?: string
          state?: Database["public"]["Enums"]["TicketPassState"]
          transferredAt?: string | null
          transferredToUserId?: string | null
          transferTokenHash?: string | null
          updatedAt?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "TicketPass_orderId_fkey"
            columns: ["orderId"]
            referencedRelation: "TicketOrder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TicketPass_transferredToUserId_fkey"
            columns: ["transferredToUserId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          momo_ref: string | null
          paid: boolean | null
          price: number
          user_id: string | null
          zone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          momo_ref?: string | null
          paid?: boolean | null
          price: number
          user_id?: string | null
          zone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          momo_ref?: string | null
          paid?: boolean | null
          price?: number
          user_id?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_match_id_fkey1"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey1"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey1"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_legacy: {
        Row: {
          created_at: string
          gate: string | null
          id: string
          match_id: string | null
          momo_ref: string | null
          order_id: string | null
          paid: boolean
          price: number
          qr_token: string | null
          state: string
          updated_at: string
          user_id: string | null
          zone: Database["public"]["Enums"]["ticket_zone"]
        }
        Insert: {
          created_at?: string
          gate?: string | null
          id?: string
          match_id?: string | null
          momo_ref?: string | null
          order_id?: string | null
          paid?: boolean
          price: number
          qr_token?: string | null
          state?: string
          updated_at?: string
          user_id?: string | null
          zone: Database["public"]["Enums"]["ticket_zone"]
        }
        Update: {
          created_at?: string
          gate?: string | null
          id?: string
          match_id?: string | null
          momo_ref?: string | null
          order_id?: string | null
          paid?: boolean
          price?: number
          qr_token?: string | null
          state?: string
          updated_at?: string
          user_id?: string | null
          zone?: Database["public"]["Enums"]["ticket_zone"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      TicketZone: {
        Row: {
          capacity: number
          createdAt: string
          gate: string | null
          id: string
          matchId: string
          name: string
          price: number
          updatedAt: string
        }
        Insert: {
          capacity: number
          createdAt?: string
          gate?: string | null
          id?: string
          matchId: string
          name: string
          price: number
          updatedAt?: string
        }
        Update: {
          capacity?: number
          createdAt?: string
          gate?: string | null
          id?: string
          matchId?: string
          name?: string
          price?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TicketZone_matchId_fkey"
            columns: ["matchId"]
            referencedRelation: "Match"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          kind: string | null
          ref: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind?: string | null
          ref?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: string | null
          ref?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey1"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey1"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_legacy: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Translation: {
        Row: {
          key: string
          lang: string
          updatedAt: string
          updatedById: string | null
          value: string
        }
        Insert: {
          key: string
          lang: string
          updatedAt?: string
          updatedById?: string | null
          value: string
        }
        Update: {
          key?: string
          lang?: string
          updatedAt?: string
          updatedById?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "Translation_updatedById_fkey"
            columns: ["updatedById"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          key: string
          lang: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          lang: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          lang?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          fcmToken: string | null
          id: string
          locale: string
          phoneMask: string | null
          preferredZone: string | null
          status: string
        }
        Insert: {
          createdAt?: string
          fcmToken?: string | null
          id?: string
          locale?: string
          phoneMask?: string | null
          preferredZone?: string | null
          status?: string
        }
        Update: {
          createdAt?: string
          fcmToken?: string | null
          id?: string
          locale?: string
          phoneMask?: string | null
          preferredZone?: string | null
          status?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prefs: {
        Row: {
          created_at: string | null
          language: string | null
          notifications: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          language?: string | null
          notifications?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          language?: string | null
          notifications?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prefs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prefs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          fan_club: string | null
          id: string
          joined_at: string | null
          language: string | null
          momo_number: string | null
          name: string | null
          phone: string | null
          points: number
          public_profile: boolean | null
          region: string | null
          tier: Database["public"]["Enums"]["user_tier"]
          user_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          fan_club?: string | null
          id?: string
          joined_at?: string | null
          language?: string | null
          momo_number?: string | null
          name?: string | null
          phone?: string | null
          points?: number
          public_profile?: boolean | null
          region?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          user_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          fan_club?: string | null
          id?: string
          joined_at?: string | null
          language?: string | null
          momo_number?: string | null
          name?: string | null
          phone?: string | null
          points?: number
          public_profile?: boolean | null
          region?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          user_code?: string | null
        }
        Relationships: []
      }
      UssdTemplate: {
        Row: {
          body: string
          createdAt: string
          id: string
          isActive: boolean
          name: string
          telco: string
          updatedAt: string
          updatedById: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name: string
          telco: string
          updatedAt?: string
          updatedById?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
          telco?: string
          updatedAt?: string
          updatedById?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "UssdTemplate_updatedById_fkey"
            columns: ["updatedById"]
            referencedRelation: "AdminUser"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_delivery_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_timestamp: string | null
          id: string
          message_id: string
          payload: Json
          phone: string | null
          status: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_timestamp?: string | null
          id?: string
          message_id: string
          payload?: Json
          phone?: string | null
          status: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_timestamp?: string | null
          id?: string
          message_id?: string
          payload?: Json
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_gate_throughput: {
        Row: {
          gate: string | null
          passes: number | null
          window_hours: number | null
        }
        Relationships: []
      }
      admin_dashboard_kpis: {
        Row: {
          format: string | null
          metric: string | null
          value_30d: number | null
          value_7d: number | null
        }
        Relationships: []
      }
      admin_dashboard_payment_metrics: {
        Row: {
          average_confirmation_seconds: number | null
          confirmed_count_7d: number | null
          pending_count: number | null
        }
        Relationships: []
      }
      admin_dashboard_sms_metrics: {
        Row: {
          average_latency_seconds: number | null
          parsed_count_7d: number | null
          raw_count_7d: number | null
          success_rate: number | null
        }
        Relationships: []
      }
      public_members: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          fan_club: string | null
          id: string | null
          joined_at: string | null
          region: string | null
        }
        Insert: {
          avatar_url?: never
          display_name?: never
          fan_club?: never
          id?: string | null
          joined_at?: string | null
          region?: never
        }
        Update: {
          avatar_url?: never
          display_name?: never
          fan_club?: never
          id?: string | null
          joined_at?: string | null
          region?: never
        }
        Relationships: []
      }
    }
    Functions: {
      increment_user_points: {
        Args: { p_points_delta: number; p_user_id: string }
        Returns: undefined
      }
      rewards_points_for: {
        Args: { amount: number; kind: string }
        Returns: number
      }
    }
    Enums: {
      GamificationKind: "prediction" | "checkin" | "quiz" | "donation_bonus"
      insurance_status: "quoted" | "paid" | "issued"
      LeaderboardPeriod: "weekly" | "monthly" | "seasonal"
      match_status: "upcoming" | "live" | "ft"
      MatchStatus: "scheduled" | "live" | "finished" | "postponed"
      MembershipStatus: "pending" | "active" | "expired" | "cancelled"
      order_status: "pending" | "paid" | "ready" | "pickedup"
      payment_kind: "ticket" | "shop" | "deposit" | "policy"
      payment_status: "pending" | "confirmed" | "failed"
      PaymentKind: "ticket" | "membership" | "shop" | "donation"
      PaymentStatus: "pending" | "confirmed" | "failed" | "manual_review"
      sacco_status: "pending" | "confirmed"
      SmsIngestStatus: "received" | "parsed" | "error"
      ticket_order_status: "pending" | "paid" | "cancelled" | "expired"
      ticket_pass_state: "active" | "used" | "refunded"
      ticket_zone: "VIP" | "Regular" | "Blue"
      TicketOrderStatus: "pending" | "paid" | "cancelled" | "expired"
      TicketPassState: "active" | "used" | "refunded"
      transaction_status: "pending" | "confirmed" | "failed" | "manual_review"
      transaction_type: "deposit" | "purchase" | "refund" | "reward"
      user_tier: "guest" | "fan" | "gold"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      GamificationKind: ["prediction", "checkin", "quiz", "donation_bonus"],
      insurance_status: ["quoted", "paid", "issued"],
      LeaderboardPeriod: ["weekly", "monthly", "seasonal"],
      match_status: ["upcoming", "live", "ft"],
      MatchStatus: ["scheduled", "live", "finished", "postponed"],
      MembershipStatus: ["pending", "active", "expired", "cancelled"],
      order_status: ["pending", "paid", "ready", "pickedup"],
      payment_kind: ["ticket", "shop", "deposit", "policy"],
      payment_status: ["pending", "confirmed", "failed"],
      PaymentKind: ["ticket", "membership", "shop", "donation"],
      PaymentStatus: ["pending", "confirmed", "failed", "manual_review"],
      sacco_status: ["pending", "confirmed"],
      SmsIngestStatus: ["received", "parsed", "error"],
      ticket_order_status: ["pending", "paid", "cancelled", "expired"],
      ticket_pass_state: ["active", "used", "refunded"],
      ticket_zone: ["VIP", "Regular", "Blue"],
      TicketOrderStatus: ["pending", "paid", "cancelled", "expired"],
      TicketPassState: ["active", "used", "refunded"],
      transaction_status: ["pending", "confirmed", "failed", "manual_review"],
      transaction_type: ["deposit", "purchase", "refund", "reward"],
      user_tier: ["guest", "fan", "gold"],
    },
  },
} as const
