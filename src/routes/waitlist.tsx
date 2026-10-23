import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve old links without presenting or collecting a waiting list.
export const Route = createFileRoute("/waitlist")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", replace: true });
  },
});
