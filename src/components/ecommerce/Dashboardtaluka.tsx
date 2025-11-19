'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Interface matching the expected API response structure (raw data types)
interface TalukaApiResponse {
  taluka_id: number;
  name: string;
  name_en: string;
  company_id: number | null;
  company_name: string | null;
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
  company_id: number | null;
  company_name: string | null;
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

// Interface matching the expected API response structure for centers (raw data types)
interface CenterApiResponse {
  center_id: number;
  name: string;
  marathi_name: string;
  taluka_id: number;
  taluka_name: string;
  total_schools: string | number;
  schools_with_orders: string | number;
  distributed_schools: string | number;
  remaining_schools: string | number;
}

// Interface for transformed center dashboard data
interface CenterData {
  center_id: number;
  name: string;
  marathi_name: string;
  taluka_id: number;
  taluka_name: string;
  total_schools: number;
  schools_with_orders: number;
  distributed_schools: number;
  remaining_schools: number;
  date: string;
}

const Dashboardtaluka = () => {
  const [talukaData, setTalukaData] = useState<TalukaData[]>([]);
  const [centerData, setCenterData] = useState<CenterData[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>('0');
  const [availableOrderNumbers, setAvailableOrderNumbers] = useState<Array<{order_no: string, period: string, financial_year: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [orderNumbersLoading, setOrderNumbersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'taluka' | 'center'>('taluka');
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  // Fetch all available order numbers
  const fetchOrderNumbers = useCallback(async () => {
    try {
      setOrderNumbersLoading(true);
      const storedCompanyId = sessionStorage.getItem('company_id');
      
      if (!storedCompanyId) {
        console.error('Company ID not found in sessionStorage');
        setOrderNumbersLoading(false);
        return;
      }

      const orderParams = new URLSearchParams();
      if (storedCompanyId && storedCompanyId.trim() !== '') {
        orderParams.append('company_id', storedCompanyId.trim());
      }

      const zpOrderResponse = await fetch(`/api/zporderdetails?${orderParams.toString()}`, {
        cache: 'no-store'
      });

      if (!zpOrderResponse.ok) {
        throw new Error('Failed to fetch order details');
      }

      const zpOrderData = await zpOrderResponse.json();
      
      // Extract unique order numbers with their details
      const uniqueOrders = new Map<string, {order_no: string, period: string, financial_year: string}>();
      if (Array.isArray(zpOrderData)) {
        zpOrderData.forEach((order: {order_no: string | number, period?: string, financial_year?: string}) => {
          if (order.order_no) {
            const orderNo = String(order.order_no);
            if (!uniqueOrders.has(orderNo)) {
              uniqueOrders.set(orderNo, {
                order_no: orderNo,
                period: order.period || '',
                financial_year: order.financial_year || ''
              });
            }
          }
        });
      }

      const ordersArray = Array.from(uniqueOrders.values()).sort((a, b) => {
        // Sort by order_no (numeric if possible, otherwise string)
        const aNum = parseInt(a.order_no);
        const bNum = parseInt(b.order_no);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum; // Descending order (newest first)
        }
        return b.order_no.localeCompare(a.order_no);
      });

      setAvailableOrderNumbers(ordersArray);

      // Set the first order as default if no order is selected
      if (ordersArray.length > 0) {
        setSelectedOrderNo((prevOrderNo) => {
          if (prevOrderNo === '0') {
            return ordersArray[0].order_no;
          }
          return prevOrderNo;
        });
      }
    } catch (error) {
      console.error('Error fetching order numbers:', error);
    } finally {
      setOrderNumbersLoading(false);
    }
  }, []); // Empty dependency array - only fetch once on mount

  // Get company_id from sessionStorage and fetch data filtered by company_id only
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Get company_id from sessionStorage (only company_id filtering, no user_id)
      const storedCompanyId = sessionStorage.getItem('company_id');
      
      if (!storedCompanyId) {
        console.error('Company ID not found in sessionStorage');
        setLoading(false);
        return;
      }

      // Use the selected order number from state
      const orderNoToUse = selectedOrderNo || '0';

      // Build query parameters for taluka and center dashboard APIs (only company_id)
      const params = new URLSearchParams();
      params.append('order_no', orderNoToUse);
      if (storedCompanyId && storedCompanyId.trim() !== '') {
        params.append('company_id', storedCompanyId.trim());
      }

      // Build query parameters for count API (without order_no, only company_id)
      const countParams = new URLSearchParams();
      if (storedCompanyId && storedCompanyId.trim() !== '') {
        countParams.append('company_id', storedCompanyId.trim());
      }

      // Fetch taluka data, center data, and order counts with company_id only
      const [talukaResponse, centerResponse, orderCountsResponse] = await Promise.all([
        fetch(`/api/talukadashboard?${params.toString()}`, {
          cache: 'no-store'
        }),
        fetch(`/api/centerdashboard?${params.toString()}`, {
          cache: 'no-store'
        }),
        fetch(`/api/schoolwiseorders/count?${countParams.toString()}`, {
          cache: 'no-store'
        })
      ]);

      if (!talukaResponse.ok || !centerResponse.ok || !orderCountsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const talukaData: TalukaApiResponse[] = await talukaResponse.json();
      const centerDataRaw: CenterApiResponse[] = await centerResponse.json();
      const orderCountsData: OrderCount[] = await orderCountsResponse.json();

      // Transform taluka data
      const processedTalukaData: TalukaData[] = talukaData.map((taluka) => {
        const totalSchools = typeof taluka.total_schools === 'string'
          ? parseInt(taluka.total_schools) || 0
          : taluka.total_schools;
        const schoolsWithOrders = typeof taluka.schools_with_orders === 'string'
          ? parseInt(taluka.schools_with_orders) || 0
          : taluka.schools_with_orders || 0;
        const distributedSchools = typeof taluka.distributed_schools === 'string'
          ? parseInt(taluka.distributed_schools) || 0
          : taluka.distributed_schools;
        // Calculate remaining schools: एकूण शाळा - एकूण शाळा वाटप = बाकी शाळा
        const remainingSchools = Math.max(0, schoolsWithOrders - distributedSchools);
        
        return {
          taluka_id: taluka.taluka_id,
          name: taluka.name,
          name_en: taluka.name_en,
          company_id: taluka.company_id || null,
          company_name: taluka.company_name || 'N/A',
          total_schools: totalSchools,
          schools_with_orders: schoolsWithOrders,
          distributed_schools: distributedSchools,
          remaining_schools: remainingSchools,
          date: currentDate
        };
      });

      // Transform center data
      const processedCenterData: CenterData[] = centerDataRaw.map((center) => {
        const totalSchools = typeof center.total_schools === 'string'
          ? parseInt(center.total_schools) || 0
          : center.total_schools;
        const schoolsWithOrders = typeof center.schools_with_orders === 'string'
          ? parseInt(center.schools_with_orders) || 0
          : center.schools_with_orders || 0;
        const distributedSchools = typeof center.distributed_schools === 'string'
          ? parseInt(center.distributed_schools) || 0
          : center.distributed_schools;
        // Calculate remaining schools: एकूण शाळा - एकूण शाळा वाटप = बाकी शाळा
        const remainingSchools = Math.max(0, schoolsWithOrders - distributedSchools);
        
        return {
          center_id: center.center_id,
          name: center.name,
          marathi_name: center.marathi_name || center.name,
          taluka_id: center.taluka_id,
          taluka_name: center.taluka_name || '',
          total_schools: totalSchools,
          schools_with_orders: schoolsWithOrders,
          distributed_schools: distributedSchools,
          remaining_schools: remainingSchools,
          date: currentDate
        };
      });

      setTalukaData(processedTalukaData);
      setCenterData(processedCenterData);
      setOrderCounts(orderCountsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedOrderNo]); // Include selectedOrderNo to refetch when it changes

  // Handler for order number change
  const handleOrderNoChange = (orderNo: string) => {
    setSelectedOrderNo(orderNo);
  };

  // Fetch order numbers on component mount
  useEffect(() => {
    fetchOrderNumbers();
  }, [fetchOrderNumbers]);

  // Fetch data when selectedOrderNo changes and order numbers are available
  useEffect(() => {
    if (selectedOrderNo !== '0' && availableOrderNumbers.length > 0) {
      fetchData();
    }
  }, [selectedOrderNo, availableOrderNumbers.length, fetchData]);

  // Calculate totals for taluka
  const totalTalukaSchoolsWithOrders = talukaData.reduce((sum, taluka) => sum + taluka.schools_with_orders, 0);
  const totalTalukaDistributed = talukaData.reduce((sum, taluka) => sum + taluka.distributed_schools, 0);
  const totalTalukaRemaining = talukaData.reduce((sum, taluka) => sum + taluka.remaining_schools, 0);
  const talukaDistributionPercentage = totalTalukaSchoolsWithOrders > 0
    ? ((totalTalukaDistributed / totalTalukaSchoolsWithOrders) * 100).toFixed(1)
    : '0.0';

  // Group center data by taluka and calculate center counts
  const centerDataByTaluka = useMemo(() => {
    const grouped: Record<number, {
      taluka_id: number;
      taluka_name: string;
      total_centers: number;
      completed_centers: number; // Centers with all schools distributed (remaining = 0)
      pending_centers: number; // Centers with pending schools (remaining > 0)
    }> = {};

    // First, initialize all talukas from talukaData with 0 values
    talukaData.forEach(taluka => {
      grouped[taluka.taluka_id] = {
        taluka_id: taluka.taluka_id,
        taluka_name: taluka.name || '',
        total_centers: 0,
        completed_centers: 0,
        pending_centers: 0
      };
    });

    // Then, process center data and update the grouped object
    centerData.forEach(center => {
      if (!grouped[center.taluka_id]) {
        grouped[center.taluka_id] = {
          taluka_id: center.taluka_id,
          taluka_name: center.taluka_name || '',
          total_centers: 0,
          completed_centers: 0,
          pending_centers: 0
        };
      }

      grouped[center.taluka_id].total_centers += 1;
      if (center.remaining_schools === 0 && center.schools_with_orders > 0) {
        grouped[center.taluka_id].completed_centers += 1;
      } else if (center.remaining_schools > 0) {
        grouped[center.taluka_id].pending_centers += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => a.taluka_name.localeCompare(b.taluka_name));
  }, [centerData, talukaData]);

  // Calculate totals for center counts
  const totalCentersAllTalukas = centerDataByTaluka.reduce((sum, item) => sum + item.total_centers, 0);
  const totalCompletedCenters = centerDataByTaluka.reduce((sum, item) => sum + item.completed_centers, 0);
  const totalPendingCenters = centerDataByTaluka.reduce((sum, item) => sum + item.pending_centers, 0);
  const centerCompletionPercentage = totalCentersAllTalukas > 0
    ? ((totalCompletedCenters / totalCentersAllTalukas) * 100).toFixed(1)
    : '0.0';

  // Get current order details
  const currentOrder = orderCounts.find(order => order.order_no === selectedOrderNo);

  // Function to create chart data for taluka view
  const createTalukaChartData = () => {
    // Check if we have taluka data
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
            const itemName = w.config.xaxis.categories[dataPointIndex];
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
                <div style="color: #fff; margin-bottom: 4px;"><strong>${itemName}</strong></div>
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

  // Function to create chart data for center view
  const createCenterChartData = () => {
    // Check if we have taluka data (even if no center data)
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

    // Use centerDataByTaluka which now includes all talukas
    if (!centerDataByTaluka || centerDataByTaluka.length === 0) {
      // If no center data but we have talukas, show talukas with 0 values
      const talukaNames = talukaData.map(taluka => taluka.name);
      return {
        series: [
          {
            name: 'एकूण केंद्र',
            data: new Array(talukaNames.length).fill(0),
          },
          {
            name: 'एकूण केंद्र वाटप',
            data: new Array(talukaNames.length).fill(0),
          },
          {
            name: 'बाकी केंद्र',
            data: new Array(talukaNames.length).fill(0),
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
              text: 'केंद्र संख्या',
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
            text: 'केंद्र-निहाय वाटप विवरण',
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
              const categories = ['एकूण केंद्र', 'एकूण केंद्र वाटप', 'बाकी केंद्र'];
              const itemName = w.config.xaxis.categories[dataPointIndex];
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
                  <div style="color: #fff; margin-bottom: 4px;"><strong>${itemName}</strong></div>
                  <div style="color: #fff;">${category}: <span style="color: #fff;">${value} केंद्र</span></div>
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
                return val + ' केंद्र';
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
    }

    const talukaNames = centerDataByTaluka.map(item => item.taluka_name);
    const totalCentersData = centerDataByTaluka.map(item => item.total_centers);
    const completedCentersData = centerDataByTaluka.map(item => item.completed_centers);
    const pendingCentersData = centerDataByTaluka.map(item => item.pending_centers);

    return {
      series: [
        {
          name: 'एकूण केंद्र',
          data: totalCentersData,
        },
        {
          name: 'एकूण केंद्र वाटप',
          data: completedCentersData,
        },
        {
          name: 'बाकी केंद्र',
          data: pendingCentersData,
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
            text: 'केंद्र संख्या',
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
          text: 'केंद्र-निहाय वाटप विवरण',
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
            const categories = ['एकूण केंद्र', 'एकूण केंद्र वाटप', 'बाकी केंद्र'];
            const itemName = w.config.xaxis.categories[dataPointIndex];
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
                <div style="color: #fff; margin-bottom: 4px;"><strong>${itemName}</strong></div>
                <div style="color: #fff;">${category}: <span style="color: #fff;">${value} केंद्र</span></div>
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
              return val + ' केंद्र';
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

  // Get chart data based on active tab
  const chartData = useMemo(() => {
    if (activeTab === 'taluka') {
      return createTalukaChartData();
    } else {
      return createCenterChartData();
    }
  }, [talukaData, centerDataByTaluka, activeTab]);

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
        {/* Order Number Filter */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <label htmlFor="orderNoFilter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Filter by Order Number:
            </label>
            <select
              id="orderNoFilter"
              value={selectedOrderNo}
              onChange={(e) => handleOrderNoChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              disabled={!orderNumbersLoading && availableOrderNumbers.length === 0}
            >
              {orderNumbersLoading ? (
                <option value="0">Loading order numbers...</option>
              ) : availableOrderNumbers.length === 0 ? (
                <option value="0">No Data Available</option>
              ) : (
                availableOrderNumbers.map((order) => (
                  <option key={order.order_no} value={order.order_no}>
                    {order.order_no} {order.period ? `- ${order.period}` : ''} {order.financial_year ? `(${order.financial_year})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Show message when no order numbers are available */}
        {!orderNumbersLoading && availableOrderNumbers.length === 0 ? (
          <div className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-800 mb-2">No Data Available</div>
                <div className="text-sm text-yellow-700">No order numbers are available for this company.</div>
              </div>
            </div>
          </div>
        ) : (
          <>
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

        {/* Tabs - At the top to control both chart and table - Button style */}
        <div className="mb-6">
          <div className="grid grid-cols-12 gap-3">
            <button
              onClick={() => setActiveTab('taluka')}
              className={`col-span-6 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'taluka'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
              }`}
            >
              तालुका निहाय
            </button>
            <button
              onClick={() => setActiveTab('center')}
              className={`col-span-6 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'center'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
              }`}
            >
              केंद्र निहाय
            </button>
          </div>
        </div>

        {/* Bar Chart Section - Changes based on active tab */}
        <div className="mb-8">
          <div className="bg-transparent">
            {activeTab === 'taluka' && talukaData.length > 0 ? (
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="bar"
                height={400}
              />
            ) : activeTab === 'center' && centerDataByTaluka.length > 0 ? (
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
          {activeTab === 'taluka' ? (
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
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalTalukaSchoolsWithOrders}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalTalukaDistributed}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalTalukaRemaining}</td>
                </tr>

                {/* Percentage Row */}
                <tr className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-sm" colSpan={4}>
                    <span className="font-bold">एकूण वाटप(%)</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm font-bold text-blue-800">{talukaDistributionPercentage}%</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">अ.क्र</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">तालुका</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">एकूण केंद्र</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">एकूण केंद्र वाटप</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">बाकी केंद्र</th>
                </tr>
              </thead>
              <tbody>
                {centerDataByTaluka.map((item, index) => (
                  <tr key={item.taluka_id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-sm">{item.taluka_name || 'N/A'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.total_centers}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.completed_centers}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.pending_centers}</td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-sm" colSpan={2}>
                    <span className="font-bold">एकूण</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalCentersAllTalukas}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalCompletedCenters}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{totalPendingCenters}</td>
                </tr>

                {/* Percentage Row */}
                <tr className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-sm" colSpan={4}>
                    <span className="font-bold">एकूण वाटप(%)</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm font-bold text-blue-800">{centerCompletionPercentage}%</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
};
export default Dashboardtaluka;