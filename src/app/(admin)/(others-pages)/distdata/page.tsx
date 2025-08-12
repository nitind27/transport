import Distdata from '@/components/District/Distdata'
import { Taluka } from '@/components/Taluka/Taluka';
import React from 'react'


const getTalukas = async (): Promise<Taluka[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' });
    return res.json();
};



const page = async () => {
    const [taluka] = await Promise.all([

        getTalukas(),

        // getgrampanchayat()
    ]);

    return (
        <div>
            <Distdata district={taluka} />
        </div>
    )
}

export default page
