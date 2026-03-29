"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href ? (
              <Link
                href={item.href}
                className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600 font-medium">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
