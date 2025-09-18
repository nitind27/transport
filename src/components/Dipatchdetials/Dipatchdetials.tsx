"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { Filterdispached } from "../tables/Filterdispached";
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Modal } from '../ui/modal';

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
  schoolname: string;  // from JOIN
  udaisno: string;     // from JOIN
  status: string;
  created_at: string;
  class_range?: string; // ensure present
}
// Add proper type declarations for flatpickr
declare module 'flatpickr' {
  interface Instance {
    destroy(): void;
    clear(): void;
  }

  interface BaseOptions {
    dateFormat?: string;
    defaultDate?: Date | string | number | Date[] | string[] | number[];
    onChange?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    static?: boolean;
    monthSelectorType?: "static" | "dropdown";
    enableTime?: boolean;
    allowInput?: boolean;
    clickOpens?: boolean;
    locale?: {
      firstDayOfWeek?: number;
    };
  }
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
  taluka_id?: number; // ensure we can filter centers by taluka
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
  class_range?: string;
  taluka?: string; // add this
};

type DispatchRow = {
  schoolname: string;
  grain: string;
  totalQty: number; // Original planned quantity
  remainingQty: number; // Remaining quantity after dispatch
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
    class_range?: string; // add
    items: Array<{
      name: string;
      qty: number;
      unit: string;
    }>;
  };
}
interface TalukaRow {
  taluka_id: number;
  name: string;
  name_en?: string;
  dist_id?: number;
  status?: string;
}


const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, dispatchData }) => {
  const [previewType, setPreviewType] = useState<'kirana' | 'rice' | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
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

  const generatePreview = (type: 'kirana' | 'rice') => {
    const items = type === 'rice' ? riceItems : kiranaItems;

    if (items.length === 0) {
      toast.error(`No ${type} items found`);
      return;
    }

    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>डिलीव्हरी चलन</title>
  <style>
    @page {
      margin: 0;
      size: A5; /* Half of A4 */
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 15px;
      font-size: 12px; /* Smaller font for half-size */
      line-height: 1.3;
      color: #000;
      background: white;
      width: 148mm; /* A5 width */
      height: 210mm; /* A5 height */
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .subtitle-small {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .info-section {
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
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
      margin: 12px 0;
    }
    .recipient-info div {
      margin-bottom: 4px;
    }
    .description-text {
      margin: 12px 0;
      font-size: 12px;
      line-height: 1.4;
      text-align: justify;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11px;
    }
    .table th, .table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: center;
      font-size: 11px;
    }
    .table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .table td:first-child {
      width: 40px;
    }
    .table td:nth-child(2) {
      text-align: left;
      width: 60%;
    }
    .table td:last-child {
      width: 80px;
    }
    .footer {
      margin-top: 25px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      font-size: 12px;
    }
    .signature-left {
      text-align: left;
      width: 50%;
    }
    .signature-right {
      text-align: right;
      width: 50%;
    }
    
    /* Hide elements when printing */
    @media print {
      body {
        padding: 10px;
      }
      /* Hide any browser-added elements like page numbers, URLs, etc. */
      @page {
        margin: 0;
        size: A5;
        /* Remove any default headers/footers */
        marks: none;
        -webkit-print-color-adjust: exact;
      }
      /* Hide URL and page info that browsers might add */
      ::after, ::before {
        content: none !important;
      }
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
    setIsPreviewOpen(true);
    setPreviewType(type);
    setPreviewContent(content);
  };

  const printPreview = () => {
    if (!previewContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const copyHeadings = [
      'हेड मास्टर',
      'बी.आर. सी ऑफीस (तालुका ऑफीस)',
      'जिल्हा परिषद ऑफीस',
      'O .C'
    ];
    // Create content with 4 copies
    const fourCopiesContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>डिलीव्हरी चलन - 4 Copies</title>
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
      padding: 10px;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: white;
    }
    .copy-container {
      width: 100%;
      margin-bottom: 20px;
      page-break-after: always;
    }
    .copy-container:last-child {
      page-break-after: avoid;
    }
    .copy-header {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .subtitle-small {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .info-section {
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
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
      margin: 12px 0;
    }
    .recipient-info div {
      margin-bottom: 4px;
    }
    .description-text {
      margin: 12px 0;
      font-size: 12px;
      line-height: 1.4;
      text-align: justify;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11px;
    }
    .table th, .table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: center;
      font-size: 11px;
    }
    .table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .table td:first-child {
      width: 40px;
    }
    .table td:nth-child(2) {
      text-align: left;
      width: 60%;
    }
    .table td:last-child {
      width: 80px;
    }
    .footer {
      margin-top: 25px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      font-size: 12px;
    }
    .signature-left {
      text-align: left;
      width: 50%;
    }
    .signature-right {
      text-align: right;
      width: 50%;
    }
    
    /* Hide elements when printing */
    @media print {
      body {
        padding: 10px;
      }
      @page {
        margin: 0;
        size: A4;
        marks: none;
        -webkit-print-color-adjust: exact;
      }
      ::after, ::before {
        content: none !important;
      }
    }
  </style>
</head>
<body>
 ${Array.from({ length: 4 }, (_, copyIndex) => `
    <div class="copy-container">
      <div class="copy-header">${copyHeadings[copyIndex]}</div>
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
            ${(previewType === 'rice' ? riceItems : kiranaItems).map((item, index) => `
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
    </div>
  `).join('')}
</body>
</html>
    `;

    printWindow.document.write(fourCopiesContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();

      // Add a small delay to ensure all content is rendered
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
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
          {/* Dispatch Data Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Dispatch Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Tp No:</strong> {dispatchData.dispatch_code}</div>
                <div><strong>Date:</strong> {dispatchData.date}</div>
                <div><strong>School:</strong> {dispatchData.schoolname}</div>
                <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
                <div><strong>Taluka:</strong> {dispatchData.taluka}</div>
                <div><strong>Center:</strong> {dispatchData.center_name}</div>
                <div><strong>Class:</strong> {dispatchData.class_range || '-'}</div>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isRice
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
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => generatePreview('kirana')}
              className="flex-1 min-w-[200px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={kiranaItems.length === 0}
            >
              Preview Kirana Receipt ({kiranaItems.length} items)
            </button>

            <button
              onClick={() => generatePreview('rice')}
              className="flex-1 min-w-[200px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={riceItems.length === 0}
            >
              Preview Rice Receipt ({riceItems.length} items)
            </button>
          </div>

          {/* New Preview Modal */}
          <Modal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            className="max-w-[950px] p-6  h-[550px] overflow-scroll"
          >
            <div className="flex items-start justify-between mb-4 ">
              <div>
                <h3 className="text-lg font-semibold">
                  {previewType === 'rice' ? 'Rice' : 'Kirana'} Receipt Preview
                </h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><strong>Tp No:</strong> {dispatchData.dispatch_code}</div>
                  <div><strong>Date:</strong> {dispatchData.date}</div>
                  <div><strong>School:</strong> {dispatchData.schoolname}</div>
                  <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
                  <div><strong>Taluka:</strong> {dispatchData.taluka}</div>
                  <div><strong>Center:</strong> {dispatchData.center_name}</div>
                  <div><strong>Class:</strong> {dispatchData.class_range || '-'}</div>
                </div>
              </div>
              <div className="flex gap-2 mr-14">
                <button
                  onClick={printPreview}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Print
                </button>
                {/* <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button> */}
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded border">
              <iframe
                srcDoc={previewContent}
                className="w-full h-[70vh] border rounded bg-white"
                title="Receipt Preview"
              />
            </div>
          </Modal>
          {/* Preview Section */}
          {/* {previewContent && (
            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {previewType === 'rice' ? 'Rice' : 'Kirana'} Receipt Preview
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={printPreview}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Print
                  </button>
                  <button
                    onClick={closePreview}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded ">
                <iframe
                  srcDoc={previewContent}
                  className="w-full h-96 border rounded "
                  title="Receipt Preview"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Note: This is a preview. Click &quot;Print&quot; to open the print dialog.
                </p>
              </div>
            </div>
          )} */}
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
  const [selectedTalukaId, setSelectedTalukaId] = useState<string>('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassRange, setSelectedClassRange] = useState<string>('');

  // Masters
  const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

  // Map school_id → center, taluka, schoolname, udaisno (from /api/scooldata)
  interface SchoolDataRow {
    schoolid: number;
    center: number;
    taluka_id: number;
    schoolname: string;
    udaisno: string;
  }
  // Shape of rows returned from `/api/scooldata`
  type SchoolDataApiRow = {
    schoolid: number | string;
    center: number | string | null;
    taluka_id: number | string | null;
    schoolname?: string | null;
    udaisno?: string | null;
  };
  const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
  // Date filter state - Initialize with current date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });

  // Date picker ref
  const datePickerRef = useRef<HTMLInputElement>(null);
  const flatpickrInstanceRef = useRef<flatpickr.Instance | null>(null);

  // Masters
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [truckList, setTruckList] = useState<TruckRow[]>([]);
  // const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

  // Existing dispatch list
  const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
  const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);

  // State to gate input mode and reset when filters change
  const [didSearch, setDidSearch] = useState(false);

  // reset search gate when any filter changes
  useEffect(() => { setDidSearch(false); }, [
    orderNo, selectedTruckId, selectedTalukaId, selectedCenterId, selectedSchoolId, selectedClassRange
  ]);

  // Initialize Flatpickr for date picker
  useEffect(() => {
    if (datePickerRef.current) {
      const flatPickr = flatpickr(datePickerRef.current, {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate ? new Date(selectedDate) : undefined,
        onChange: function (selectedDates, dateStr) {
          setSelectedDate(dateStr);
        },
        static: true,
        monthSelectorType: "static",
        enableTime: false,
        allowInput: true,
        clickOpens: true,
        locale: {
          firstDayOfWeek: 1
        }
      });

      // Store the instance in ref
      flatpickrInstanceRef.current = flatPickr;

      return () => {
        flatPickr.destroy();
        flatpickrInstanceRef.current = null;
      };
    }
  }, []);


  // Filter dispatch list based on date
  useEffect(() => {
    let filtered = [...dispatchList];

    // Filter by date only if a date is selected
    if (selectedDate && selectedDate.trim() !== '') {
      const selectedDateObj = new Date(selectedDate);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate.toDateString() === selectedDateObj.toDateString();
      });
    }

    setFilteredDispatchList(filtered);
  }, [dispatchList, selectedDate]);


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

  const fetchTalukas = async () => {
    try {
      const res = await fetch('/api/taluka');
      if (res.ok) setTalukaList(await res.json());
    } catch {
      toast.error('Failed to load taluka');
    }
  };

  const fetchSchoolDataMap = async () => {
    try {
      const res = await fetch('/api/scooldata');
      if (!res.ok) return;
      const rows: SchoolDataApiRow[] = await res.json();
      const map = new Map<number, SchoolDataRow>();
      rows.forEach(r => {
        // API fields: schoolid, center (id), taluka_id, schoolname, udaisno
        if (r?.schoolid) {
          map.set(Number(r.schoolid), {
            schoolid: Number(r.schoolid),
            center: Number(r.center),
            taluka_id: Number(r.taluka_id),
            schoolname: String(r.schoolname || ''),
            udaisno: String(r.udaisno || ''),
          });
        }
      });
      setSchoolDataById(map);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchZpOrders();
    fetchSchoolWiseOrders();
    fetchTrucks();
    fetchTalukas();         // NEW
    fetchCenters();
    fetchItemMaster();
    fetchDispatchList();
    fetchSchoolDataMap();   // NEW
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

  const talukaOptions = useMemo(() => [
    { value: '', label: 'Select Taluka' },
    ...talukaList.map(t => ({ value: String(t.taluka_id), label: t.name }))
  ], [talukaList]);

  const centerOptions = useMemo(() => [
    { value: '', label: 'Select Center' },
    ...centerList
      .filter(c => !selectedTalukaId || String(c.taluka_id || '') === String(selectedTalukaId))
      .map(c => ({ value: String(c.center_id), label: c.marathi_name || c.name || String(c.center_id) }))
  ], [centerList, selectedTalukaId]);

  const classRangeOptions = useMemo(() => {
    if (!orderNo || !selectedSchoolId) return [{ value: '', label: 'Class Varg (Select)' }];
    const uniq = new Set<string>();
    schoolWiseOrders
      .filter(s => String(s.order_id) === orderNo && String(s.school_id) === String(selectedSchoolId))
      .forEach(s => { if (s.class_range) uniq.add(String(s.class_range)); });
    const arr = Array.from(uniq.values()).sort();
    return [{ value: '', label: 'Class Varg (All)' }, ...arr.map(v => ({ value: v, label: v }))];
  }, [orderNo, selectedSchoolId, schoolWiseOrders]);

  const schoolOptions = useMemo(() => {
    if (!orderNo) return [{ value: '', label: 'Select School' }];

    let filtered = schoolWiseOrders.filter(s => String(s.order_id) === orderNo);

    if (selectedCenterId) {
      filtered = filtered.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.center) === String(selectedCenterId);
      });
    } else if (selectedTalukaId) {
      filtered = filtered.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.taluka_id) === String(selectedTalukaId);
      });
    }

    // De-dup by school_id
    const seen = new Set<number>();
    const dedup = filtered.filter(s => {
      if (seen.has(s.school_id)) return false;
      seen.add(s.school_id);
      return true;
    });

    // Stable sort
    dedup.sort((a, b) => {
      const an = a.schoolname || schoolDataById.get(a.school_id)?.schoolname || '';
      const bn = b.schoolname || schoolDataById.get(b.school_id)?.schoolname || '';
      return an.localeCompare(bn);
    });

    // Label: SR) Name (UDISE) with fallback from schooldata if missing in API
    return [
      { value: '', label: 'Select School' },
      ...dedup.map((s, idx) => {
        const fallback = schoolDataById.get(Number(s.school_id));
        const name = s.schoolname || fallback?.schoolname || `School ${s.school_id}`;
        const ud = s.udaisno || fallback?.udaisno || 'NA';
        return {
          value: String(s.school_id),
          label: `${idx + 1}) ${name} (${ud})`,
        };
      })
    ];
  }, [orderNo, selectedTalukaId, selectedCenterId, schoolWiseOrders, schoolDataById]);
  const handleOrderChange = (orderId: string) => {
    setOrderNo(orderId);
    setSelectedClassRange('');
    setSelectedSchoolId('');
  };

  const handleTalukaChange = (talukaId: string) => {
    setSelectedTalukaId(talukaId);
    setSelectedCenterId('');
    setSelectedSchoolId('');
    setSelectedClassRange('');
  };

  // Selected target (order + school)
  const selectedOrderSchool = useMemo(() => {
    if (!orderNo || !selectedSchoolId) return null;
    const all = schoolWiseOrders.filter(
      s => String(s.order_id) === orderNo && String(s.school_id) === selectedSchoolId
    );
    if (all.length === 0) return null;
    if (selectedClassRange) {
      return all.find(s => String(s.class_range || '') === String(selectedClassRange)) || all[0];
    }
    return all[0];
  }, [orderNo, selectedSchoolId, selectedClassRange, schoolWiseOrders]);

  // Sum already dispatched per item for selected order + school (+ class)
  // Sum already dispatched per item for selected order + school (+ class)
  const dispatchedByItem = useMemo<Record<string, number>>(() => {
    if (!orderNo || !selectedSchoolId) return {};
    const selectedClass = selectedClassRange || selectedOrderSchool?.class_range || '';
    const map: Record<string, number> = {};
    dispatchList
      .filter(d =>
        String(d.order_id) === orderNo &&
        String(d.school_id) === selectedSchoolId &&
        (!selectedClass || String(d.class_range || '') === String(selectedClass))
      )
      .forEach(d => {
        const key = d.item_name.trim();
        map[key] = (map[key] || 0) + Number(d.qty_dispatch || 0);
      });
    return map;
  }, [dispatchList, orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]);

  // Latest inserted row per item for this order+school(+class)
  const latestDispatchByItem = useMemo<Record<string, { id: number; qty: number; total: number }>>(() => {
    if (!orderNo || !selectedSchoolId) return {};
    const selectedClass = selectedClassRange || selectedOrderSchool?.class_range || '';
    const map: Record<string, { id: number; qty: number; total: number; created: string | number }> = {};
    dispatchList
      .filter(d =>
        String(d.order_id) === orderNo &&
        String(d.school_id) === selectedSchoolId &&
        (!selectedClass || String(d.class_range || '') === String(selectedClass))
      )
      .forEach(d => {
        const key = d.item_name.trim();
        const prev = map[key];
        const created = d.created_at || d.id;
        if (!prev || String(created) > String(prev.created)) {
          map[key] = { id: d.id, qty: Number(d.qty_dispatch || 0), total: Number(d.total_qty || 0), created };
        }
      });
    const out: Record<string, { id: number; qty: number; total: number }> = {};
    Object.entries(map).forEach(([k, v]) => { out[k] = { id: v.id, qty: v.qty, total: v.total }; });
    return out;
  }, [dispatchList, orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]);
  // Build input-mode rows with remaining qty (planned - already dispatched)
  const dispatchRows = useMemo<DispatchRow[]>(() => {
    if (!selectedOrderSchool) return [];
    const items = typeof selectedOrderSchool.items_data === 'string'
      ? JSON.parse(selectedOrderSchool.items_data as unknown as string)
      : (selectedOrderSchool.items_data || {});
    const rows: DispatchRow[] = [];

    Object.entries(items)
      .forEach(([k, v]) => {
        const master = itemGrains.find(g => g.name.trim() === k.trim());
        const planned = Number(v) || 0;
        const already = Number(dispatchedByItem[k] || 0);
        const remaining = Math.max(0, planned - already);
        rows.push({
          schoolname: selectedOrderSchool.schoolname,
          grain: k,
          totalQty: planned, // Show original planned quantity, not remaining
          remainingQty: remaining, // Keep remaining for balance calculation
          unit: master?.Unit || 'kg',
        });
      });

    return rows;
  }, [selectedOrderSchool, itemGrains, dispatchedByItem]);

  // Inputs map for qty dispatch (persist per order+school+class)
  const storageKey = useMemo(
    () => {
      if (!orderNo || !selectedSchoolId) return '';
      const cls = selectedClassRange || selectedOrderSchool?.class_range || '';
      return `dispatchInputs:${orderNo}:${selectedSchoolId}:${cls}`;
    },
    [orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]
  );
  const [dispatchInputs, setDispatchInputs] = useState<Record<string, number | undefined>>({});
  useEffect(() => {
    if (!storageKey) { setDispatchInputs({}); return; }
    try {
      const raw = localStorage.getItem(storageKey);
      setDispatchInputs(raw ? (JSON.parse(raw) || {}) : {});
    } catch { setDispatchInputs({}); }
  }, [storageKey]);

  // Prefill inputs: if no DB row -> Quantity; if DB qty == Quantity -> 0; else -> DB qty
  // Re-seed inputs whenever DB latest changes (after insert/update refresh)
  useEffect(() => {
    if (!storageKey) return;
    setDispatchInputs(() => {
      const next: Record<string, number> = {};
      dispatchRows.forEach(row => {
        const total = Number(row.totalQty);
        const dbQty = Number(latestDispatchByItem[row.grain]?.qty ?? NaN);
        if (Number.isNaN(dbQty)) {
          next[row.grain] = total;              // no DB row → show Quantity
        } else {
          next[row.grain] = dbQty >= total ? 0 : dbQty; // fully dispatched → 0 else DB qty
        }
      });
      return next;
    });
  }, [storageKey]);
  // Persist on change
  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(dispatchInputs)); } catch { }
  }, [dispatchInputs, storageKey]);

  // Input-mode columns
  // Input-mode columns

  // Read-only list columns (default view) with eye icon for print
  // Read-only list columns (default view) with eye icon for print
  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(dispatchInputs)); } catch { }
  }, [dispatchInputs, storageKey]);

  // Read-only list columns (default view) with eye icon for print
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
    // Taluka (Marathi) resolved via schoolDataById + talukaList
    {
      key: 'taluka',
      label: 'Taluka',
      render: (r) => {
        const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
        const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
        return <span>{talukaName}</span>;
      }
    },
    // Class Range
    {
      key: 'class_range',
      label: 'Class',
      accessor: 'class_range',
      render: (r) => <span>{r.class_range || ''}</span>
    },
    // Center (prefer Marathi name)
    {
      key: 'center_name',
      label: 'Center',
      accessor: 'center_name',
      render: (r) => {
        const c = centerList.find(cn => String(cn.center_id) === String(r.center_id));
        const name = c?.marathi_name || c?.name || r.center_name || r.center_id;
        return <span>{name}</span>;
      }
    },
    { key: 'truckNo', label: 'Truck', accessor: 'truckNo', render: (r) => <span>{r.truckNo || r.truck_id}</span> },
    {
      key: 'schoolname',
      label: 'Action',
      accessor: 'schoolname',
      render: (r) => (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              // Filter only this school's, order's, and class's items
              const schoolDispatchItems = dispatchList
                .filter(d =>
                  d.schoolname === r.schoolname &&
                  d.order_no === r.order_no &&
                  String(d.class_range || '') === String(r.class_range || '')
                )
                .map(d => ({
                  name: d.item_name,
                  qty: d.qty_dispatch,
                  unit: d.unit
                }));

              const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
              const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
              const dispatchData = {
                dispatch_code: r.dispatch_code,
                schoolname: r.schoolname || '',
                udaisno: schoolWiseOrders.find(s => s.schoolname === r.schoolname)?.udaisno || '',
                taluka: talukaName,
                center_name: (centerList.find(cn => String(cn.center_id) === String(r.center_id))?.marathi_name) || r.center_name || '',
                truckNo: r.truckNo || '',
                date: new Date(r.created_at).toLocaleDateString('en-GB'),
                class_range: r.class_range || '', // pass class
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
  ];
  const allFiltersSelected = Boolean(orderNo && selectedTruckId && selectedCenterId && selectedSchoolId);
  const showInputMode = allFiltersSelected && didSearch;
  // Initialize Flatpickr for date picker (re-init when mode changes so toolbar remounts)
  useEffect(() => {
    if (!datePickerRef.current) return;

    // Destroy any existing instance before re-initializing
    if (flatpickrInstanceRef.current) {
      try { flatpickrInstanceRef.current.destroy(); } catch { }
      flatpickrInstanceRef.current = null;
    }

    const instance = flatpickr(datePickerRef.current, {
      dateFormat: "Y-m-d",
      defaultDate: selectedDate ? new Date(selectedDate) : undefined,
      onChange: function (selectedDates, dateStr) {
        setSelectedDate(dateStr);
      },
      static: true,
      monthSelectorType: "static",
      enableTime: false,
      allowInput: true,
      clickOpens: true,
      locale: { firstDayOfWeek: 1 }
    });

    flatpickrInstanceRef.current = instance;

    return () => {
      try { instance.destroy(); } catch { }
      if (flatpickrInstanceRef.current === instance) {
        flatpickrInstanceRef.current = null;
      }
    };
  }, [showInputMode, selectedDate]);
  // Update the toolbar section with the clear button
  const toolbar = (
    <div className="space-y-4">
      {/* First Row: 5 fields inline */}
      <div className="grid grid-cols-5 gap-2 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Order Number</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={orderNo}
            onChange={(e) => handleOrderChange(e.target.value)}
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
          <span className="text-xs text-gray-600 mb-1 text-left">Taluka</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedTalukaId}
            onChange={(e) => handleTalukaChange(e.target.value)}
          >
            {talukaOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Taluka'}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Center</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedCenterId}
            onChange={(e) => {
              setSelectedCenterId(e.target.value);
              setSelectedSchoolId('');
            }}
            disabled={!selectedTalukaId}
          >
            {centerOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Center'}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">School</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedSchoolId}
            onChange={(e) => {
              setSelectedSchoolId(e.target.value);
              setSelectedClassRange('');
            }}
            disabled={!orderNo || !selectedCenterId}
          >
            {schoolOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Second Row: 4 fields inline */}
      <div className="grid grid-cols-4 gap-2 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Class Varg</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedClassRange}
            onChange={(e) => setSelectedClassRange(e.target.value)}
            disabled={!orderNo || !selectedSchoolId}
          >
            {classRangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Date Filter</span>
          <div className="relative">
            <input
              ref={datePickerRef}
              type="text"
              placeholder="Select Date"
              className="h-10 rounded-md border px-3 pr-8 text-sm w-full"
              readOnly
            />
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                if (flatpickrInstanceRef.current) {
                  flatpickrInstanceRef.current.clear();
                }
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              title="Clear Date Filter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

              // Build row context
              const rowsToProcess = dispatchRows.map(r => {
                const total = Number(r.totalQty);
                const dbLatest = latestDispatchByItem[r.grain];
                const dbQty = typeof dbLatest?.qty === 'number' ? dbLatest.qty : NaN;
                const defaultValue = Number.isNaN(dbQty) ? total : (dbQty >= total ? 0 : dbQty);
                const inputQty = Number(dispatchInputs[r.grain] ?? defaultValue);
                return { r, total, dbLatest, dbQty, defaultValue, inputQty };
              });

              // First time: no DB rows exist → insert ALL items
              const isFirstSubmission = rowsToProcess.every(x => !x.dbLatest);

              let updates: Array<{ id: number; qty_dispatch: number }> = [];
              let inserts: Array<{ grain: string; unit: string; totalQty: number; qtyDispatch: number }> = [];

              if (isFirstSubmission) {
                inserts = rowsToProcess.map(x => ({
                  grain: x.r.grain,
                  unit: x.r.unit,
                  totalQty: x.total,
                  qtyDispatch: x.inputQty,
                }));
              } else {
                // Later runs: only changed rows
                updates = rowsToProcess
                  .filter(x => x.dbLatest && x.inputQty !== x.defaultValue)
                  .map(x => ({ id: x.dbLatest!.id, qty_dispatch: x.inputQty }));

                inserts = rowsToProcess
                  .filter(x => !x.dbLatest && x.inputQty !== x.defaultValue)
                  .map(x => ({
                    grain: x.r.grain,
                    unit: x.r.unit,
                    totalQty: x.total,
                    qtyDispatch: x.inputQty,
                  }));
              }

              if (updates.length === 0 && inserts.length === 0) {
                toast.error('Enter at least one dispatch quantity (can be 0 to reset)');
                return;
              }

              setLoading(true);

              if (updates.length > 0) {
                await Promise.all(
                  updates.map(u =>
                    fetch('/api/dispatchdetails', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: u.id, qty_dispatch: u.qty_dispatch }),
                    }).then(async (res) => {
                      if (!res.ok) {
                        const er = await res.json().catch(() => ({}));
                        throw new Error(er.message || 'Failed to update dispatch');
                      }
                    })
                  )
                );
              }

              let newCode: string | undefined;
              if (inserts.length > 0) {
                const resp = await fetch('/api/dispatchdetails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    order_id: Number(orderNo),
                    school_id: Number(selectedSchoolId),
                    center_id: Number(selectedCenterId),
                    truck_id: Number(selectedTruckId),
                    class_range: selectedOrderSchool?.class_range || selectedClassRange || '',
                    lines: inserts,
                  }),
                });
                if (!resp.ok) {
                  const er = await resp.json().catch(() => ({}));
                  throw new Error(er.message || 'Failed to save dispatch');
                }
                const ok = await resp.json();
                newCode = ok.dispatch_code;
              }

              toast.success(newCode ? `Saved (Code: ${newCode})` : 'Updated successfully');

              // Refresh from DB and auto-apply latest values into inputs
              // After successful save, refresh DB and re-seed inputs from DB (0 if fully dispatched)
              await fetchDispatchList();

              setDispatchInputs(() => {
                const next: Record<string, number> = {};
                dispatchRows.forEach(row => {
                  const latest = latestDispatchByItem[row.grain];
                  const dbQty = Number(latest?.qty ?? NaN);
                  if (Number.isNaN(dbQty)) {
                    next[row.grain] = Number(row.totalQty);           // still no DB row -> show Quantity
                  } else {
                    next[row.grain] = dbQty >= Number(row.totalQty) ? 0 : dbQty;  // equal => 0, else DB qty
                  }
                });
                return next;
              });
              // Keep filters as-is; show print modal as before if needed
              const dispatchItems = dispatchRows
                .map(r => ({
                  name: r.grain,
                  qty: Number(dispatchInputs[r.grain] ?? 0),
                  unit: r.unit
                }))
                .filter(i => i.qty >= 0);
              const selectedTruck = truckList.find(t => String(t.id) === selectedTruckId);
              const selectedCenter = centerList.find(c => String(c.center_id) === selectedCenterId);
              const selectedSchool = schoolWiseOrders.find(s => String(s.school_id) === selectedSchoolId);
              const sdSel = schoolDataById.get(Number(selectedSchoolId));
              const talukaName = sdSel ? (talukaList.find(t => t.taluka_id === sdSel.taluka_id)?.name || '') : '';

              const dispatchData = {
                dispatch_code: newCode || (latestDispatchByItem[dispatchItems[0]?.name || ''] ? 'UPDATED' : ''),
                schoolname: selectedSchool?.schoolname || '',
                udaisno: selectedSchool?.udaisno || '',
                taluka: talukaName,
                center_name: (selectedCenter?.marathi_name || selectedCenter?.name || ''),
                truckNo: selectedTruck?.truckNo || '',
                date: new Date().toLocaleDateString('en-GB'),
                class_range: selectedOrderSchool?.class_range || selectedClassRange || '', // add
                items: dispatchItems
              };
              setLastDispatchData(dispatchData);
              setShowPrintModal(true);

            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to save');
            } finally {
              setLoading(false);
              // Clear input cache for this selection
              if (storageKey) {
                try { localStorage.removeItem(storageKey); } catch { }
              }
              setDispatchInputs({});
              // Reset all filters and return to default (read-only) view
              setOrderNo('');
              setSelectedTruckId('');
              setSelectedTalukaId('');
              setSelectedCenterId('');
              setSelectedSchoolId('');
              setSelectedClassRange('');
              setDidSearch(false);
              // Clear date filter and picker UI
              setSelectedDate('');
              if (flatpickrInstanceRef.current) {
                try { flatpickrInstanceRef.current.clear(); } catch { }
              }
            }
          }
          }
          disabled={loading || !showInputMode}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );


  return (
    <div className="">
      {showInputMode ? (
        <div className="bg-white rounded-2xl shadow-md border p-4">
          <div className="mb-4">{toolbar}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Sr No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Qty Dispatch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Bal Qtsy</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {dispatchRows.map((row, index) => {
                  const total = Number(row.totalQty);
                  const dbQty = Number(latestDispatchByItem[row.grain]?.qty ?? NaN);
                  const defaultValue = Number.isNaN(dbQty) ? total : (dbQty >= total ? 0 : dbQty);
                  const currentValue = dispatchInputs[row.grain] !== undefined
                    ? Number(dispatchInputs[row.grain])
                    : defaultValue;

                  const bal = (() => {
                    const dbQtyRaw = (latestDispatchByItem[row.grain]?.qty);
                    const dbNum = typeof dbQtyRaw === 'number' ? dbQtyRaw : NaN;
                    const inputQty = dispatchInputs[row.grain] !== undefined ? Number(dispatchInputs[row.grain]) : total;
                    const dispatched = Number.isNaN(dbNum) ? inputQty : dbNum;
                    return (total === dispatched) ? 0 : Math.max(0, total - dispatched);
                  })();

                  return (
                    <tr key={row.grain}>
                      <td className="px-4 py-3 border">{index + 1}</td>
                      <td className="px-4 py-3 border">{row.grain}</td>
                      <td className="px-4 py-3 border">{row.unit}</td>
                      <td className="px-4 py-3 border">{row.totalQty}</td>
                      <td className="px-4 py-3 border">
                        <input
                          type="number"
                          min={0}
                          max={total}
                          className="h-9 w-28 rounded border px-2 text-sm"
                          value={currentValue}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              setDispatchInputs(prev => ({ ...prev, [row.grain]: defaultValue }));
                              return;
                            }
                            const raw = Number(e.target.value);
                            const val = Number.isFinite(raw) ? raw : 0;
                            if (val > total) {
                              toast.error(`Entered quantity exceeds total. Max allowed: ${total}`);
                              return;
                            }
                            const capped = Math.min(Math.max(0, val), total);
                            setDispatchInputs(prev => ({ ...prev, [row.grain]: capped }));
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              setDispatchInputs(prev => ({ ...prev, [row.grain]: defaultValue }));
                            }
                          }}
                        />
                      </td>
                      <td className={`px-4 py-3 border ${bal === 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}`}>{bal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Filterdispached
          data={filteredDispatchList}
          columns={listColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={toolbar}
          groupByKey="class_range"
          colspanKeys={["order_no", "taluka", "class_range", "schoolname", "center_name", "truckNo"]}
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