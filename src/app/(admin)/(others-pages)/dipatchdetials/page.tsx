import Breadcrumbs from '@/components/common/BreadcrumbItem';
// import Dipatchdetials from '@/components/Dipatchdetials/Dipatchdetials';
import DispatchTabs from '@/components/Dipatchdetials/Dispatchtabs';
import React from 'react'


const page = async () => {


    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Dispatch Details', href: '/dipatchdetials' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <Breadcrumbs title="Dispatch Details" breadcrumbs={breadcrumbItems} />
                <DispatchTabs />
            </div>
        </div>
    )
}

export default page
