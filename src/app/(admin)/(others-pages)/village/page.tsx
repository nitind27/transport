import Breadcrumbs from '@/components/common/BreadcrumbItem';
// import Distdata from '@/components/District/Distdata'
// import { Taluka } from '@/components/Taluka/Taluka';
// import Talukadata from '@/components/Taluka/Talukadata';
import Villagedata from '@/components/Village/Villagedata';
import React from 'react'


const page = async () => {
   const [talukadata, distdata, villagedata] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' }),
 
  ]);

  const [taluka, dist, village] = await Promise.all([
    talukadata.json(),
    distdata.json(),
    villagedata.json(),
 
  ])
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Village', href: '/village' },
  ];

    return (
        <div>
             <Breadcrumbs title="Village" breadcrumbs={breadcrumbItems} />
            <Villagedata district={taluka} distoption={dist} village={village}/>
        </div>
    )
}

export default page
