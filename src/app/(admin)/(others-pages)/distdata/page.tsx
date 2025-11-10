import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Distdata from '@/components/District/Distdata'

import React from 'react'





const page = async () => {
   
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'District', href: '/distdata' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-2">
      <div className="col-span-12 space-y-3 xl:col-span-7">
            <Breadcrumbs title="District" breadcrumbs={breadcrumbItems} />
            <Distdata  />
        </div>
        </div>
    )
}

export default page
