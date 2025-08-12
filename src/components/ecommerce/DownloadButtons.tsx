// // components/DownloadButtons.tsx
// 'use client';
// import * as XLSX from 'xlsx';
// export function DownloadButtons() {
//     const handleDownload = async (format: 'excel' | 'pdf') => {
//         try {
//             const res = await fetch('/api/pendingdoc');
//             const data = await res.json();

//             if (format === 'excel') {
//                 const worksheet = XLSX.utils.json_to_sheet(data);
//                 const workbook = XLSX.utils.book_new();
//                 XLSX.utils.book_append_sheet(workbook, worksheet, "PendingDocs");
            
//                 const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//                 const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            
//                 const link = document.createElement('a');
//                 link.href = URL.createObjectURL(blob);
//                 link.download = 'data.xlsx';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//             }else {
//                 // Convert to PDF (simplified example)
//                 const pdfContent = data.map((item: any) =>
//                     `ID: ${item.id}\nName: ${item.name}\nStatus: ${item.status}\n\n`
//                 ).join('');

//                 const blob = new Blob([pdfContent], { type: 'application/pdf' });
//                 const url = URL.createObjectURL(blob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = 'data.pdf';
//                 document.body.appendChild(link);
//                 link.click();
//                 URL.revokeObjectURL(url);
//             }
//         } catch (error) {
//             console.error('Download failed:', error);
//         }
//     };

//     return (
//         <div className="flex gap-4">
//             <button
//                 onClick={() => handleDownload('excel')}
//                 className="bg-green-600 text-white px-4 py-2 rounded"
//             >
//                 Download Excel
//             </button>
//             <button
//                 onClick={() => handleDownload('pdf')}
//                 className="bg-red-600 text-white px-4 py-2 rounded"
//             >
//                 Download PDF
//             </button>
//         </div>
//     );
// }
