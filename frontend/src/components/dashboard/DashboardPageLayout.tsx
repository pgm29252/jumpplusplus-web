import { ReactNode } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { cn } from "@/lib/utils";

type DashboardBreadcrumbItem = {
  label: string;
  href?: string;
};

type DashboardPageLayoutProps = {
  children: ReactNode;
  breadcrumbItems?: DashboardBreadcrumbItem[];
  className?: string;
  contentClassName?: string;
};

export default function DashboardPageLayout({
  children,
  breadcrumbItems,
  className,
  contentClassName,
}: DashboardPageLayoutProps) {
  return (
    <div className={cn("brand-surface min-h-screen p-6", className)}>
      <div className={cn("mx-auto max-w-6xl space-y-6", contentClassName)}>
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
        {children}
      </div>
    </div>
  );
}
