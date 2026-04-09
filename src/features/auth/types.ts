export type AppRole =
  | "public"
  | "authenticated_user"
  | "editor"
  | "reviewer"
  | "admin"
  | "auditor";

export interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  status: "active" | "suspended" | "deleted";
}
