import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Salessummary from '@/components/Salessummary/Salessummary';
import React from 'react';

const SalessummaryPage = () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Sales Summary', href: '/salessummary' },
    ];
    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
            <Breadcrumbs title="Sales Summary" breadcrumbs={breadcrumbItems} />
            <Salessummary />
            </div>
        </div>
    );
};

export default SalessummaryPage;