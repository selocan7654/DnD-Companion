export interface AuthCookieResponse {
  cookie(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict';
      path: string;
      maxAge: number;
    },
  ): void;
}

export interface AuthCookieRequest {
  cookies?: Record<string, string>;
}
