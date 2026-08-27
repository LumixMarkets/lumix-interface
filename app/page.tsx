import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/components/app-routes";

export default function Home() {
  redirect(APP_ROUTES.home);
}
