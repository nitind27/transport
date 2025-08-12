// import Distdata from '@/components/District/Distdata'
import StockInventory from '@/components/Stockinventory/Stockinventory';
// import { Taluka } from '@/components/Taluka/Taluka';
import React from 'react'


// const getTalukas = async (): Promise<Taluka[]> => {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' });
//     return res.json();
// };



const page = async () => {
    // const [taluka] = await Promise.all([

    //     getTalukas(),

    //     // getgrampanchayat()
    // ]);

    return (
        <div>
            <StockInventory  />
        </div>
    )
}

export default page
