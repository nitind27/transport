import Breadcrumbs from '@/components/common/BreadcrumbItem';
// import Distdata from '@/components/District/Distdata'
import { Taluka } from '@/components/Taluka/Taluka';
import Talukadata from '@/components/Taluka/Talukadata';
import React from 'react'


const getTalukas = async (): Promise<Taluka[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' });
    return res.json();
};


const getDist = async (): Promise<Taluka[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' });
    return res.json();
};

const page = async () => {
    const [taluka] = await Promise.all([

        getTalukas(),
      
    ]);
    const [dist] = await Promise.all([

          getDist(),
      
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
