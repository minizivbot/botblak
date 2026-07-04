import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
