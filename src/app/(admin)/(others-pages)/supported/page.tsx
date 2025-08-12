import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Supporteddata from '@/components/Supporteddata/Supporteddata';

import React, { Suspense } from 'react'

const page = async () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Supported', href: '/supported' },

  ];
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supportedapi`, {
    cache: 'no-store' // So data is always fresh
  });

  const data = await res.json();
  const documents = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
    cache: 'no-store' // So data is always fresh
  });

  const documentsdata = await documents.json();

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
       
      <Suspense fallback={<Loader />}>
        <Breadcrumbs
          title="Supported"
          breadcrumbs={breadcrumbItems}
        />
        <Supporteddata serverData={data} documents={documentsdata}/>
      </Suspense>
    </div>
    </div>
  )
}

export default page
