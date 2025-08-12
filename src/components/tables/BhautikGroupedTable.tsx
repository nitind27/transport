import React from 'react';
import { BhautikDataall } from '../schemeserve/Bhautikdatatype';

interface Props {
  data: BhautikDataall[];
}

const BhautikGroupedTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[1600px] w-full text-sm text-left border-collapse">
        <thead>
          <tr>
            <th rowSpan={2} className="border px-2 py-2 bg-gray-100">SR No.</th>
            <th rowSpan={2} className="border px-2 py-2 bg-gray-100">योजना</th>
            <th colSpan={3} className="border px-2 py-2 bg-gray-100 text-center">एकूण लोकसंख्या</th>
            <th colSpan={4} className="border px-2 py-2 bg-gray-100 text-center">आदिवासी लोकसंख्या</th>
            <th colSpan={2} className="border px-2 py-2 bg-gray-100 text-center">कुटुंब माहिती</th>
            <th colSpan={6} className="border px-2 py-2 bg-gray-100 text-center">डॉक्युमेंट्स</th>
            <th colSpan={4} className="border px-2 py-2 bg-gray-100 text-center">सुविधा/योजना</th>
          </tr>
          <tr>
            {/* एकूण लोकसंख्या */}
            <th className="border px-2 py-2 bg-gray-50 text-center">स्री</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">पुरुष</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">एकूण कुटुंब संख्या</th>
            {/* आदिवासी लोकसंख्या */}
            <th className="border px-2 py-2 bg-gray-50 text-center">स्री</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">पुरुष</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">आदिवासी लोकसंख्या</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">आदिवासी लोकसंख्या टक्केवारी</th>
            {/* कुटुंब माहिती */}
            <th className="border px-2 py-2 bg-gray-50 text-center">कुटुंब संख्या</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">एकूण आदिवासी कुटुंब संख्या</th>
            {/* डॉक्युमेंट्स */}
            <th className="border px-2 py-2 bg-gray-50 text-center">आधारकार्ड</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">मतदार ओळखपत्र</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">राशन कार्ड</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">जॉब कार्ड</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">PM किसान कार्ड</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">आयुष्मान कार्ड</th>
            {/* सुविधा/योजना */}
            <th className="border px-2 py-2 bg-gray-50 text-center">विद्युतीकरण</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">प्राथमिक शाळा</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">माध्यमिक शाळा</th>
            <th className="border px-2 py-2 bg-gray-50 text-center">नदी तलाव</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={22} className="text-center py-6 text-gray-500">No records found</td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const totalPop = row.totalpopulation?.split('|') || [];
              const tribalPop = row.tribalpopulation?.split('|') || [];
              return (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border px-2 py-2">{idx + 1}</td>
                  <td className="border px-2 py-2 text-center">{row.scheme_name || '-'}</td>
                  {/* एकूण लोकसंख्या */}
                  <td className="border px-2 py-2 text-center">{totalPop[0] || '-'}</td>
                  <td className="border px-2 py-2 text-center">{totalPop[1] || '-'}</td>
                  <td className="border px-2 py-2 text-center">{totalPop[2] || '-'}</td>
                  {/* आदिवासी लोकसंख्या */}
                  <td className="border px-2 py-2 text-center">{tribalPop[0] || '-'}</td>
                  <td className="border px-2 py-2 text-center">{tribalPop[1] || '-'}</td>
                  <td className="border px-2 py-2 text-center">{tribalPop[2] || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.tribalpopulationtkkwari || '-'}</td>
                  {/* कुटुंब माहिती */}
                  <td className="border px-2 py-2 text-center">{row.totalfamilynumbers || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.tribalwholefamilynumbers || '-'}</td>
                  {/* डॉक्युमेंट्स */}
                  <td className="border px-2 py-2 text-center">{row.aadhaarcard || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.voteridcard || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.rationcard || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.jobcard || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.pmfarmercard || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.ayushmancard || '-'}</td>
                  {/* सुविधा/योजना */}
                  <td className="border px-2 py-2 text-center">{row.electrificationforfamilies || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.elementaryschool || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.middleschool || '-'}</td>
                  <td className="border px-2 py-2 text-center">{row.riverlake || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BhautikGroupedTable; 