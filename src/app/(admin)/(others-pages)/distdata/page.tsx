import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Distdata from '@/components/District/Distdata'
import { Taluka } from '@/components/Taluka/Taluka';
import React from 'react'


const getTalukas = async (): Promise<Taluka[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' });
    return res.json();
};



const page = async () => {
    const [taluka] = await Promise.all([

        getTalukas(),

        // getgrampanchayat()
    ]);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'District', href: '/distdata' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-2">
      <div className="col-span-12 space-y-3 xl:col-span-7">
            <Breadcrumbs title="District" breadcrumbs={breadcrumbItems} />
            <Distdata district={taluka} />
        </div>
        </div>
    )
}

export default page
