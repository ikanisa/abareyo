declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: {
      id: string;
      email: string;
      displayName: string;
      status: string;
      roles: string[];
    };
    adminPermissions?: Set<string>;
    adminSession?: {
      id: string;
      expiresAt: string | null;
    };
    fanUser?: {
      id: string;
      status: string;
      locale: string;
      whatsappNumber?: string | null;
      momoNumber?: string | null;
    };
    fanSession?: {
      id: string;
      expiresAt: string | null;
    };
    fanOnboardingStatus?: string;
  }
}
