import { Suspense } from "react";
import BusinessModule from "@/components/BusinessModule";
import MenuPage from "@/app/menu/page";

const catalogModules = new Set(["products", "services"]);

export default function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading business module...</div>}>
      <ModuleContent params={params} />
    </Suspense>
  );
}

async function ModuleContent({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (catalogModules.has(module)) return <MenuPage />;
  return <BusinessModule module={module} />;
}
