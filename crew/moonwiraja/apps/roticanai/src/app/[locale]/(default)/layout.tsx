import { AppHeader } from "@/components/app-header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}
