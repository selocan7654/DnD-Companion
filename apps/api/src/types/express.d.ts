declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        sub: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}

export {};
