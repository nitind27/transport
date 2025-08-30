import Breadcrumbs from '@/components/common/BreadcrumbItem';
import React from 'react'
import Dealerdata from '@/components/Dealerdata/Dealerdata';



const page = async () => {
    const [talukadata] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dealerdata`, { cache: 'no-store' }),
        // fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ownerdata`, { cache: 'no-store' }),

    ]);

    const [taluka] = await Promise.all([
        talukadata.json(),
        // distdata.json(),

    ]);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Dealers', href: '/dealer' },
    ];

    return (
        <div>
            <Breadcrumbs title="Dealers" breadcrumbs={breadcrumbItems} />
            <Dealerdata dealerdata={taluka} />
        </div>
    )
}

export default page
