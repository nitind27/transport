"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
// import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
// import { Modal } from '../ui/modal';
// import { TrashBinIcon } from '@/icons';
import { formatDateToDDMMYYYY } from '@/lib/utils';
// import {  Filterdispacheddetails } from '../tables/Filterdispacheddetails'; // Filterdispacheddetails component
import Loader from '@/common/Loader';

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


// interface CenterRow {
//     center_id: number;
//     name: string;
//     marathi_name?: string;
//     status?: string;
//     taluka_id?: number; // ensure we can filter centers by taluka
// }
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
    new_qty_dispatch: number; // Add this field
    bal_qty: number;
    dispatch_return: number; // Add this new field
    status: string;
    created_at: string;
    order_no?: string;
    schoolname?: string;
    center_name?: string;
    total_weight?: string;
    truckNo?: string;
    class_range?: string;
    taluka?: string;
    period?: string;
    no_of_days?: number;
    financial_year?: string;
    udaisno?: string;
    patsankhya?: string;
    action?: string;
    grain_तांदुळ?: string;
    grain_मुंगदाळ?: string;
    grain_मसूरदाळ?: string;
    grain_तूरदाळ?: string;
    grain_हरभरा?: string;
    grain_चवळी?: string;
    grain_मटकी?: string;
    grain_मुग?: string;
    grain_वाटाणा?: string;
    grain_सोया_वडी?: string;
    grain_मसाला?: string;
    grain_सोया_तेल?: string;
    grain_हळद?: string;
    grain_मीठ?: string;
    grain_मोहरी?: string;
    grain_चना?: string;
    grain_जीरा?: string;
};
type DispatchRow = {
    schoolname: string;
    grain: string;
    totalQty: number; // Original planned quantity
    remainingQty: number; // Remaining quantity after dispatch
    unit: string;
};

// Print Modal Component
// interface PrintModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     dispatchData: {
//         dispatch_code: string;
//         schoolname: string;
//         udaisno: string;
//         taluka: string;
//         center_name: string;
//         truckNo: string;
//         date: string;
//         class_range?: string;
//         period?: string;
//         no_of_days?: number;
//         financial_year?: string;
//         items: Array<{
//             name: string;
//             qty: number;
//             unit: string;
//         }>;
//     };
//     initialType?: 'kirana' | 'rice';
// }
// interface TalukaRow {
//       taluka_id: number;
//       name: string;
//       name_en?: string;
//       dist_id?: number;
//       status?: string;
//   }

// const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, dispatchData, initialType }) => {
//     const [previewType, setPreviewType] = useState<'kirana' | 'rice' | null>(null);
//     const [previewContent, setPreviewContent] = useState<string>('');
//     const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

//     // Separate rice items from other items - तांदुळ is rice
//     const riceItems = dispatchData.items.filter(item => {
//         const itemName = item.name.toLowerCase();
//         return itemName.includes('rice') ||
//             itemName.includes('चावल') ||
//             itemName.includes('तांदुळ');
//     });

//     const kiranaItems = dispatchData.items.filter(item => {
//         const itemName = item.name.toLowerCase();
//         return !itemName.includes('rice') &&
//             !itemName.includes('चावल') &&
//             !itemName.includes('तांदुळ');
//     });

//     // Helper function to format class range
//     const formatClassRange = (classRange?: string) => {
//         if (!classRange) return '1 ली ते 5 वी';

//         // Handle different class range formats
//         if (classRange.includes('-')) {
//             const [start, end] = classRange.split('-');
//             return `${start} ली ते ${end} वी`;
//         }

//         // Handle single class
//         if (classRange.includes('ली') || classRange.includes('वी')) {
//             return classRange;
//         }

//         // Default fallback
//         return '1 ली ते 5 वी';
//     };

//     const generateReceiptContent = (previewType: 'rice' | 'kirana') => {
//         const copyHeadings = [
//             'हेड मास्टर',
//             'बी.आर. सी ऑफीस (तालुका ऑफीस)',
//             'जिल्हा परिषद ऑफीस',
//             'O .C'
//         ];

//         return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8">
//   <title>डिलीव्हरी चलन - Preview</title>
//   <style>
//     @page {
//       margin: 0;
//       size: A4;
//     }
//     * {
//       margin: 0;
//       padding: 0;
//       box-sizing: border-box;
//     }
//     body {
//       font-family: 'Arial', sans-serif;
//       margin: 0;
//       padding: 10px;
//       font-size: 12px;
//       line-height: 1.3;
//       color: #000;
//       background: white;
//     }
//     .copy-container {
//       width: 100%;
//       margin-bottom: 20px;
//       page-break-after: always;
//     }
//     .copy-container:last-child {
//       page-break-after: avoid;
//     }
   
//     .container {
//       max-width: 100%;
//       margin: 0 auto;
//     }
//     .header {
//       text-align: center;
//       margin-bottom: 15px;
//     }
//     .title {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 16px;
//       font-weight: bold;
//       margin-bottom: 6px;
//       position: relative;
//       margin-top: 10px;
//     }

//     .center-item {
//       position: absolute;
//       left: 50%;
//       transform: translateX(-50%);
//       white-space: nowrap;
//     }

//     .end-item {
//       margin-left: auto;
//     }

//     .subtitle {
//       font-size: 13px;
//       font-weight: 500;
//       margin-bottom: 4px;
//     }
//     .subtitle-small {
//       font-size: 12px;
//       margin-bottom: 4px;
//     }
//     .info-section {
//       margin-bottom: 12px;
//     }
//     .info-row {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: 6px;
//       font-size: 12px;
//     }
//     .info-left, .info-right {
//       flex-basis: 50%;
//     }
//     .info-left {
//       text-align: left;
//     }
//     .info-right {
//       text-align: right;
//     }
//     .recipient-info {
//       margin: 12px 0;
//     }
//     .recipient-info div {
//       margin-bottom: 4px;
//     }
//     .description-text {
//       margin: 12px 0;
//       font-size: 12px;
//       line-height: 1.4;
//       text-align: justify;
//     }
//     .table {
//       width: 100%;
//       border-collapse: collapse;
//       margin: 15px 0;
//       font-size: 11px;
//     }
//     .table th, .table td {
//       border: 1px solid #000;
//       padding: 6px;
//       text-align: center;
//       font-size: 11px;
//     }
//     .table th {
//       background-color: #f0f0f0;
//       font-weight: bold;
//     }
//     .table td:first-child {
//       width: 40px;
//     }
//     .table td:nth-child(2) {
//       text-align: left;
//       width: 60%;
//     }
//     .table td:last-child {
//       width: 80px;
//     }
//     .footer {
//       margin-top: 25px;
//     }
//     .signature-section {
//       display: flex;
//       justify-content: space-between;
//       margin-top: 30px;
//       font-size: 12px;
//     }
//     .signature-left {
//       text-align: left;
//       width: 50%;
//     }
//     .signature-right {
//       text-align: right;
//       width: 50%;
//     }
    
//     /* Hide elements when printing */
//     @media print {
//       body {
//         padding: 10px;
//       }
//       @page {
//         margin: 0;
//         size: A4;
//         marks: none;
//         -webkit-print-color-adjust: exact;
//       }
//       ::after, ::before {
//         content: none !important;
//       }
//     }
//   </style>
// </head>
// <body>
//  ${Array.from({ length: 4 }, (_, copyIndex) => `
//     <div class="copy-container">
//       <div class="container">
//         <div class="header">
//           <div class="title">
//             <div class="center-item">डिलीव्हरी चलन</div>
//             <div class="end-item">${copyHeadings[copyIndex]}</div>
//           </div>

//           <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
//           <div class="subtitle">ता. भोकरदन जि. जालना</div>
//           <div class="subtitle-small">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
//         </div>

//         <div class="info-section">
//           <div class="info-row">
//             <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
//             <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
//           </div>
//           <div class="info-row">
//             <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
//             <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
//           </div>
//         </div>

//         <div class="recipient-info">
//           <div>प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
//           <div>शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
//           <div>केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
//         </div>

//         <div class="description-text">
//           आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${formatClassRange(dispatchData.class_range)} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
//         </div>

//         <div style="display: flex; gap: 20px; align-items: flex-start;">
//           <table class="table" style="flex: 1;">
//             <thead>
//               <tr>
//                 <th>अ.क्रं.</th>
//                 <th>धान्याचे नाव</th>
//                 <th>वजन किलो ग्रॅम</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${(previewType === 'rice' ? riceItems : kiranaItems).slice(0, 10).map((item, index) => `
//                 <tr>
//                   <td>${index + 1}</td>
//                   <td>${item.name}</td>
//                   <td>${item.qty}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>

//           ${(previewType === 'rice' ? riceItems : kiranaItems).length > 10 ? `
//           <table class="table" style="flex: 1;">
//             <thead>
//               <tr>
//                 <th>अ.क्रं.</th>
//                 <th>धान्याचे नाव</th>
//                 <th>वजन किलो ग्रॅम</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${(previewType === 'rice' ? riceItems : kiranaItems).slice(10).map((item, index) => `
//                 <tr>
//                   <td>${index + 11}</td>
//                   <td>${item.name}</td>
//                   <td>${item.qty}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>
//           ` : ''}
//         </div>

//         <div class="description-text">
//           वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
//         </div>

//         <div class="footer">
//           <div class="signature-section">
//             <div class="signature-left">
//               मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरदन जि. जालना
//             </div>
//             <div class="signature-right">
//               माल ताब्यात घेणाऱ्याची सही व शिक्का
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `).join('')}
// </body>
// </html>
//     `;
//     };

//     const printPreview = () => {
//         if (!previewContent) return;

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) return;
//         const copyHeadings = [
//             'हेड मास्टर',
//             'बी.आर. सी ऑफीस (तालुका ऑफीस)',
//             'जिल्हा परिषद ऑफीस',
//             'O .C'
//         ];
//         // Create content with 4 copies
//         const fourCopiesContent = `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8">
//   <title>डिलीव्हरी चलन - 4 Copies</title>
//   <style>
//     @page {
//       margin: 0;
//       size: A4;
//     }
//     * {
//       margin: 0;
//       padding: 0;
//       box-sizing: border-box;
//     }
//     body {
//       font-family: 'Arial', sans-serif;
//       margin: 0;
//       padding: 10px;
//       font-size: 12px;
//       line-height: 1.3;
//       color: #000;
//       background: white;
//     }
//     .copy-container {
//       width: 100%;
//       margin-bottom: 20px;
//       page-break-after: always;
//     }
//     .copy-container:last-child {
//       page-break-after: avoid;
//     }
   
//     .container {
//       max-width: 100%;
//       margin: 0 auto;
//     }
//     .header {
//       text-align: center;
//       margin-bottom: 15px;
//     }
//     .title {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 16px;
//   font-weight: bold;
//   margin-bottom: 6px;
//   position: relative;
//    margin-top: 10px;
// }

// .center-item {
//   position: absolute;
//   left: 50%;
//   transform: translateX(-50%);
//   white-space: nowrap;
// }

// .end-item {
//   margin-left: auto;
// }

//     .subtitle {
//       font-size: 13px;
//       font-weight: 500;
//       margin-bottom: 4px;
//     }
//     .subtitle-small {
//       font-size: 12px;
//       margin-bottom: 4px;
//     }
//     .info-section {
//       margin-bottom: 12px;
//     }
//     .info-row {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: 6px;
//       font-size: 12px;
//     }
//     .info-left, .info-right {
//       flex-basis: 50%;
//     }
//     .info-left {
//       text-align: left;
//     }
//     .info-right {
//       text-align: right;
//     }
//     .recipient-info {
//       margin: 12px 0;
//     }
//     .recipient-info div {
//       margin-bottom: 4px;
//     }
//     .description-text {
//       margin: 12px 0;
//       font-size: 12px;
//       line-height: 1.4;
//       text-align: justify;
//     }
//     .table {
//       width: 100%;
//       border-collapse: collapse;
//       margin: 15px 0;
//       font-size: 11px;
//     }
//     .table th, .table td {
//       border: 1px solid #000;
//       padding: 6px;
//       text-align: center;
//       font-size: 11px;
//     }
//     .table th {
//       background-color: #f0f0f0;
//       font-weight: bold;
//     }
//     .table td:first-child {
//       width: 40px;
//     }
//     .table td:nth-child(2) {
//       text-align: left;
//       width: 60%;
//     }
//     .table td:last-child {
//       width: 80px;
//     }
//     .footer {
//       margin-top: 25px;
//     }
//     .signature-section {
//       display: flex;
//       justify-content: space-between;
//       margin-top: 30px;
//       font-size: 12px;
//     }
//     .signature-left {
//       text-align: left;
//       width: 50%;
//     }
//     .signature-right {
//       text-align: right;
//       width: 50%;
//     }
    
//     /* Hide elements when printing */
//     @media print {
//       body {
//         padding: 10px;
//       }
//       @page {
//         margin: 0;
//         size: A4;
//         marks: none;
//         -webkit-print-color-adjust: exact;
//       }
//       ::after, ::before {
//         content: none !important;
//       }
//     }
//   </style>
// </head>
// <body>
//  ${Array.from({ length: 4 }, (_, copyIndex) => `
//     <div class="copy-container">
    
//       <div class="container">
//         <div class="header">
//  <div class="title">
//   <div class="center-item">डिलीव्हरी चलन</div>
//   <div class="end-item">${copyHeadings[copyIndex]}</div>
// </div>

//           <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
//           <div class="subtitle">ता. भोकरदन जि. जालना</div>
//           <div class="subtitle-small">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
//         </div>

//         <div class="info-section">
//           <div class="info-row">
//             <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
//             <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
//           </div>
//           <div class="info-row">
//             <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
//             <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
//           </div>
//         </div>

//         <div class="recipient-info">
//           <div>प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
//           <div>शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
//           <div>केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
//         </div>

//         <div class="description-text">
//           आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${formatClassRange(dispatchData.class_range)} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
//         </div>

//         <div style="display: flex; gap: 20px; align-items: flex-start;">
//           <table class="table" style="flex: 1;">
//             <thead>
//               <tr>
//                 <th>अ.क्रं.</th>
//                 <th>धान्याचे नाव</th>
//                 <th>वजन किलो ग्रॅम</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${(previewType === 'rice' ? riceItems : kiranaItems).slice(0, 10).map((item, index) => `
//                 <tr>
//                   <td>${index + 1}</td>
//                   <td>${item.name}</td>
//                   <td>${item.qty}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>

//           ${(previewType === 'rice' ? riceItems : kiranaItems).length > 10 ? `
//           <table class="table" style="flex: 1;">
//             <thead>
//               <tr>
//                 <th>अ.क्रं.</th>
//                 <th>धान्याचे नाव</th>
//                 <th>वजन किलो ग्रॅम</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${(previewType === 'rice' ? riceItems : kiranaItems).slice(10).map((item, index) => `
//                 <tr>
//                   <td>${index + 11}</td>
//                   <td>${item.name}</td>
//                   <td>${item.qty}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>
//           ` : ''}
//         </div>

//         <div class="description-text">
//           वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
//         </div>

//         <div class="footer">
//           <div class="signature-section">
//             <div class="signature-left">
//               मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरदन जि. जालना
//             </div>
//             <div class="signature-right">
//               माल ताब्यात घेणाऱ्याची सही व शिक्का
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `).join('')}
// </body>
// </html>
//     `;

//         printWindow.document.write(fourCopiesContent);
//         // printWindow.document.close();

//         // Wait for content to load before printing
//         printWindow.onload = () => {
//             printWindow.focus();

//             // Add a small delay to ensure all content is rendered
//             setTimeout(() => {
//                 printWindow.print();
//             }, 500);
//         };
//     };

//     // Reset or seed preview when modal state changes
//     useEffect(() => {
//       if (!isOpen) {
//           setPreviewType(null);
//           setPreviewContent('');
//           setIsPreviewOpen(false);
//           return;
//       }
//       // If an initial type is provided, auto-open that preview
//       if (initialType) {
//           setPreviewType(initialType);
//           const content = generateReceiptContent(initialType);
//           setPreviewContent(content);
//           setIsPreviewOpen(true);
//       } else {
//           setPreviewType(null);
//           setPreviewContent('');
//           setIsPreviewOpen(false);
//       }
//   }, [isOpen, initialType, generateReceiptContent]); // Add generateReceiptContent to dependencies

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-9999">
//             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//                 <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-2xl font-semibold">Print Receipt</h2>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-500 hover:text-gray-700 text-3xl"
//                     >
//                         ×
//                     </button>
//                 </div>

//                 <div className="space-y-6">
//                     {/* Dispatch Data Table */}
//                     <div className="mb-6">
//                         <h3 className="text-lg font-semibold mb-4">Dispatch Details</h3>
//                         <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                             <div className="grid grid-cols-2 gap-4 text-sm">
//                                 <div><strong>Tp No:</strong> {dispatchData.dispatch_code}</div>
//                                 <div><strong>Date:</strong> {dispatchData.date}</div>
//                                 <div><strong>School:</strong> {dispatchData.schoolname}</div>
//                                 <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
//                                 <div><strong>Taluka:</strong> {dispatchData.taluka}</div>
//                                 <div><strong>Center:</strong> {dispatchData.center_name}</div>
//                                 <div><strong>Class:</strong> {dispatchData.class_range || '-'}</div>
//                             </div>
//                         </div>

//                         <div className="overflow-x-auto">
//                             <table className="w-full border-collapse border border-gray-300">
//                                 <thead>
//                                     <tr className="bg-gray-100">
//                                         <th className="border border-gray-300 px-4 py-2 text-left">Sr. No.</th>
//                                         <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
//                                         <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
//                                         <th className="border border-gray-300 px-4 py-2 text-center">Unit</th>
//                                         <th className="border border-gray-300 px-4 py-2 text-center">Type</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {(previewType === 'rice' ? riceItems : previewType === 'kirana' ? kiranaItems : dispatchData.items).map((item, index: number) => {
//                                         const isRice = riceItems.some(ri => ri.name === item.name);
//                                         return (
//                                             <tr key={`${item.name}-${index}`} className="hover:bg-gray-50">
//                                                 <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
//                                                 <td className="border border-gray-300 px-4 py-2 font-medium">{item.name}</td>
//                                                 <td className="border border-gray-300 px-4 py-2 text-center">{item.qty}</td>
//                                                 <td className="border border-gray-300 px-4 py-2 text-center">{item.unit}</td>
//                                                 <td className="border border-gray-300 px-4 py-2 text-center">
//                                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${isRice
//                                                         ? 'bg-green-100 text-green-800'
//                                                         : 'bg-blue-100 text-blue-800'
//                                                         }`}>
//                                                         {isRice ? 'Rice' : 'Kirana'}
//                                                     </span>
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex flex-wrap gap-4 justify-center">
//                         <button
//                             onClick={() => {
//                                 const content = generateReceiptContent('kirana');
//                                 setPreviewContent(content);
//                                 setPreviewType('kirana');
//                                 setIsPreviewOpen(true);
//                             }}
//                             className="flex-1 min-w-[200px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//                             disabled={kiranaItems.length === 0}
//                         >
//                             Preview Kirana Receipt ({kiranaItems.length} items)
//                         </button>

//                         <button
//                             onClick={() => {
//                                 const content = generateReceiptContent('rice');
//                                 setPreviewContent(content);
//                                 setPreviewType('rice');
//                                 setIsPreviewOpen(true);
//                             }}
//                             className="flex-1 min-w-[200px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
//                             disabled={riceItems.length === 0}
//                         >
//                             Preview Rice Receipt ({riceItems.length} items)
//                         </button>
//                     </div>

//                     {/* New Preview Modal */}
//                     <Modal
//                         isOpen={isPreviewOpen}
//                         onClose={() => setIsPreviewOpen(false)}
//                         className="max-w-[950px] p-6  h-[550px] overflow-scroll"
//                     >
//                         <div className="flex items-start justify-between mb-4 ">
//                             <div>
//                                 <h3 className="text-lg font-semibold">
//                                     {(previewType === 'rice' ? 'Rice' : 'Kirana')}
//                                     {' '}Receipt Preview ({(previewType === 'rice' ? riceItems : kiranaItems).length} items)
//                                 </h3>
//                                 <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
//                                     <div><strong>Tp No:</strong> {dispatchData.dispatch_code}</div>
//                                     <div><strong>Date:</strong> {dispatchData.date}</div>
//                                     <div><strong>School:</strong> {dispatchData.schoolname}</div>
//                                     <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
//                                     <div><strong>Taluka:</strong> {dispatchData.taluka}</div>
//                                     <div><strong>Center:</strong> {dispatchData.center_name}</div>
//                                     <div><strong>Class:</strong> {dispatchData.class_range || '-'}</div>
//                                 </div>
//                             </div>
//                             <div className="flex gap-2 mr-14">
//                                 <button
//                                     onClick={printPreview}
//                                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                                 >
//                                     Print
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="bg-gray-100 p-3 rounded border">
//                             <iframe
//                                 srcDoc={previewContent}
//                                 className="w-full h-[70vh] border rounded bg-white"
//                                 title="Receipt Preview"
//                             />
//                         </div>
//                     </Modal>
//                 </div>
//             </div>
//         </div>
//     );
// };

const CellsReturn = () => {
    const [loading, setLoading] = useState(false);
    // const [showPrintModal, setShowPrintModal] = useState(false);
    // const [initialPreviewType, setInitialPreviewType] = useState<'kirana' | 'rice' | undefined>(undefined);
    // const [lastDispatchData] = useState<{
    //     dispatch_code: string;
    //     schoolname: string;
    //     udaisno: string;
    //     taluka: string;
    //     center_name: string;
    //     truckNo: string;
    //     date: string;
    //     items: Array<{
    //         name: string;
    //         qty: number;
    //         unit: string;
    //     }>;
    // } | null>(null);

    // Only PAVTI NO search filter
    const [pavtiNoSearch, setPavtiNoSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Masters
    // const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
    // const [centerList, setCenterList] = useState<CenterRow[]>([]);
    const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

    // Map school_id → center, taluka, schoolname, udaisno (from /api/scooldata)
    // interface SchoolDataRow {
    //     schoolid: number;
    //     center: number;
    //     taluka_id: number;
    //     schoolname: string;
    //     udaisno: string;
    // }

    // type SchoolDataApiRow = {
    //     schoolid: number | string;
    //     center: number | string | null;
    //     taluka_id: number | string | null;
    //     schoolname?: string | null;
    //     udaisno?: string | null;
    // };

    // const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());

    // Masters
    // const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
    // const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
    // const [truckList, setTruckList] = useState<TruckRow[]>([]);
    const [newQtyDispatchInputs, setNewQtyDispatchInputs] = useState<Record<string, number | undefined>>({});

    // Existing dispatch list
    const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
    const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);

    // State for showing input mode
    const [showInputMode, setShowInputMode] = useState(false);
    const [selectedDispatchData, setSelectedDispatchData] = useState<DispatchListRow | null>(null);

    // Return inputs state
    const [returnInputs, setReturnInputs] = useState<Record<string, number | undefined>>({});

    // Add date filter state with default as current date
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const datePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrInstanceRef = useRef<flatpickr.Instance | null>(null);

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

            flatpickrInstanceRef.current = flatPickr;

            return () => {
                flatPickr.destroy();
                flatpickrInstanceRef.current = null;
            };
        }
    }, []);

    // Filter dispatch list based on date ONLY (for returns display)
    useEffect(() => {
        let filtered = [...dispatchList];

        // Filter by date
        if (selectedDate && selectedDate.trim() !== '') {
            const selectedDateObj = new Date(selectedDate);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate.toDateString() === selectedDateObj.toDateString();
            });
        }

        setFilteredDispatchList(filtered);
    }, [dispatchList, selectedDate]);

    // Separate handler for PAVTI NO search - searches in ALL data, not filtered
    useEffect(() => {
        if (!pavtiNoSearch.trim()) {
            setShowInputMode(false);
            setSelectedDispatchData(null);
            return;
        }

        // Search in the FULL dispatchList, not filteredDispatchList
        const matchingDispatches = dispatchList.filter(item =>
            item.dispatch_code.toLowerCase().includes(pavtiNoSearch.toLowerCase())
        );

        if (matchingDispatches.length === 0) {
            setShowInputMode(false);
            setSelectedDispatchData(null);
            return;
        }

        // Check for exact match
        const exactMatch = matchingDispatches.find(item =>
            item.dispatch_code.toLowerCase() === pavtiNoSearch.toLowerCase()
        );

        if (exactMatch) {
            setSelectedDispatchData(exactMatch);
            setShowInputMode(true);
        } else {
            setShowInputMode(false);
            setSelectedDispatchData(null);
        }
    }, [dispatchList, pavtiNoSearch]);

    // // Fetchers (keep existing ones)
    // const fetchZpOrders = async () => {
    //     try {
    //         const response = await fetch('/api/zporderdetails');
    //         const data = await response.json();
    //         setZpOrders(data);
    //     } catch (error) {
    //         console.error('Error fetching ZP orders:', error);
    //         toast.error('Failed to fetch order details');
    //     }
    // };



    // const fetchCenters = async () => {
    //     try {
    //         const res = await fetch('/api/centerapi');
    //         setCenterList(await res.json());
    //     } catch {
    //         toast.error('Failed to load centers');
    //     }
    // };

    const fetchItemMaster = async () => {
        try {
            const res = await fetch('/api/itemgrains');
            if (res.ok) setItemGrains(await res.json());
        } catch { }
    };

    const fetchDispatchList = async () => {
        try {
            // Get user_id and company_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            
            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            
            const res = await fetch(`/api/dispatchdetails${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) setDispatchList(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    // const fetchTalukas = async () => {
    //     try {
    //         const res = await fetch('/api/taluka');
    //         if (res.ok) setTalukaList(await res.json());
    //     } catch {
    //         toast.error('Failed to load taluka');
    //     }
    // };

    

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    // fetchZpOrders(),
                    // fetchSchoolWiseOrders(),
                    // fetchTrucks(),
                    // fetchTalukas(),
                    // fetchCenters(),
                    fetchItemMaster(),
                    fetchDispatchList(),
                    // fetchSchoolDataMap()
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Get dispatch rows for selected dispatch
    const dispatchRows = useMemo<DispatchRow[]>(() => {
        if (!selectedDispatchData) return [];

        // Get all items for this dispatch
        const items = dispatchList.filter(d => d.dispatch_code === selectedDispatchData.dispatch_code);
        const rows: DispatchRow[] = [];

        items.forEach(item => {
            const master = itemGrains.find(g => g.name.trim() === item.item_name.trim());
            rows.push({
                schoolname: item.schoolname || '',
                grain: item.item_name,
                totalQty: Number(item.total_qty || 0),
                remainingQty: Number(item.bal_qty || 0),
                unit: master?.Unit || item.unit || 'kg',
            });
        });

        return rows;
    }, [selectedDispatchData, dispatchList, itemGrains]);

    // Updated toolbar with clear button
    const toolbar = (
        <div className="flex gap-4 items-end mb-4">
            <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1 text-left">Date Filter</span>
                <div className="relative">
                    <input
                        ref={datePickerRef}
                        type="text"
                        placeholder="Select Date"
                        className="h-10 rounded-md border px-3 pr-20 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="absolute inset-y-0 right-6 flex items-center pr-2 text-red-500 hover:text-red-700"
                        title="Clear Date Filter"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            setSelectedDate(todayStr);
                            if (flatpickrInstanceRef.current) {
                                flatpickrInstanceRef.current.setDate(todayStr);
                            }
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                        title="Set Today"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1 text-left">PAVTI NO Search</span>
                <input
                    type="text"
                    placeholder="Enter PAVTI NO..."
                    className="h-10 w-64 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={pavtiNoSearch}
                    onChange={(e) => setPavtiNoSearch(e.target.value)}
                />
            </div>

            <button
                type="button"
                className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium"
                onClick={() => {
                    if (!pavtiNoSearch.trim()) {
                        toast.error('Please enter PAVTI NO');
                        return;
                    }
                }}
            >
                Search
            </button>

            <button
                type="button"
                className="h-10 px-4 rounded-md bg-green-600 text-white text-sm font-medium"
                onClick={async () => {
                    try {
                        if (!selectedDispatchData || dispatchRows.length === 0) {
                            toast.error('No dispatch data selected');
                            return;
                        }

                        const hasReturnValues = Object.values(returnInputs).some(val => val && val > 0);
                        if (!hasReturnValues) {
                            toast.error('Please enter at least one return quantity');
                            return;
                        }

                        setLoading(true);

                        const updates = dispatchRows
                            .filter(row => returnInputs[row.grain] !== undefined)
                            .map(row => {
                                const returnQty = returnInputs[row.grain] || 0;
                                const total = Number(row.totalQty);
                                const originalDispatched = total - Number(row.remainingQty);
                                const newQtyDispatch = newQtyDispatchInputs[row.grain] || (originalDispatched - returnQty);
                                
                                const dispatchItem = dispatchList.find(d => 
                                    d.dispatch_code === selectedDispatchData.dispatch_code && 
                                    d.item_name === row.grain
                                );
                                
                                if (!dispatchItem) {
                                    console.error(`Could not find dispatch item for grain: ${row.grain}`);
                                    return null;
                                }
                                
                                return {
                                    id: dispatchItem.id,
                                    return_qty: returnQty,
                                    new_qty_dispatch: newQtyDispatch
                                };
                            })
                            .filter(update => update !== null);

                        if (updates.length > 0) {
                            await Promise.all(
                                updates.map(update =>
                                    fetch('/api/dispatchdetails', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(update),
                                    }).then(async (res) => {
                                        if (!res.ok) {
                                            const er = await res.json().catch(() => ({}));
                                            throw new Error(er.message || 'Failed to update dispatch');
                                        }
                                    })
                                )
                            );
                        }

                        toast.success('Return quantities and new dispatch quantities updated successfully');

                        await fetchDispatchList();

                        setReturnInputs({});
                        setNewQtyDispatchInputs({});
                        setPavtiNoSearch('');
                        setShowInputMode(false);
                        setSelectedDispatchData(null);

                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to update');
                    } finally {
                        setLoading(false);
                    }
                }}
                disabled={loading || !showInputMode}
            >
                {loading ? 'Submitting...' : 'Submit'}
            </button>
        </div>
    );

    // Get items with returns for table display
    const returnItems = useMemo(() => {
        return filteredDispatchList.filter(item => item.dispatch_return && item.dispatch_return > 0);
    }, [filteredDispatchList]);

    // Group return items by dispatch code for table display
    const groupedReturns = useMemo(() => {
        const grouped = new Map<string, DispatchListRow[]>();
        
        returnItems.forEach(item => {
            if (!grouped.has(item.dispatch_code)) {
                grouped.set(item.dispatch_code, []);
            }
            grouped.get(item.dispatch_code)!.push(item);
        });
        
        return Array.from(grouped.entries()).map(([dispatchCode, items]) => {
            const firstItem = items[0];
            return {
                dispatch_code: dispatchCode,
                date: firstItem.created_at,
                schoolname: firstItem.schoolname,
                center_name: firstItem.center_name,
                truckNo: firstItem.truckNo,
                class_range: firstItem.class_range,
                items: items.map(item => ({
                    item_name: item.item_name,
                    unit: item.unit,
                    qty_dispatch: item.qty_dispatch,
                    dispatch_return: item.dispatch_return,
                    new_qty_dispatch: item.new_qty_dispatch,
                    totalqty: item.total_qty,
                    bal_qty: item.bal_qty
                }))
            };
        });
    }, [returnItems]);

    return (
        <div className="">
            {isLoading && <Loader />}

            {showInputMode && selectedDispatchData ? (
                <div className="bg-white rounded-2xl shadow-md border p-4">
                    <div className="mb-4">{toolbar}</div>

                    {/* Dispatch Info */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Dispatch Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>PAVTI NO:</strong> {selectedDispatchData.dispatch_code}</div>
                            <div><strong>Date:</strong> {formatDateToDDMMYYYY(selectedDispatchData.created_at)}</div>
                            <div><strong>School:</strong> {selectedDispatchData.schoolname}</div>
                            <div><strong>Center:</strong> {selectedDispatchData.center_name}</div>
                            <div><strong>Truck:</strong> {selectedDispatchData.truckNo}</div>
                            <div><strong>Class:</strong> {selectedDispatchData.class_range || '-'}</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 dark:border-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Sr No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Order Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Qty Dispatch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">New Qty Dispatch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Return</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Bal Qtsy</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {dispatchRows.map((row, index) => {
                                    const total = Number(row.totalQty);
                                    
                                    const dispatchItem = dispatchList.find(d => 
                                        d.dispatch_code === selectedDispatchData?.dispatch_code && 
                                        d.item_name === row.grain
                                    );
                                    
                                    const newQtyDispatchFromDB = dispatchItem ? Number(dispatchItem.new_qty_dispatch || 0) : 0;
                                    const qtyDispatchFromDB = dispatchItem ? Number(dispatchItem.qty_dispatch || 0) : 0;
                                    
                                    const returnValue = returnInputs[row.grain] !== undefined
                                        ? Number(returnInputs[row.grain])
                                        : 0;

                                    const newQtyDispatchValue = newQtyDispatchInputs[row.grain] !== undefined
                                        ? Number(newQtyDispatchInputs[row.grain])
                                        : qtyDispatchFromDB;

                                    const bal = total - newQtyDispatchValue;

                                    return (
                                        <tr key={row.grain}>
                                            <td className="px-4 py-3 border">{index + 1}</td>
                                            <td className="px-4 py-3 border">{row.grain}</td>
                                            <td className="px-4 py-3 border">{row.unit}</td>
                                            <td className="px-4 py-3 border">{row.totalQty}</td>
                                            <td className="px-4 py-3 border">
                                                <input
                                                    type="number"
                                                    value={newQtyDispatchFromDB}
                                                    className="h-9 w-28 rounded border px-2 text-sm bg-gray-100"
                                                    disabled
                                                    readOnly
                                                />
                                            </td>
                                            <td className="px-4 py-3 border">
                                                <span className="px-2 py-1 text-sm font-medium text-gray-700">
                                                    {newQtyDispatchValue}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={qtyDispatchFromDB}
                                                    className="h-9 w-28 rounded border px-2 text-sm"
                                                    value={returnValue}
                                                    onChange={(e) => {
                                                        if (e.target.value === '') {
                                                            setReturnInputs(prev => ({ ...prev, [row.grain]: 0 }));
                                                            setNewQtyDispatchInputs(prev => ({ ...prev, [row.grain]: qtyDispatchFromDB }));
                                                            return;
                                                        }
                                                        const raw = Number(e.target.value);
                                                        const val = Number.isFinite(raw) ? raw : 0;
                                                        const maxReturn = qtyDispatchFromDB;
                                                        if (val > maxReturn) {
                                                            toast.error(`Return quantity cannot exceed dispatched quantity. Max allowed: ${maxReturn}`);
                                                            return;
                                                        }
                                                        const capped = Math.min(Math.max(0, val), maxReturn);
                                                        setReturnInputs(prev => ({ ...prev, [row.grain]: capped }));

                                                        const newQtyDispatch = qtyDispatchFromDB - capped;
                                                        setNewQtyDispatchInputs(prev => ({ ...prev, [row.grain]: newQtyDispatch }));
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value === '') {
                                                            setReturnInputs(prev => ({ ...prev, [row.grain]: 0 }));
                                                            setNewQtyDispatchInputs(prev => ({ ...prev, [row.grain]: qtyDispatchFromDB }));
                                                        }
                                                    }}
                                                />
                                            </td>

                                            <td className={`px-4 py-3 border ${bal === 0 ? 'text-red-600 font-semibold' : bal > 0 ? 'text-green-600 font-semibold' : 'text-blue-600 font-semibold'}`}>
                                                {bal}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Show returns table when not in input mode
                <div className="bg-white rounded-2xl shadow-md border p-4">
                    <div className="mb-4">{toolbar}</div>

                    {pavtiNoSearch && filteredDispatchList.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No dispatch found with PAVTI NO: {pavtiNoSearch}
                        </div>
                    )}

                    {!pavtiNoSearch && returnItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            {selectedDate ? `No returns found for date: ${formatDateToDDMMYYYY(selectedDate)}` : 'Enter date filter or PAVTI NO to view dispatch details'}
                        </div>
                    )}

                    {!pavtiNoSearch && returnItems.length > 0 && (
                        <div className="overflow-x-auto">
                           
                            <table className="min-w-full border border-gray-200 dark:border-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Sr No</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">PAVTI NO</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Date</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">School</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Center</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Truck</th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Class</th>
                                        <th colSpan={5} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item Details</th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Qty Dispatched</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Return</th>
                                        {/* <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">New Qty Dispatch</th> */}
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">New Qty Dispatched</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {groupedReturns.map((group, groupIndex) => (
                                        group.items.map((item, itemIndex) => (
                                            <tr key={`${group.dispatch_code}-${itemIndex}`}>
                                                {itemIndex === 0 && (
                                                    <>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border text-center" style={{ verticalAlign: 'top' }}>{groupIndex + 1}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{group.dispatch_code}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{formatDateToDDMMYYYY(group.date)}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{group.schoolname}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{group.center_name}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{group.truckNo}</td>
                                                        <td rowSpan={group.items.length} className="px-4 py-3 border" style={{ verticalAlign: 'top' }}>{group.class_range || '-'}</td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3 border">{item.item_name}</td>
                                                <td className="px-4 py-3 border text-center">{item.totalqty}</td>
                                                <td className="px-4 py-3 border text-center font-semibold text-red-600">{item.bal_qty}</td>
                                                {/* <td className="px-4 py-3 border text-center">{item.new_qty_dispatch}</td> */}
                                                <td className="px-4 py-3 border text-center">{item.qty_dispatch }</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CellsReturn;