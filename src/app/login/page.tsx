import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "google-not-configured": "Google sign-in isn't set up on this server yet.",
  "google-state": "Google sign-in expired — please try again.",
  "google-token": "Google didn't accept the sign-in. Please try again.",
  "google-unreachable": "Couldn't reach Google. Please try again.",
  "google-profile": "Couldn't read your Google profile. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <AuthShell title="Welcome back">
      {error && ERRORS[error] && (
        <p className="mb-3 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
          {ERRORS[error]}
        </p>
      )}
      {googleEnabled && (
        <>
          <GoogleButton />
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-edge" />
            or with a username
            <span className="h-px flex-1 bg-edge" />
          </div>
        </>
      )}
      <AuthForm mode="login" />
    </AuthShell>
  );
}
