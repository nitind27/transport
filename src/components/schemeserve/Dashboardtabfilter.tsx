"use client"
import React, { useState } from 'react'
import Bhautikadatafilter from './Bhautikadatafilter'
import { Schemesdatas } from '../schemesdata/schemes';
import { UserData } from '../usersdata/Userdata';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import { Grampanchayattype } from '../grampanchayat/gptype';
import { BhautikDataall, vyaktikDataall } from './Bhautikdatatype';
import Vyaktigatdatafilter from './Vyaktigatdatafilter';
// Import your components here

// import AnotherComponent from './AnotherComponent' // Uncomment and replace with your actual component
interface Metrics {

    schemes: Schemesdatas[];
    users: UserData[];
    taluka: Taluka[];
    village: Village[];
    grampanchayat: Grampanchayattype[];
    vyaktidata: vyaktikDataall[];
    bhautikdata: BhautikDataall[];
}
const Dashboardtabfilter = ({ metrics }: { metrics: Metrics }) => {
    // State to track which tab is active
    const [activeTab, setActiveTab] = useState('')

    return (
        <div>
            {/* Tab Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-2 mb-8 mt-5">
                <div>
                    <button
                        className={`p-5 w-full  ${activeTab === 'lable1' ? 'bg-blue-500' : 'bg-blue-300'
                            } text-white`}
                        onClick={() => setActiveTab('lable1')}
                    >
                        भौतिक तक्ता
                    </button>
                </div>
                <div>
                    <button
                        className={`p-5 w-full  ${activeTab === 'lable2' ? 'bg-blue-500' : 'bg-blue-300'
                            } text-white`}
                        onClick={() => setActiveTab('lable2')}
                    >
                    वैयक्तिक
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="w-full mt-4">
                {activeTab === 'lable1' && (
                    <div className="col-span-12">
                        <Bhautikadatafilter initialdata={metrics.bhautikdata} schemescrud={metrics.schemes} talukadata={metrics.taluka} villagedata={metrics.village} getgrampanchayatdata={metrics.grampanchayat} />   </div>
                )}
                {activeTab === 'lable2' && (
                    <div className="col-span-12">
                        <Vyaktigatdatafilter initialdata={metrics.vyaktidata} schemescrud={metrics.schemes} talukadata={metrics.taluka} villagedata={metrics.village} getgrampanchayatdata={metrics.grampanchayat} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboardtabfilter
