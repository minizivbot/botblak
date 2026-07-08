import { redirect } from "next/navigation";

/** Playbooks moved into Learn (free) — keep old links working. */
export default function PlaybooksRedirect() {
  redirect("/learn");
}
