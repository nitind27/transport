import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Billingregister from '@/components/Billing/Billingregister';
import React from 'react'

const page = async () => {

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Billing Register', href: '/billingregister' },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <Breadcrumbs title="Billing Register" breadcrumbs={breadcrumbItems} />
                <Billingregister />
            </div>
        </div>
    )
}

export default page