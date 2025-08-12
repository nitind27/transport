// app/(admin)/(others-pages)/farmerspage/page.tsx

import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Farmersdata from '@/components/farmersdata/Farmersdata';
import { FarmdersType } from '@/components/farmersdata/farmers';
import { Village } from '@/components/Village/village';
import { Taluka } from '@/components/Taluka/Taluka';
import { Schemesdatas } from '@/components/schemesdata/schemes';
import React from 'react';
import { Documents } from '@/components/Documentsdata/documents';

async function getData(): Promise<{
  farmers: FarmdersType[];
  villages: Village[];
  talukas: Taluka[];
  schemes: Schemesdatas[];
  documents: Documents[];
}> {
  const [farmersRes, villagesRes, talukaRes, schemesRes, documentsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, { cache: 'no-store' }),
  ]);

  const [farmers, villages, talukas, schemes, documents] = await Promise.all([
    farmersRes.json(),
    villagesRes.json(),
    talukaRes.json(),
    schemesRes.json(),
    documentsRes.json(),
  ]);

  return { farmers, villages, talukas, schemes, documents };
}

const Page = async () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'IFR holders', href: '/farmerspage' },
  ];

  const { farmers, villages, talukas, schemes, documents } = await getData();

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Breadcrumbs title="IFR holders" breadcrumbs={breadcrumbItems} />

        <Farmersdata
          data={farmers}
          datavillage={villages}
          datataluka={talukas}
          dataschems={schemes}
          documents={documents}
        />
      </div>
    </div>
  );
};

export default Page;
