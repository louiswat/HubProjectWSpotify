"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideHeader = pathname === "/";

    return (
        <>
            {!hideHeader && <Header />}
            {children}
        </>
    );
}
