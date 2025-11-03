import Breadcrumbs from '@/components/common/BreadcrumbItem';
import React from 'react'
import Company from '@/components/Company/Company';

const page = async () => {
    const [companydata] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company`, { cache: 'no-store' }),
    ]);

    const [company] = await Promise.all([
        companydata.json(),
    ]);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Companies', href: '/companies' },
    ];

    return (
        <div>
            <Breadcrumbs title="Companies" breadcrumbs={breadcrumbItems} />
            <Company companydata={company} />
        </div>
    )
}

export default page
