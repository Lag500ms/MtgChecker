export type AccountRole = 'USER' | 'ADMIN';

export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  active: boolean;
  discordLinked: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  account: Account;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};
