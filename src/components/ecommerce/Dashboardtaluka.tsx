'use client';

import React, { useState, useEffect } from 'react';

// Interface matching the expected API response structure (raw data types)
interface TalukaApiResponse {
  taluka_id: number;
  name: string;
  name_en: string;
  districtname: string;
  total_schools: string | number;      // Could be string in API
  distributed_schools: string | number;// Could be string in API
  remaining_schools: string | number;  // Could be string in API
}

// Interface for transformed taluka dashboard data
interface TalukaData {
  taluka_id: number;
  name: string;
  name_en: string;
  districtname: string;
  total_schools: number;
  distributed_schools: number;
  remaining_schools: number;
  date: string;
}

const Dashboardtaluka = () => {
  const [talukaData, setTalukaData] = useState<TalukaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  useEffect(() => {
    fetchTalukaData();
  }, []);

  const fetchTalukaData = async () => {
    try {
      setLoading(true);

      // Fetch taluka dashboard data from the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/talukadashboard`, {
        cache: 'no-store'
      });

      // Strongly type API response as array of TalukaApiResponse
      const data: TalukaApiResponse[] = await response.json();

      // Transform and map to TalukaData
      const processedData: TalukaData[] = data.map((taluka) => ({
        taluka_id: taluka.taluka_id,
        name: taluka.name,
        name_en: taluka.name_en,
        districtname: taluka.districtname,
        total_schools: typeof taluka.total_schools === 'string'
          ? parseInt(taluka.total_schools) || 0
          : taluka.total_schools,
        distributed_schools: typeof taluka.distributed_schools === 'string'
          ? parseInt(taluka.distributed_schools) || 0
          : taluka.distributed_schools,
        remaining_schools: Math.max(0, typeof taluka.remaining_schools === 'string'
          ? parseInt(taluka.remaining_schools) || 0
          : taluka.remaining_schools),
        date: currentDate
      }));

      setTalukaData(processedData);
    } catch (error) {
      console.error('Error fetching taluka data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalSchools = talukaData.reduce((sum, taluka) => sum + taluka.total_schools, 0);
  const totalDistributed = talukaData.reduce((sum, taluka) => sum + taluka.distributed_schools, 0);
  const totalRemaining = talukaData.reduce((sum, taluka) => sum + taluka.remaining_schools, 0);
  const distributionPercentage = totalSchools > 0
    ? ((totalDistributed / totalSchools) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mid Day Meal</h1>
        <p className="text-lg text-gray-600">Aug-Sept-2025 (42 days)</p>
        <div className="mt-4 flex justify-center space-x-8 text-sm">
          <div>
            <span className="font-semibold">Total Distribution Order (D.O.):</span>
            <span className="ml-2">1022 metric tons</span>
          </div>
          <div>
            <span className="font-semibold">Order Number:</span>
            <span className="ml-2">20</span>
            <span className="ml-2 text-gray-600">Date : ({currentDate})</span>
          </div>
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
                {/* <td className="border border-gray-300 px-4 py-3">{taluka.date}</td> */}
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.total_schools}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.distributed_schools}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{taluka.remaining_schools}</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-300 px-4 py-3" colSpan={3}>
                <span className="font-bold">एकूण</span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalSchools}</td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalDistributed}</td>
              <td className="border border-gray-300 px-4 py-3 text-center">{totalRemaining}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Percentage of Schools Distributed: {distributionPercentage}%
        </p>
      </div>
    </div>
  );
};

export default Dashboardtaluka;
