import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "ਐਡਮਿਨ ਲੌਗਇਨ",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="admin-view flex min-h-dvh items-center justify-center bg-surface-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Image
            src="/logo.png"
            alt="Chardikla Time TV"
            width={272}
            height={90}
            priority
            quality={95}
            sizes="160px"
            className="mx-auto h-11 w-auto"
          />
          <h1 className="mt-4 text-xl font-bold text-ink">ਐਡਮਿਨ ਪੋਰਟਲ</h1>
          <p className="mt-1 text-sm text-ink-soft">
            ਪੁਰਾਣੀਆਂ ਖ਼ਬਰਾਂ ਡਾਊਨਲੋਡ ਕਰਨ ਲਈ ਲੌਗਇਨ ਕਰੋ
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          {/* useSearchParams needs a boundary; it wraps no visible UI. */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
