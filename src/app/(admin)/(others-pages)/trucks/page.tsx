import Breadcrumbs from '@/components/common/BreadcrumbItem';

// import Talukadata from '@/components/Taluka/Talukadata';
import React from 'react'
import Truckdata from '../../../../components/Truckdata/Truckdata';



const page = async () => {
     const [talukadata, distdata] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/truckdata`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ownerdata`, { cache: 'no-store' }),
 
  ]);

  const [taluka, dist] = await Promise.all([
    talukadata.json(),
    distdata.json(),
 
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Trucks', href: '/distdata' },
  ];

    return (
        <div>
             <Breadcrumbs title="Trucks" breadcrumbs={breadcrumbItems} />
            <Truckdata truckdata={taluka} owner={dist}/>
        </div>
    )
}

export default page
