import { useAuth } from "@/contexts/AuthContext";
import { MainMenu } from "@/components/MainMenu";
import { ParshadDashboard } from "@/components/ParshadDashboard";
import { PWDWorkerDashboard } from "@/components/PWDWorkerDashboard";

export default function Index() {
  const { user } = useAuth();

  // Route based on user role
  if (user?.role === 'parshad') {
    return <ParshadDashboard />;
  }

  if (user?.role === 'pwd_worker') {
    return <PWDWorkerDashboard />;
  }

  // Default: regular user sees the main menu
  return <MainMenu />;
}
