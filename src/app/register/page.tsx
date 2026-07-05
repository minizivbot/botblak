import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <AuthShell title="Create your account">
      {googleEnabled && (
        <>
          <GoogleButton label="Sign up with Google" />
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-edge" />
            or with a username
            <span className="h-px flex-1 bg-edge" />
          </div>
        </>
      )}
      <AuthForm mode="register" />
    </AuthShell>
  );
}
