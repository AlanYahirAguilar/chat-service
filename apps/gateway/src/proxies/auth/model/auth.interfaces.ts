export interface JwtPayload {
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface SessionData {
  id: string;
  role: string;
}

export interface AuthenticatedUser {
  id: bigint;
  email: string;
  role: string;
  sessionId: string;
}
