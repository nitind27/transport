import Breadcrumbs from '@/components/common/BreadcrumbItem';

import Talukadata from '@/components/Taluka/Talukadata';
import React from 'react'



const page = async () => {
     const [talukadata, distdata] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' }),
 
  ]);

  const [taluka, dist] = await Promise.all([
    talukadata.json(),
    distdata.json(),
 
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Taluka', href: '/distdata' },
  ];

    return (
        <div>
             <Breadcrumbs title="Taluka" breadcrumbs={breadcrumbItems} />
            <Talukadata district={taluka} distoption={dist}/>
        </div>
    )
}

export default page
