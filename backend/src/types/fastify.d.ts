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
  }
}
