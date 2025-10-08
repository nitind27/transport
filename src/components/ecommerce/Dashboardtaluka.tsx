'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

  const fetchData = useCallback(async () => {
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
  }, [selectedOrderNo, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalSchoolsWithOrders = talukaData.reduce((sum, taluka) => sum + taluka.schools_with_orders, 0);
  const totalDistributed = talukaData.reduce((sum, taluka) => sum + taluka.distributed_schools, 0);
  const totalRemaining = talukaData.reduce((sum, taluka) => sum + taluka.remaining_schools, 0);
  const distributionPercentage = totalSchoolsWithOrders > 0
    ? ((totalDistributed / totalSchoolsWithOrders) * 100).toFixed(1)
    : '0.0';

  // Get current order details
  const currentOrder = orderCounts.find(order => order.order_no === selectedOrderNo);

  // Function to create single comprehensive chart data for all talukas
  const createComprehensiveChartData = () => {
    // Check if we have data
    if (!talukaData || talukaData.length === 0) {
      return {
        series: [],
        options: {
          chart: {
            type: 'bar' as const,
            height: 500,
          },
          xaxis: {
            categories: []
          }
        }
      };
    }

    const talukaNames = talukaData.map(taluka => taluka.name);
    const totalSchoolsData = talukaData.map(taluka => taluka.schools_with_orders);
    const distributedSchoolsData = talukaData.map(taluka => taluka.distributed_schools);
    const remainingSchoolsData = talukaData.map(taluka => taluka.remaining_schools);

    return {
      series: [
        {
          name: 'एकूण शाळा',
          data: totalSchoolsData,
        },
        {
          name: 'एकूण शाळा वाटप',
          data: distributedSchoolsData,
        },
        {
          name: 'बाकी शाळा',
          data: remainingSchoolsData,
        }
      ],
      options: {
        chart: {
          type: 'bar' as const,
          height: 500,
          animations: {
            enabled: true,
            easing: 'easeinout' as const,
            speed: 2000,
            animateGradually: {
              enabled: true,
              delay: 200
            },
            dynamicAnimation: {
              enabled: true,
              speed: 500
            }
          },
          sparkline: {
            enabled: false
          },
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            }
          }
        },
        plotOptions: {
          bar: {
            columnWidth: '60%',
            borderRadius: 4,
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          offsetY: -20,
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            colors: ['#1F2937']
          },
          formatter: function (val: number) {
            return val;
          }
        },
        xaxis: {
          categories: talukaNames,
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
              colors: '#1F2937'
            },
            rotate: -45,
            rotateAlways: false
          },
          title: {
            text: 'तालुका',
            style: {
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1F2937'
            }
          }
        },
        yaxis: {
          title: {
            text: 'शाळा संख्या',
            style: {
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1F2937'
            }
          },
          labels: {
            style: {
              fontSize: '12px',
              colors: '#1F2937'
            }
          }
        },
        colors: ['#3B82F6', '#10B981', '#EF4444'],
        title: {
          text: 'तालुका-निहाय शाळा वाटप विवरण',
          align: 'center' as const,
          style: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1F2937'
          }
        },
        legend: {
          show: true,
          position: 'top' as const,
          horizontalAlign: 'center' as const,
          fontSize: '14px',
          fontWeight: 'bold',
          labels: {
            colors: '#1F2937'
          }
        },
        grid: {
          show: true,
          borderColor: '#E5E7EB',
          strokeDashArray: 2
        },
        tooltip: {
          enabled: true,
          fillSeriesColor: false,
          custom: function({series, seriesIndex, dataPointIndex, w}: {
            series: number[][];
            seriesIndex: number;
            dataPointIndex: number;
            w: {
              config: {
                xaxis: {
                  categories: string[];
                };
              };
            };
          }) {
            const categories = ['एकूण शाळा', 'एकूण शाळा वाटप', 'बाकी शाळा'];
            const talukaName = w.config.xaxis.categories[dataPointIndex];
            const category = categories[seriesIndex];
            const value = series[seriesIndex][dataPointIndex];
      
            return `
              <div style="
                background: #111827;
                color: #fff;
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                min-width: 200px;
                ">
                <div style="color: #fff; margin-bottom: 4px;"><strong>${talukaName}</strong></div>
                <div style="color: #fff;">${category}: <span style="color: #fff;">${value} शाळा</span></div>
              </div>
            `
          },
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff'
          },
          y: {
            formatter: function(val: number) {
              return val + ' शाळा';
            }
          }
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 400
              },
              xaxis: {
                labels: {
                  rotate: -45
                }
              }
            }
          }
        ]
      }
    };
  };

  // Get chart data once to avoid multiple calls
  const chartData = createComprehensiveChartData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in-glow {
          0% {
            opacity: 0;
            filter: blur(5px);
            transform: scale(0.8);
          }
          50% {
            opacity: 0.7;
            filter: blur(2px);
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1);
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
          }
        }

        .animate-fade-in-glow {
          animation: fade-in-glow 1.5s ease-out forwards;
          opacity: 0;
        }

        @keyframes zoom-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-zoom-in {
          animation: zoom-in 1s ease-out forwards;
          opacity: 0;
        }

        @keyframes slide-up-fade {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up-fade {
          animation: slide-up-fade 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes bounce-glow {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 5px rgba(246, 59, 59, 0.2);
          }
          50% {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
          }
        }

        .hover\\:animate-bounce-glow:hover {
          animation: bounce-glow 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-lg p-1">
        {/* Header */}
        <div className="text-center mb-4">
          {/* Reorganized layout with justify-between */}
          <div className=" flex justify-between items-center text-sm  p-4 rounded-lg animate-zoom-in">
            {/* Left side - Date with days */}
            <div className="text-left">
              <div className="font-semibold text-gray-700">
                <span className="text-gray-500">Date:</span> {currentDate}
              </div>
              {currentOrder && (
                <div className="mt-2 font-semibold text-gray-700">
                  <span className="text-gray-500">Days:</span> {currentOrder.no_of_days} days
                </div>
              )}
            </div>

            {/* Center */}
            <h4 className="text-2xl font-bold mb-4 text-gray-800 animate-slide-in-right">
              <span className="font-semibold">Order Number:</span>
              <span className="ml-2 text-blue-600">{selectedOrderNo}</span>
            </h4>
            {/* Right side - Period and Financial Year */}
            {currentOrder && (
              <div className="text-right">
                <div className="font-semibold text-gray-700">
                  <span className="text-gray-500">Period:</span> {currentOrder.period}
                </div>
                <div className="mt-2 font-semibold text-gray-700">
                  <span className="text-gray-500">Financial Year:</span> {currentOrder.financial_year}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single Comprehensive Bar Chart Section */}
        <div className="mb-8">
          <div className="bg-transparent">
            {talukaData.length > 0 ? (
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="bar"
                height={400}
              />
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">No Data Available</div>
                  <div className="text-sm">Please wait for data to load...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table with reduced padding */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">अ.क्र</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">तालुका</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">एकूण शाळा</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">एकूण शाळा वाटप</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">बाकी शाळा</th>
              </tr>
            </thead>
            <tbody>
              {talukaData.map((taluka, index) => (
                <tr key={taluka.taluka_id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-sm">{taluka.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{taluka.schools_with_orders}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{taluka.distributed_schools}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{taluka.remaining_schools}</td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-sm" colSpan={2}>
                  <span className="font-bold">एकूण</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalSchoolsWithOrders}</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalDistributed}</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalRemaining}</td>
              </tr>

              {/* Percentage Row */}
              <tr className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-sm" colSpan={4}>
                  <span className="font-bold">Percentage of Schools Distributed</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-sm font-bold text-blue-800">{distributionPercentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Dashboardtaluka;