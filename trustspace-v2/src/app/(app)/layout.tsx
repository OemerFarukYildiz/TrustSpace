import { ShellLayout } from "@/components/shell-layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
