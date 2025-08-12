// File: app/(admin)/(others-pages)/schemespage/page.tsx
import React, { Suspense } from 'react';
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Schemesdata from '@/components/schemesdata/Schemesdata';
import Loader from '@/common/Loader';

const Page = async () => {
  const [schemesRes, docsRes, categoryRes, subcategoryRes, yearRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescategory`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemessubcategory`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yearmaster`, { cache: 'no-store' }),
  ]);

  const [data, filterdocument, filtercategory, filtersubcategory, filteryear] = await Promise.all([
    schemesRes.json(),
    docsRes.json(),
    categoryRes.json(),
    subcategoryRes.json(),
    yearRes.json(),
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Schemes', href: '/schemespage' },
  ];

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
      <Suspense fallback={<Loader />}>
        <Breadcrumbs title="Schemes Master" breadcrumbs={breadcrumbItems} />
        <Schemesdata
          initialdata={data}
          filtercategory={filtercategory}
          filterdocument={filterdocument}
          filtersubcategory={filtersubcategory}
          filteryear={filteryear}
        />
      </Suspense>
    </div>
    </div>
  );
};

export default Page;
