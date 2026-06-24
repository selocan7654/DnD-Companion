declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: import('../auth/interfaces/auth-user.interface').AuthUser;
    }
  }
}

export {};
