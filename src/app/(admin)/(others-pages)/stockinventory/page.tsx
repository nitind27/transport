// import Distdata from '@/components/District/Distdata'
import StockInventory from '@/components/Stockinventory/Stockinventory';
// import { Taluka } from '@/components/Taluka/Taluka';
import React from 'react'

// Fetch dropdown data for the form
const getDropdownData = async () => {
    try {
        const [dealers, grains, stockData] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dealerdata`, { cache: 'no-store' }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itemgrains`, { cache: 'no-store' }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stockinventory`, { cache: 'no-store' })
        ]);

        const dealersData = await dealers.json();
        const grainsData = await grains.json();
        const stockInventoryData = await stockData.json();

        return {
            dealers: dealersData,
            grains: grainsData,
            stockData: stockInventoryData
        };
    } catch (error) {
        console.error('Error fetching dropdown data:', error);
        return {
            dealers: [],
            grains: [],
            stockData: []
        };
    }
};

const page = async () => {
    const { dealers, grains, stockData } = await getDropdownData();

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <StockInventory
                    dealers={dealers}
                    grains={grains}
                    initialStockData={stockData}
                />
            </div>
        </div>
    )
}

export default page
