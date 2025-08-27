import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Itemsgrains from '@/components/ItemsGrains/Itemsgrains';
import { ItemGraintype } from '@/components/Taluka/Taluka';
import React from 'react'


const getTalukas = async (): Promise<ItemGraintype[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itemgrains`, { cache: 'no-store' });
    return res.json();
};



const page = async () => {
    const [taluka] = await Promise.all([

        getTalukas(),

        // getgrampanchayat()
    ]);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Items / Grains', href: '/distdata' },
    ];

    return (
        <div>
            <Breadcrumbs title="Items / Grains" breadcrumbs={breadcrumbItems} />
            <Itemsgrains district={taluka} />
        </div>
    )
}

export default page
