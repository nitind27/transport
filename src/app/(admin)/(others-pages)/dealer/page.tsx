import Breadcrumbs from '@/components/common/BreadcrumbItem';
import React from 'react'
import Dealerdata from '@/components/Dealerdata/Dealerdata';



const page = async () => {
  

 
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Dealers', href: '/dealer' },
    ];

    return (
        <div>
            <Breadcrumbs title="Dealers" breadcrumbs={breadcrumbItems} />
            <Dealerdata />
        </div>
    )
}

export default page
