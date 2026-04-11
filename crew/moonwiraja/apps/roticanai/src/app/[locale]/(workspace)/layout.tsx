import { AppHeader } from "@/components/app-header";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader fullWidth />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}
