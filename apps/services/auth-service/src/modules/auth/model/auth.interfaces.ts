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

export interface UserRepresentation {
  id: bigint;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR';
  status: 'ACTIVE' | 'INACTIVE';
  lastSessionAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
