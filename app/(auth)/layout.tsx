import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white p-1">
            <Image
              src="/logo.png"
              alt="Ajo logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />
          </div>
          <span className="text-xl font-semibold text-green-800">Ajoic</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}