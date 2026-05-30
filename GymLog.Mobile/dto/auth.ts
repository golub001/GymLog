export type AuthResult = {
  success: boolean;
  error?: string;
  token?: string;
  onboardingCompleted?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};