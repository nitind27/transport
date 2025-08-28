import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Ownersdata from '@/components/Owners/Ownersdata';
import { Ownertype } from '@/components/Taluka/Taluka';
import React from 'react'


const getTalukas = async (): Promise<Ownertype[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ownerdata`, { cache: 'no-store' });
    return res.json();
};



const page = async () => {
    const [taluka] = await Promise.all([

        getTalukas(),

        // getgrampanchayat()
    ]);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Owner ', href: '/owner' },
    ];

    return (
        <div>
            <Breadcrumbs title="Owner" breadcrumbs={breadcrumbItems} />
            <Ownersdata district={taluka} />
        </div>
    )
}

export default page
