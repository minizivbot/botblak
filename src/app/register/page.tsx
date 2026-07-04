import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
