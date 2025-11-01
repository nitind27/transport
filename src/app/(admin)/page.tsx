// app/ecommerce/page.tsx
import type { Metadata } from "next";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import Dashboardtaluka from "@/components/ecommerce/Dashboardtaluka";

// import Showschemstable from "@/components/ecommerce/Showschemstable";
import { Suspense } from "react";
import Loader from "@/common/Loader";
// import Dashboardtabfilter from "@/components/schemeserve/Dashboardtabfilter";

// import DoTalukadata from "@/components/Do/Talukawisedata/DoTalukadata";


// import { SchemeSaturation } from "@/components/ecommerce/SchemeSaturation";
// import GraphData from "@/components/ecommerce/GraphData";
// import SchemesBarChart from "@/components/ecommerce/SchemesBarChart";

export const metadata: Metadata = {
  title: "MDM",
  description:
    "MDM",
};






export default async function Ecommerce() {
  // const metrics = await fetchMetrics();


  return (
    <>

      <div className="grid grid-cols-6 gap-4 md:gap-6">
        <div className="col-span-12 space-y-0 xl:col-span-7 ">

          <Suspense fallback={<Loader />}>
        
         

            {/* <EcommerceMetrics metrics={metrics} /> */}
            <div className="">
              <Dashboardtaluka />
            </div>

          </Suspense>
        </div>
      </div>
    </>
  );
}