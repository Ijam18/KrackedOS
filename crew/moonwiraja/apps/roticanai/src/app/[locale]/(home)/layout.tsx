import { GlobalHeader } from "@/components/global-header";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalHeader hideMobileLogo />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}
