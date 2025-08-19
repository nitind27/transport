import React from "react";
import Breadcrumbs from "@/components/common/BreadcrumbItem";
import { Taluka } from "@/components/Taluka/Taluka";
import Talukadata from "@/components/Taluka/Talukadata";

// Reusable fetch function
const fetchData = async <T,>(endpoint: string): Promise<T> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return res.json();
};

const Page = async () => {
  // Fetch taluka and district in parallel
  const [taluka, dist] = await Promise.all([
    fetchData<Taluka[]>("taluka"),
    fetchData<Taluka[]>("district"),
  ]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Taluka", href: "/distdata" },
  ];

  return (
    <div>
      <Breadcrumbs title="Taluka" breadcrumbs={breadcrumbItems} />
      <Talukadata district={taluka} distoption={dist} />
    </div>
  );
};

export default Page;
