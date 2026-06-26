import { BrandLogo } from "@/components/brand/BrandLogo"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 pb-16">
      <BrandLogo imageClassName="h-[72px]" />
      <h1 className="sr-only">GrowBase</h1>
    </main>
  )
}
