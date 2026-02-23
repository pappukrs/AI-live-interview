import { create } from "zustand";
import { mockUser, type UserProfile } from "./mock-data";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (_email, _password) => {
    set({ user: mockUser, isAuthenticated: true });
  },
  signup: (name, email, _password) => {
    set({ user: { ...mockUser, name, email }, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
