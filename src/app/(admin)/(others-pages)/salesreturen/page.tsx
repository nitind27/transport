import Breadcrumbs from '@/components/common/BreadcrumbItem';
import SalesTab from '@/components/Dipatchdetials/SalesTab';
import React from 'react'

const page = async () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Sales Return', href: '/salesreturen' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <Breadcrumbs title="Sales Return" breadcrumbs={breadcrumbItems} />
                <SalesTab />
            </div>
        </div>
    )
}

export default page