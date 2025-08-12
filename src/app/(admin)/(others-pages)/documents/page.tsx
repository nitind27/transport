
import Breadcrumbs from '@/components/common/BreadcrumbItem'
import Documentsdata from '@/components/Documentsdata/Documentsdata'
import React from 'react'

const page = async () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Documents', href: '/documents' },

  ];
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
    cache: 'no-store' 
  });

  const data = await res.json();

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">

          <Breadcrumbs
            title="Documents"
            breadcrumbs={breadcrumbItems}
          />
          <Documentsdata serverData={data} />
   
      </div>
    </div>
  )
}

export default page
