import { SandboxLoading } from "@/features/sandbox/components/sandbox-loading";
import type { SandboxStatus } from "@/features/sandbox/hooks/use-sandbox";

interface LoadingWrapperProps {
  status: SandboxStatus;
  error: string | null;
  children: React.ReactNode;
  appTitle?: string | null;
}

export function LoadingWrapper({
  status,
  error,
  children,
  appTitle,
}: LoadingWrapperProps) {
  if (status !== "ready") {
    return <SandboxLoading status={status} error={error} appTitle={appTitle} />;
  }
  return <>{children}</>;
}
