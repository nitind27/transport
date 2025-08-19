import React from "react";
import Breadcrumbs from "@/components/common/BreadcrumbItem";
import { Taluka } from "@/components/Taluka/Taluka";
import Villagedata from "@/components/Village/Villagedata";

// Generic fetch helper
const fetchData = async <T,>(endpoint: string): Promise<T> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return res.json();
};

const Page = async () => {
  // Fetch taluka + district in parallel
  const [taluka, dist] = await Promise.all([
    fetchData<Taluka[]>("taluka"),
    fetchData<Taluka[]>("district"),
  ]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Village", href: "/village" },
  ];

  return (
    <div>
      <Breadcrumbs title="Taluka" breadcrumbs={breadcrumbItems} />
      <Villagedata district={taluka} distoption={dist} />
    </div>
  );
};

export default Page;
