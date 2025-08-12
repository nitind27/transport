import React, { useEffect, useState } from 'react';
import { Documents } from '../Documentsdata/documents';
import { FarmdersType } from '../farmersdata/farmers';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Schemesdatas } from '../schemesdata/schemes';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import { Taluka } from '../Taluka/Taluka';
import { UserCategory } from '../usercategory/userCategory';
import { Village } from '../Village/village';
import { Scheme_year } from '../Yearmaster/yearmaster';

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];
}

const Talukawisevillage = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [filters, setFilters] = useState({
        talukaId: null as string | null,
    });

    useEffect(() => {
        // Assuming sessionStorage has the taluka ID under "districtname"
        // (If not, change to the correct key)
        setFilters({
            talukaId: sessionStorage.getItem("districtname"),
        });
    }, []);

    // Filter villages by taluka_id
    const filteredVillages = farmersData.villages.filter(
        (village) => village.taluka_id === filters.talukaId
    );

    return (
        <div className="grid grid-cols-5 gap-4 h-96">
            {filteredVillages.map((village) => (
                <div
                    key={village.taluka_id || village.name}
                    className="p-4 bg-gray-100 rounded shadow text-center"
                >
                    {village.name}
                </div>
            ))}
        </div>
    );

};

export default Talukawisevillage;
