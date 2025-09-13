"use client";

import { useEffect, useMemo, useState } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { Filterdispached } from "../tables/Filterdispached";

interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
  status: string;
}

interface SchoolWiseOrder {
  id: number;
  order_id: number;
  school_id: number;
  items_data: string | Record<string, number>;
  total_weight: number;
  order_no: string;
  no_of_days: number;
  period: string;
  schoolname: string;
  udaisno: string;
  status: string;
  created_at: string;
}

interface TruckRow {
  id: number;
  truckNo: string;
  status?: string;
}
interface CenterRow {
  center_id: number;
  name: string;
  marathi_name?: string;
  status?: string;
}
interface ItemGrain {
  id: number;
  name: string;
  Unit: string;
}

// Existing inserted dispatch list row (from API GET)
type DispatchListRow = {
  id: number;
  dispatch_code: string;
  order_id: number;
  school_id: number;
  center_id: number;
  truck_id: number;
  item_name: string;
  unit: string;
  total_qty: number;
  qty_dispatch: number;
  bal_qty: number;
  status: string;
  created_at: string;
  order_no?: string;
  schoolname?: string;
  center_name?: string;
  truckNo?: string;
};

type DispatchRow = {
  schoolname: string;
  grain: string;
  totalQty: number; // remaining qty (planned - already dispatched)
  unit: string;
};

// Print Modal Component
interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchData: {
    dispatch_code: string;
    schoolname: string;
    udaisno: string;
    taluka: string;
    center_name: string;
    truckNo: string;
    date: string;
    items: Array<{
      name: string;
      qty: number;
      unit: string;
    }>;
  };
}

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, dispatchData }) => {
  // const [selectedReceiptType, setSelectedReceiptType] = useState<'kirana' | 'rice' | null>(null);

  // Separate rice items from other items - तांदुळ is rice
  const riceItems = dispatchData.items.filter(item => {
    const itemName = item.name.toLowerCase();
    return itemName.includes('rice') ||
      itemName.includes('चावल') ||
      itemName.includes('तांदुळ');
  });

  const kiranaItems = dispatchData.items.filter(item => {
    const itemName = item.name.toLowerCase();
    return !itemName.includes('rice') &&
      !itemName.includes('चावल') &&
      !itemName.includes('तांदुळ');
  });

  const generateCleanPDF = async (type: 'kirana' | 'rice') => {
    const items = type === 'rice' ? riceItems : kiranaItems;

    if (items.length === 0) {
      toast.error(`No ${type} items found`);
      return;
    }

    try {
      // Dynamically import the PDF libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      // Create a temporary div with the receipt content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';

      // Create the HTML content
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">डिलीव्हरी चलन</div>
          <div style="font-size: 16px; font-weight: 500; margin-bottom: 5px;">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
          <div style="font-size: 16px; font-weight: 500; margin-bottom: 5px;">ता. भोकरदन जि. जालना</div>
          <div style="font-size: 14px; margin-bottom: 5px;">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div>पावती क्र- <strong>${dispatchData.dispatch_code}</strong></div>
            <div>दिनांक : <strong>${dispatchData.date}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div>Udise No.- <strong>${dispatchData.udaisno}</strong></div>
            <div>तालुका: <strong>${dispatchData.taluka}</strong></div>
          </div>
        </div>

        <div style="margin: 15px 0;">
          <div style="margin-bottom: 5px;">प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
          <div style="margin-bottom: 5px;">शाळेचे नाव: <strong>${dispatchData.schoolname}</strong></div>
          <div style="margin-bottom: 5px;">केंद्र / शाळेचा पुर्ण पत्ता: <strong>${dispatchData.center_name}</strong></div>
        </div>

        <div style="margin: 15px 0; text-align: justify; line-height: 1.6;">
          आपल्या मागणी प्रमाणे आपणास माहे जुन-जुलै 2025 (38) दिवस कालावधी साठी सन 2025-2026 करीता 
          इयत्ता 1 ली ते 5 वी साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी 
          मालाचा पुरवठा वाहन क्रमांक <strong>${dispatchData.truckNo}</strong> मधुन करण्यात आला आहे.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center;">अ.क्रं.</th>
              <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center;">धान्याचे नाव</th>
              <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center;">वजन किलो ग्रॅम</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${item.name}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.qty}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin: 15px 0; text-align: justify; line-height: 1.6;">
          वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष 
          मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
        </div>

        <div style="margin-top: 40px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <div style="text-align: left; width: 50%;">
              मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर<br>
              ता. भोकरदन जि. जालना
            </div>
            <div style="text-align: right; width: 50%;">
              माल ताब्यात घेणाऱ्याची सही व शिक्का
            </div>
          </div>
        </div>
      `;

      // Add to document
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `${type === 'rice' ? 'Rice' : 'Kirana'}_Receipt_${dispatchData.dispatch_code}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(`${type === 'rice' ? 'Rice' : 'Kirana'} PDF downloaded successfully`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = (type: 'kirana' | 'rice') => {
    const items = type === 'rice' ? riceItems : kiranaItems;

    if (items.length === 0) {
      toast.error(`No ${type} items found`);
      return;
    }

    // Create print window with clean styles
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>डिलीव्हरी चलन</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      font-size: 14px;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 5px;
    }
    .subtitle-small {
      font-size: 14px;
      margin-bottom: 5px;
    }
    .info-section {
      margin-bottom: 15px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .info-left, .info-right {
      flex-basis: 50%;
    }
    .info-left {
      text-align: left;
    }
    .info-right {
      text-align: right;
    }
    .recipient-info {
      margin: 15px 0;
    }
    .recipient-info div {
      margin-bottom: 5px;
    }
    .description-text {
      margin: 15px 0;
      font-size: 14px;
      line-height: 1.6;
      text-align: justify;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .table th, .table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-size: 14px;
    }
    .table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .table td:first-child {
      width: 50px;
    }
    .table td:nth-child(2) {
      text-align: left;
      width: 60%;
    }
    .table td:last-child {
      width: 100px;
    }
    .footer {
      margin-top: 30px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      font-size: 14px;
    }
    .signature-left {
      text-align: left;
      width: 50%;
    }
    .signature-right {
      text-align: right;
      width: 50%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">डिलीव्हरी चलन</div>
      <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
      <div class="subtitle">ता. भोकरदन जि. जालना</div>
      <div class="subtitle-small">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
        <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
      </div>
      <div class="info-row">
        <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
        <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
      </div>
    </div>

    <div class="recipient-info">
      <div>प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
      <div>शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
      <div>केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
    </div>

    <div class="description-text">
      आपल्या मागणी प्रमाणे आपणास माहे जुन-जुलै 2025 (38) दिवस कालावधी साठी सन 2025-2026 करीता इयत्ता 1 ली ते 5 वी साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>अ.क्रं.</th>
          <th>धान्याचे नाव</th>
          <th>वजन किलो ग्रॅम</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.qty}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="description-text">
      वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
    </div>

    <div class="footer">
      <div class="signature-section">
        <div class="signature-left">
          मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरदन जि. जालना
        </div>
        <div class="signature-right">
          माल ताब्यात घेणाऱ्याची सही व शिक्का
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-9999">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Print Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              Select receipt type to print or download
            </p>
          </div> */}

          {/* Dispatch Data Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Dispatch Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Dispatch Code:</strong> {dispatchData.dispatch_code}</div>
                <div><strong>Date:</strong> {dispatchData.date}</div>
                <div><strong>School:</strong> {dispatchData.schoolname}</div>
                <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
                <div><strong>Center:</strong> {dispatchData.center_name}</div>
                <div><strong>Truck No:</strong> {dispatchData.truckNo}</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Sr. No.</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Unit</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchData.items.map((item, index: number) => {
                    const isRice = riceItems.some(ri => ri.name === item.name);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{item.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.qty}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.unit}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isRice 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isRice ? 'Rice' : 'Kirana'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                // setSelectedReceiptType('kirana');
                handlePrint('kirana');
              }}
              className="flex-1 min-w-[200px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Kirana Receipt ({kiranaItems.length} items)
            </button>

            <button
              onClick={() => {
                // setSelectedReceiptType('rice');
                handlePrint('rice');
              }}
              className="flex-1 min-w-[200px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Rice Receipt ({riceItems.length} items)
            </button>

            <button
              onClick={() => generateCleanPDF('kirana')}
              className="flex-1 min-w-[200px] px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Download Kirana PDF
            </button>

            <button
              onClick={() => generateCleanPDF('rice')}
              className="flex-1 min-w-[200px] px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Download Rice PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dipatchdetials = () => {
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastDispatchData, setLastDispatchData] = useState<{
    dispatch_code: string;
    schoolname: string;
    udaisno: string;
    taluka: string;
    center_name: string;
    truckNo: string;
    date: string;
    items: Array<{
      name: string;
      qty: number;
      unit: string;
    }>;
  } | null>(null);

  // Filters
  const [orderNo, setOrderNo] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Masters
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [truckList, setTruckList] = useState<TruckRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

  // Existing dispatch list
  const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);

  // State to gate input mode and reset when filters change
  const [didSearch, setDidSearch] = useState(false);

  // reset search gate when any filter changes
  useEffect(() => { setDidSearch(false); }, [orderNo, selectedTruckId, selectedCenterId, selectedSchoolId]);

  // Fetchers
  const fetchZpOrders = async () => {
    try {
      const response = await fetch('/api/zporderdetails');
      const data = await response.json();
      setZpOrders(data);
    } catch (error) {
      console.error('Error fetching ZP orders:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const fetchSchoolWiseOrders = async () => {
    try {
      const response = await fetch('/api/schoolwiseorders');
      const data = await response.json();
      setSchoolWiseOrders(data);
    } catch (error) {
      console.error('Error fetching school-wise orders:', error);
      toast.error('Failed to fetch school-wise orders');
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await fetch('/api/truckdata');
      setTruckList(await res.json());
    } catch {
      toast.error('Failed to load trucks');
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/centerapi');
      setCenterList(await res.json());
    } catch {
      toast.error('Failed to load centers');
    }
  };

  const fetchItemMaster = async () => {
    try {
      const res = await fetch('/api/itemgrains');
      if (res.ok) setItemGrains(await res.json());
    } catch { }
  };

  const fetchDispatchList = async () => {
    try {
      const res = await fetch('/api/dispatchdetails');
      if (res.ok) setDispatchList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchZpOrders();
    fetchSchoolWiseOrders();
    fetchTrucks();
    fetchCenters();
    fetchItemMaster();
    fetchDispatchList();
  }, []);

  // Options
  const orderNoOptions = useMemo(() => [
    { value: '', label: 'Select Order Number' },
    ...zpOrders.map(order => ({ value: String(order.id), label: order.order_no }))
  ], [zpOrders]);

  const truckOptions = useMemo(() => [
    { value: '', label: 'Select Truck' },
    ...truckList.map(t => ({ value: String(t.id), label: t.truckNo }))
  ], [truckList]);

  const centerOptions = useMemo(() => [
    { value: '', label: 'Select Center' },
    ...centerList.map(c => ({ value: String(c.center_id), label: c.name || c.marathi_name || String(c.center_id) }))
  ], [centerList]);

  const schoolOptions = useMemo(() => {
    if (!orderNo) return [{ value: '', label: 'Select School' }];
    const uniq = new Map<number, { value: string; label: string }>();
    schoolWiseOrders
      .filter(s => String(s.order_id) === orderNo)
      .forEach(s => {
        uniq.set(s.school_id, { value: String(s.school_id), label: s.schoolname });
      });
    return [{ value: '', label: 'Select School' }, ...Array.from(uniq.values())];
  }, [orderNo, schoolWiseOrders]);

  const handleOrderChange = (orderId: string) => {
    setOrderNo(orderId);
    setSelectedSchoolId('');
  };

  // Selected target (order + school)
  const selectedOrderSchool = useMemo(() => {
    if (!orderNo || !selectedSchoolId) return null;
    return schoolWiseOrders.find(
      s => String(s.order_id) === orderNo && String(s.school_id) === selectedSchoolId
    ) || null;
  }, [orderNo, selectedSchoolId, schoolWiseOrders]);

  // Sum already dispatched per item for selected order + school
  const dispatchedByItem = useMemo<Record<string, number>>(() => {
    if (!orderNo || !selectedSchoolId) return {};
    const map: Record<string, number> = {};
    dispatchList
      .filter(d => String(d.order_id) === orderNo && String(d.school_id) === selectedSchoolId)
      .forEach(d => {
        const key = d.item_name.trim();
        map[key] = (map[key] || 0) + Number(d.qty_dispatch || 0);
      });
    return map;
  }, [dispatchList, orderNo, selectedSchoolId]);

  // Build input-mode rows with remaining qty (planned - already dispatched)
  const dispatchRows = useMemo<DispatchRow[]>(() => {
    if (!selectedOrderSchool) return [];
    const items = typeof selectedOrderSchool.items_data === 'string'
      ? JSON.parse(selectedOrderSchool.items_data as unknown as string)
      : (selectedOrderSchool.items_data || {});
    const rows: DispatchRow[] = [];

    Object.entries(items)
      .filter(([, v]) => Number(v) > 0)
      .forEach(([k, v]) => {
        const master = itemGrains.find(g => g.name.trim() === k.trim());
        const planned = Number(v) || 0;
        const already = Number(dispatchedByItem[k] || 0);
        const remaining = Math.max(0, planned - already);
        rows.push({
          schoolname: selectedOrderSchool.schoolname,
          grain: k,
          totalQty: remaining,
          unit: master?.Unit || 'kg',
        });
      });

    return rows;
  }, [selectedOrderSchool, itemGrains, dispatchedByItem]);

  // Inputs map for qty dispatch
  const [dispatchInputs, setDispatchInputs] = useState<Record<string, number>>({});
  useEffect(() => { setDispatchInputs({}); }, [selectedOrderSchool?.id]);

  // Input-mode columns
  const inputColumns: Column<DispatchRow>[] = [

    { key: 'grain', label: 'Item', accessor: 'grain', render: (row) => <span>{row.grain}</span> },
    { key: 'unit', label: 'Unit', accessor: 'unit', render: (row) => <span>{row.unit}</span> },
    { key: 'totalQty', label: 'Quantity', accessor: 'totalQty', render: (row) => <span>{row.totalQty}</span> },
    {
      key: 'qtyDispatch',
      label: 'Qty Dispatch',
      render: (row) => (
        <input
          type="number"
          min={0}
          max={row.totalQty}
          className="h-9 w-28 rounded border px-2 text-sm"
          value={dispatchInputs[row.grain] ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            // cap to remaining qty
            const capped = Math.min(Math.max(0, val), Number(row.totalQty));
            setDispatchInputs(prev => ({ ...prev, [row.grain]: capped }));
          }}
        />
      )
    },
    {
      key: 'balQty',
      label: 'Bal Qtsy',
      render: (row) => {
        const qd = dispatchInputs[row.grain] ?? 0;
        const bal = Math.max(0, Number(row.totalQty) - Number(qd));
        return <span>{bal}</span>;
      }
    },
  ];

  // Read-only list columns (default view) with eye icon for print
  const listColumns: Column<DispatchListRow>[] = [
    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (r) => <span>{r.order_no || r.order_no}</span> },
    {
      key: 'schoolname',
      label: 'School',
      accessor: 'schoolname',
      render: (r) => (
        <div className="flex items-center justify-between">
          <span>{r.schoolname || r.schoolname}</span>
      
        </div>
      )
    },
    { key: 'center_name', label: 'Center', accessor: 'center_name', render: (r) => <span>{r.center_name || r.center_id}</span> },
    { key: 'truckNo', label: 'Truck', accessor: 'truckNo', render: (r) => <span>{r.truckNo || r.truck_id}</span> },
    {
      key: 'schoolname',
      label: 'Action',
      accessor: 'schoolname',
      render: (r) => (
        <div className="flex items-center justify-between">
          {/* <span>{r.schoolname || r.schoolname}</span> */}
          <button
            onClick={() => {
              // Get all items for this school and order
              const schoolDispatchItems = dispatchList
                .filter(d => d.schoolname === r.schoolname && d.order_no === r.order_no)
                .map(d => ({
                  name: d.item_name,
                  qty: d.qty_dispatch,
                  unit: d.unit
                }));

              const dispatchData = {
                dispatch_code: r.dispatch_code,
                schoolname: r.schoolname || '',
                udaisno: schoolWiseOrders.find(s => s.schoolname === r.schoolname)?.udaisno || '',
                taluka: 'शहादा', // You can make this dynamic
                center_name: r.center_name || '',
                truckNo: r.truckNo || '',
                date: new Date(r.created_at).toLocaleDateString('en-GB'),
                items: schoolDispatchItems
              };

              setLastDispatchData(dispatchData);
              setShowPrintModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded ml-2"
            title="Print Receipt for this School"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )
    },
    // please do not comment out
    
    // { key: 'item_name', label: 'Item', accessor: 'item_name', render: (r) => <span>{r.item_name}</span> },
    // { key: 'unit', label: 'Unit', accessor: 'unit', render: (r) => <span>{r.unit}</span> },
    // { key: 'qty_dispatch', label: 'Dispatch', accessor: 'qty_dispatch', render: (r) => <span>{r.qty_dispatch}</span> },
    // { key: 'bal_qty', label: 'Bal Qty', accessor: 'bal_qty', render: (r) => <span>{r.bal_qty}</span> },
    // { key: 'created_at', label: 'Created', accessor: 'created_at', render: (r) => <span>{new Date(r.created_at).toLocaleString()}</span> },
  ];

  const allFiltersSelected = Boolean(orderNo && selectedTruckId && selectedCenterId && selectedSchoolId);
  const showInputMode = allFiltersSelected && didSearch;

  const toolbar = (
    <div className="grid grid-cols-6 gap-2 items-center">
      <div className="flex flex-col">
        <span className="text-xs text-gray-600 mb-1 text-left">Order Number</span>
        <select
          className="h-10  rounded-md border px-3 text-sm"
          value={orderNo}
          onChange={(e) => { handleOrderChange(e.target.value); }}
        >
          {orderNoOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Order Number'}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-600 mb-1 text-left">Truck</span>
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={selectedTruckId}
          onChange={(e) => setSelectedTruckId(e.target.value)}
        >
          {truckOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Truck'}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-600 mb-1 text-left">Center</span>
        <select
          className="h-10  rounded-md border px-3 text-sm"
          value={selectedCenterId}
          onChange={(e) => setSelectedCenterId(e.target.value)}
        >
          {centerOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Center'}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-600 mb-1 text-left">School</span>
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value)}
          disabled={!orderNo}
        >
          {schoolOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select School'}</option>)}
        </select>
      </div>
      <button
        type="button"
        className="h-10 px-4 rounded-md bg-gray-600 text-white text-sm font-medium mt-5"
        onClick={() => {
          if (!allFiltersSelected) {
            toast.error('Select Order, Truck, Center, and School');
            return;
          }
          setDidSearch(true);
        }}
      >
        Search
      </button>

      <button
        type="button"
        className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium mt-5"
        onClick={async () => {
          try {
            if (!orderNo || !selectedTruckId || !selectedCenterId || !selectedSchoolId) {
              toast.error('Select Order, Truck, Center, and School');
              return;
            }
            if (dispatchRows.length === 0) {
              toast.error('No items to dispatch');
              return;
            }
            
            // Fix: Define lines variable here
            const lines = dispatchRows
              .map(r => ({
                grain: r.grain,
                unit: r.unit,
                totalQty: r.totalQty,
                qtyDispatch: Number(dispatchInputs[r.grain] ?? 0),
              }))
              .filter(l => l.qtyDispatch > 0);
              
            if (lines.length === 0) {
              toast.error('Enter at least one dispatch quantity');
              return;
            }
            
            setLoading(true);
            const resp = await fetch('/api/dispatchdetails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: Number(orderNo),
                school_id: Number(selectedSchoolId),
                center_id: Number(selectedCenterId),
                truck_id: Number(selectedTruckId),
                lines
              }),
            });
            if (!resp.ok) {
              const er = await resp.json().catch(() => ({}));
              throw new Error(er.message || 'Failed to save dispatch');
            }
            const ok = await resp.json();
            toast.success(`Dispatch saved (Code: ${ok.dispatch_code})`);

            // Prepare dispatch data for print modal
            const dispatchItems = lines.map(line => ({
              name: line.grain,
              qty: line.qtyDispatch,
              unit: line.unit
            }));

            const selectedTruck = truckList.find(t => String(t.id) === selectedTruckId);
            const selectedCenter = centerList.find(c => String(c.center_id) === selectedCenterId);
            const selectedSchool = schoolWiseOrders.find(s => String(s.school_id) === selectedSchoolId);

            const dispatchData = {
              dispatch_code: ok.dispatch_code,
              schoolname: selectedSchool?.schoolname || '',
              udaisno: selectedSchool?.udaisno || '',
              taluka: 'शहादा', // You can make this dynamic
              center_name: selectedCenter?.name || selectedCenter?.marathi_name || '',
              truckNo: selectedTruck?.truckNo || '',
              date: new Date().toLocaleDateString('en-GB'),
              items: dispatchItems
            };

            setLastDispatchData(dispatchData);
            setShowPrintModal(true);

            setDispatchInputs({});
            // clear filters after successful submit
            setOrderNo('');
            setSelectedTruckId('');
            setSelectedCenterId('');
            setSelectedSchoolId('');
            setDidSearch(false);
            await fetchDispatchList(); // refresh list
          } catch {
            toast.error('Failed to save');
          } finally {
            setLoading(false);
            setDidSearch(false);
          }
        }}
        disabled={loading || !showInputMode}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );

  return (
    <div className="">
      {showInputMode ? (
        <Filterdispached
          data={dispatchRows}
          columns={inputColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={toolbar}
        />
      ) : (
        <Filterdispached
          data={dispatchList}
          columns={listColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={toolbar}
          groupByKey="schoolname"
          colspanKeys={["order_no", "schoolname", "center_name", "truckNo"]}
        />
      )}

      {lastDispatchData && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          dispatchData={lastDispatchData}
        />
      )}
    </div>
  );
};

export default Dipatchdetials;