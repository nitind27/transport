import Centerdata from '@/components/Center/Centerdata';
import Breadcrumbs from '@/components/common/BreadcrumbItem';

import React from 'react'


const page = async () => {
   const [talukadata, distdata,centerdata] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centerapi`, { cache: 'no-store' }),
 
  ]);

  const [taluka, dist, center] = await Promise.all([
    talukadata.json(),
    distdata.json(),
    centerdata.json(),
 
  ])
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: `Center's`, href: '/center ' },
  ];

    return (
        <div>
             <Breadcrumbs title="Center's" breadcrumbs={breadcrumbItems} />
            <Centerdata district={taluka} distoption={dist} center={center}/>
        </div>
    )
}

export default page
