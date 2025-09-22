import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Routepaper from '@/components/Routepaper/Routepaper';
import React from 'react'


const page = async () => {


    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Route Paper', href: '/routepaper' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <Breadcrumbs title="Route Paper" breadcrumbs={breadcrumbItems} />
                <Routepaper />
            </div>
        </div>
    )
}

export default page
