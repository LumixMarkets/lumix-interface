import { AppStatusPage } from "@/components/app-status-page";

export default function NotFound() {
  return (
    <AppStatusPage
      context="404"
      title="Page not found"
      description="The page you’re looking for doesn’t exist or has moved."
    />
  );
}
