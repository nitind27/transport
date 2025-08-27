import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Schooldata from '@/components/School/Schooldata';
import React from 'react'


const page = async () => {
    const [talukadata, distdata, villagedata, schooldata, centerapi] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/district`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scooldata`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centerapi`, { cache: 'no-store' }),

    ]);

    const [taluka, dist, village, school, center] = await Promise.all([
        talukadata.json(),
        distdata.json(),
        villagedata.json(),
        schooldata.json(),
        centerapi.json(),

    ])
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'School', href: '/school' },
    ];

    return (
        <div>

            <Breadcrumbs title="School" breadcrumbs={breadcrumbItems} />
            <Schooldata district={taluka} distoption={dist} village={village} center={center} school={school} />

        </div>
    )
}

export default page
