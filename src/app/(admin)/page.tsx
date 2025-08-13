// app/ecommerce/page.tsx
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";

// import Showschemstable from "@/components/ecommerce/Showschemstable";
import { Suspense } from "react";
import Loader from "@/common/Loader";
// import Dashboardtabfilter from "@/components/schemeserve/Dashboardtabfilter";

// import DoTalukadata from "@/components/Do/Talukawisedata/DoTalukadata";


// import { SchemeSaturation } from "@/components/ecommerce/SchemeSaturation";
// import GraphData from "@/components/ecommerce/GraphData";
// import SchemesBarChart from "@/components/ecommerce/SchemesBarChart";

export const metadata: Metadata = {
  title: "Scheme Serve",
  description:
    "Scheme Serve",
};

async function fetchMetrics() {

  try {
    const [schemesRes, usersRes, talukaRes, villageRes, grampanchayatRes, vykatiRes, bhautikapiRes] = await Promise.all([

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grampanchayt`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vyaktikapi`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bhautikapi`, { cache: 'no-store' }),
    ]);

    const [schemes, users, taluka, village, grampanchayat, vyaktidata, bhautikdata] = await Promise.all([

      schemesRes.json(),
      usersRes.json(),
      talukaRes.json(),
      villageRes.json(),
      grampanchayatRes.json(),
      vykatiRes.json(),
      bhautikapiRes.json()
    ]);

    return {

      schemes,
      users,
      taluka,
      village,
      grampanchayat,
      vyaktidata,
      bhautikdata,
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return {

      schemes: [],
      users: [],
      taluka: [],
      village: [],
      grampanchayat: [],
      vyaktidata: [],
      bhautikdata: [],
    };
  }
}




export default async function Ecommerce() {
  const metrics = await fetchMetrics();


  return (
    <>

      <div className="grid grid-cols-6 gap-4 md:gap-6">
        <div className="col-span-12 space-y-0 xl:col-span-7 ">

          <Suspense fallback={<Loader />}>
        
         

            <EcommerceMetrics metrics={metrics} />
            {/* <Dashboardtabfilter metrics={metrics} /> */}


          </Suspense>
        </div>
      </div>
    </>
  );
}
