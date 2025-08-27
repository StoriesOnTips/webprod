import { createContext } from "react";
import type { UserDetail as ServerUserDetail } from "@/lib/actions/user-actions";

export interface UserDetail extends ServerUserDetail {
  readonly id?: string;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  readonly isActive?: boolean;
  readonly subscription?: {
    readonly id: string;
    readonly status: 'active' | 'cancelled' | 'expired';
    readonly plan: string;
    readonly expiresAt: Date | string;
  } | null;
  readonly usage?: {
    readonly storiesGenerated: number;
    readonly lastUsed: Date | string;
  } | null;
}

export interface UserDetailContextType {
  readonly userDetail: UserDetail | null;
  readonly setUserDetail: (
    detail: UserDetail | null | ((prev: UserDetail | null) => UserDetail | null)
  ) => void;
  readonly isLoading?: boolean;
  readonly refreshUser?: () => Promise<void>;
  readonly showSuccessToast?: (title: string, description?: string) => void;
  readonly showErrorToast?: (title: string, description?: string) => void;
  readonly showInfoToast?: (title: string, description?: string) => void;
  readonly showWarningToast?: (title: string, description?: string) => void;
  // Auth state flags
  readonly isAuthReady: boolean;
  readonly onboardingCompleted: boolean;
  readonly shouldRedirectToOnboarding: boolean;
  readonly shouldRedirectToDashboard: boolean;
}

export const UserDetailContext = createContext<UserDetailContextType | null>(null);