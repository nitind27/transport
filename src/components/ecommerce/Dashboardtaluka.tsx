'use client';

import React, { useState, useEffect } from 'react';

// Interface matching the expected API response structure (raw data types)
interface TalukaApiResponse {
  taluka_id: number;
  name: string;
  name_en: string;
  total_schools: string | number;
  schools_with_orders: string | number;    // Schools that have orders for specific order_no
  distributed_schools: string | number;   // Schools that have been dispatched
  remaining_schools: string | number;     // Schools with orders - Schools dispatched
}

// Interface for transformed taluka dashboard data
interface TalukaData {
  taluka_id: number;
  name: string;
  name_en: string;
  total_schools: number;
  schools_with_orders: number;
  distributed_schools: number;
  remaining_schools: number;
  date: string;
}

// Interface for order counts
interface OrderCount {
  order_id: number;
  order_no: string;
  period: string;
  financial_year: string;
  no_of_days: number;
  total_schools: number;
  dispatched_schools: number;
  remaining_schools: number;
}

const Dashboardtaluka = () => {
  const [talukaData, setTalukaData] = useState<TalukaData[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [selectedOrderNo] = useState('20');
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  useEffect(() => {
    fetchData();
  }, [selectedOrderNo]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both taluka data and order counts
      const [talukaResponse, orderCountsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/talukadashboard?order_no=${selectedOrderNo}`, {
          cache: 'no-store'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schoolwiseorders/count`, {
          cache: 'no-store'
        })
      ]);

      if (!talukaResponse.ok || !orderCountsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const talukaData: TalukaApiResponse[] = await talukaResponse.json();
      const orderCountsData: OrderCount[] = await orderCountsResponse.json();

      // Transform taluka data
      const processedTalukaData: TalukaData[] = talukaData.map((taluka) => ({
        taluka_id: taluka.taluka_id,
        name: taluka.name,
        name_en: taluka.name_en,
        total_schools: typeof taluka.total_schools === 'string'
          ? parseInt(taluka.total_schools) || 0
          : taluka.total_schools,
        schools_with_orders: typeof taluka.schools_with_orders === 'string'
          ? parseInt(taluka.schools_with_orders) || 0
          : taluka.schools_with_orders || 0,
        distributed_schools: typeof taluka.distributed_schools === 'string'
          ? parseInt(taluka.distributed_schools) || 0
          : taluka.distributed_schools,
        remaining_schools: Math.max(0, typeof taluka.remaining_schools === 'string'
          ? parseInt(taluka.remaining_schools) || 0
          : taluka.remaining_schools),
        date: currentDate
      }));

      setTalukaData(processedTalukaData);
      setOrderCounts(orderCountsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  // const totalSchools = talukaData.reduce((sum, taluka) => sum + taluka.total_schools, 0);
  const totalSchoolsWithOrders = talukaData.reduce((sum, taluka) => sum + taluka.schools_with_orders, 0);
  const totalDistributed = talukaData.reduce((sum, taluka) => sum + taluka.distributed_schools, 0);
  const totalRemaining = talukaData.reduce((sum, taluka) => sum + taluka.remaining_schools, 0);
  const distributionPercentage = totalSchoolsWithOrders > 0
    ? ((totalDistributed / totalSchoolsWithOrders) * 100).toFixed(1)
    : '0.0';

  // Get current order details
  const currentOrder = orderCounts.find(order => order.order_no === selectedOrderNo);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3">
      {/* Header */}
      <div className="text-center mb-2">
        <h4 className="text-2xl font-bold mb-2"> <span className="font-semibold">Order Number:</span>
        <span className="ml-2">{selectedOrderNo}</span></h4>
        
        {/* Reorganized layout with justify-between */}
        <div className="mt-4 flex justify-between items-center text-sm">
          {/* Left side - Date with days */}
          <div className="text-left">
            <div>
              <span className="font-semibold">Date:</span> {currentDate}
            </div>
            {currentOrder && (
              <div className="mt-1 ">
                <span className="font-semibold">Days:</span> {currentOrder.no_of_days} days
              </div>
            )}
          </div>
          
          {/* Right side - Period and Financial Year */}
          {currentOrder && (
            <div className="text-right ">
              <div>
                <span className="font-semibold">Period:</span> {currentOrder.period}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Financial Year:</span> {currentOrder.financial_year}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">अ.क्र</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">तालुका</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">एकूण शाळा</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">एकूण शाळा वाटप</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">बाकी शाळा</th>
            </tr>
          </thead>
          <tbody>
            {talukaData.map((taluka, index) => (
              <tr key={taluka.taluka_id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-3 font-medium">{taluka.name}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.schools_with_orders}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.distributed_schools}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.remaining_schools}</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-300 px-4 py-3" colSpan={2}>
                <span className="font-bold">एकूण</span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalSchoolsWithOrders}</td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalDistributed}</td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalRemaining}</td>
            </tr>
            {/* Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-300 px-4 py-3" colSpan={4}>
                <span className="font-bold">Percentage of Schools Distributed</span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center">{distributionPercentage}</td>
            
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {/* <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Percentage of Schools Distributed (Order No. {selectedOrderNo}): {distributionPercentage}%
        </p>
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex justify-center space-x-6">
            <p>Total Schools in District: {totalSchools}</p>
            <p>Schools with Order No. {selectedOrderNo}: {totalSchoolsWithOrders}</p>
            <p>Schools Dispatched: {totalDistributed}</p>
            <p>Schools Remaining: {totalRemaining}</p>
          </div>
        </div>
      </div> */}

     
    </div>
  );
};

export default Dashboardtaluka;
