"use client";

import { useEffect, useState, useMemo } from 'react';
// import Label from "../form/Label";
// import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
// import Select from 'react-select';
import { toast } from 'react-toastify';
import React from 'react';
// import { MultiValue } from 'react-select';
import { useToggleContext } from '@/context/ToggleContext';
import Loader from '@/common/Loader';
// import DefaultModal from '../example/ModalExample/DefaultModal';
// import { FaEdit } from 'react-icons/fa';
// import { Schemesdatas } from '../schemesdata/schemes';

// import { FaEdit } from 'react-icons/fa';
import { FaDownload } from 'react-icons/fa';
import { Schemesdatas } from '../schemesdata/schemes';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import { Grampanchayattype } from '../grampanchayat/gptype';
import * as XLSX from 'xlsx';
import { Filtertablebhautik } from '../tables/Filtertablebhautik';
// import { saveAs } from 'file-saver';
// import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';

// Define interfaces
interface BhautikData {
    scheme_name: string;
    // Population Data
    ekunSankhya: {
        female: string;
        male: string;
        total: string;
    };
    tribalPopulation: {
        female: string;
        male: string;
        total: string;
    };
    tribalPopulationTkWari: string;

    // Family Data
    totalFamilyNumbers: string;
    tribalsWholeFamilyNumbers: string;
    vaitikAadivasi: string;
    samuhikVanpatta: string;
    cfrmAarakhda: string;

    // Document Data
    aadharcard: {
        asleli: string;
        nasleli: string;
    };
    matdarOlahkhap: {
        asleli: string;
        nasleli: string;
    };
    jaticheGmanap: {
        asleli: string;
        nasleli: string;
    };
    rashionCard: {
        asleli: string;
        nasleli: string;
    };
    jobCard: {
        asleli: string;
        nasleli: string;
    };
    pmKisanCard: {
        asleli: string;
        nasleli: string;
    };
    ayushmanCard: {
        asleli: string;
        nasleli: string;
    };

    // Housing Data
    aadivasiHouse: {
        pakkeGhar: string;
        kudaMatiGhar: string;
    };
    pmAwasYojana: string;

    // Facilities Data
    panyaPanyachiSuvidha: {
        asleli: string;
        nasleli: string;
    };
    harGharNalYojana: {
        asleli: string;
        nasleli: string;
    };
    vidyutikaran: {
        asleli: string;
        nasleli: string;
    };

    // Infrastructure Data
    arogyUpcharKendra: string;
    generalHealthCheckup: string;
    sickleCellAnemiaScreening: string;
    primarySchool: string;
    middleSchool: string;
    kindergarten: string;
    mobileNetwork: string;
    gramPanchayatBuilding: string;
    mobileMedicalUnit: string;
    gotulSocietyBuilding: string;
    nadiTalav: string;
    // contact_no: string;
    // rationcard_no: string;
    allroadvillages: string;
    village_distance: string;
    taluka_id: string;
    village_id: string;
    gp_id: string;

}

interface BhautikDataall {
    scheme_name: string;         // e.g., "50|30|80"
    totalpopulation: string;         // e.g., "50|30|80"
    tribalpopulation: string;        // e.g., "40|20|60"
    tribalpopulationtkkwari: string;
    totalfamilynumbers: string;
    tribalwholefamilynumbers: string;
    aadhaarcard: string;
    voteridcard: string;
    rationcard: string;
    jobcard: string;
    pmfarmercard: string;
    ayushmancard: string;
    electrificationforfamilies: string;
    elementaryschool: string;
    middleschool: string;
    riverlake: string;
    id: number;
    status: string;
    forestshareholderno: string;
    collectiveforestry: string;
    cfrmplan: string;
    breedstandards: string;
    adivasis: string;
    tribalbenefitnumber: string;
    stepfacilities: string;
    everygharnaalyojana: string;
    healthfacilityis: string;
    generalhealthcheckup: string;
    sickleanemia: string;
    kindergarten: string;
    mobilefacilities: string;
    mobilemedicalunit: string;
    gotulsocietybuilding: string;
    allroadvillages: string;
    village_distance: string;
    taluka_id: string;
    village_id: string;
    gp_id: string;
        taluka_name: string;
    village_name: string;
    grampanchayat_name: string;
}

interface Props {
    initialdata: BhautikDataall[];
    schemescrud: Schemesdatas[];
    talukadata: Taluka[];
    villagedata: Village[];
    getgrampanchayatdata: Grampanchayattype[];
    // filtersubcategory: any[];
    // filteryear: any[];
}type Triple = {
    female?: string;
    male?: string;
    total?: string;
};

type Double = {
    asleli?: string;
    nasleli?: string;
};

const Bhautikadatafilter: React.FC<Props> = ({
    initialdata,
    schemescrud,
    talukadata,
    villagedata,
    getgrampanchayatdata

}) => {
    // const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, setisvalidation } = useToggleContext();
    const { isEditMode, setIsmodelopen, setisvalidation } = useToggleContext();
    const [data, setData] = useState<BhautikDataall[]>(initialdata || []);
    const [schemedata] = useState<Schemesdatas[]>(schemescrud || []);

    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Add filter state variables
    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedGrampanchayat, setSelectedGrampanchayat] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');

    // Generate filter options
 
    // Filter data based on selected filters
    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (selectedTaluka && String(item.taluka_id) !== String(selectedTaluka)) return false;
            if (selectedGrampanchayat && String(item.gp_id) !== String(selectedGrampanchayat)) return false;
            if (selectedVillage && String(item.village_id) !== String(selectedVillage)) return false;
            return true;
        });
    }, [data, selectedTaluka, selectedGrampanchayat, selectedVillage]);

    // Filter change handlers
    const handleTalukaFilterChange = (value: string) => {
        setSelectedTaluka(value);
        setSelectedGrampanchayat(''); // Reset dependent filters
        setSelectedVillage('');
    };

    const handleGrampanchayatFilterChange = (value: string) => {
        setSelectedGrampanchayat(value);
        setSelectedVillage(''); // Reset dependent filter
    };

    const handleVillageFilterChange = (value: string) => {
        setSelectedVillage(value);
    };

    // Download functionality
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [searchField, setSearchField] = useState('');

    // Field options for download
    const fieldOptions = useMemo(() => [
        { key: 'taluka_id', label: 'तालुका', category: 'Location' },
        { key: 'village_id', label: 'गाव', category: 'Location' },
        { key: 'gp_id', label: 'ग्रामपंचायत', category: 'Location' },
        { key: 'scheme_name', label: 'योजनाचे नाव', category: 'Basic Info' },
        { key: 'totalpopulation_total', label: 'एकूण कुटुंब संख्या', category: 'Population' },
        { key: 'tribalpopulation_total', label: 'आदिवासी लोकसंख्या', category: 'Population' },
        { key: 'tribalpopulationtkkwari', label: 'आदिवासी लोकसंख्या टक्केवारी', category: 'Population' },
        { key: 'totalfamilynumbers', label: 'कुटुंब संख्या', category: 'Family' },
        { key: 'tribalwholefamilynumbers', label: 'एकूण आदिवासी कुटुंब संख्या', category: 'Family' },
        { key: 'aadharcard', label: 'आधारकार्ड', category: 'Documents' },
        { key: 'voteridcard', label: 'मतदार ओळखपत्र', category: 'Documents' },
        { key: 'castcert', label: 'जातीचे प्रमाणपत्र', category: 'Documents' },
        { key: 'rationcard', label: 'राशन कार्ड', category: 'Documents' },
        { key: 'jobcard', label: 'जॉब कार्ड', category: 'Documents' },
        { key: 'pmfarmercard', label: 'PM किसान कार्ड', category: 'Documents' },
        { key: 'ayushmancard', label: 'आयुष्मान कार्ड', category: 'Documents' },
        { key: 'waterdeink', label: 'पिण्याच्या पाण्याची सुविधा', category: 'Facilities' },
        { key: 'hargharnal', label: 'हर घर नळ योजना', category: 'Facilities' },
        { key: 'electrificationforfamilies', label: 'विद्युतीकरण', category: 'Facilities' },
        { key: 'elementaryschool', label: 'प्राथमिक शाळा', category: 'Education' },
        { key: 'middleschool', label: 'माध्यमिक शाळा', category: 'Education' },
        { key: 'riverlake', label: 'नदी तलाव', category: 'Infrastructure' },
        { key: 'forestshareholderno', label: 'वन हक्क धारक संख्या', category: 'Forest' },
        { key: 'collectiveforestry', label: 'सामूहिक वनपट्टा', category: 'Forest' },
        { key: 'cfrmplan', label: 'CFRM आराखडा', category: 'Forest' },
        { key: 'tribalbenefitnumber', label: 'आदिवासी लाभार्थी संख्या', category: 'Benefits' },
        { key: 'stepfacilities', label: 'पायरी सुविधा', category: 'Facilities' },
        { key: 'healthfacilityis', label: 'आरोग्य सुविधा आहे', category: 'Health' },
        { key: 'generalhealthcheckup', label: 'सर्वसाधारण आरोग्य तपासणी', category: 'Health' },
        { key: 'sickleanemia', label: 'सिकल अ‍ॅनिमिया', category: 'Health' },
        { key: 'kindergarten', label: 'अंगणवाडी', category: 'Education' },
        { key: 'mobilefacilities', label: 'मोबाइल सुविधा', category: 'Facilities' },
        { key: 'mobilemedicalunit', label: 'मोबाइल मेडिकल युनिट', category: 'Health' },
        { key: 'gotulsocietybuilding', label: 'गोटूल समाज भवन', category: 'Infrastructure' },
        { key: 'allroadvillages', label: 'सर्व रस्ते गाव', category: 'Infrastructure' },
        { key: 'village_distance', label: 'गावाचे अंतर', category: 'Infrastructure' },
    ], []);

    // Filtered field options based on search
    const filteredFieldOptions = useMemo(() => {
        if (!searchField) return fieldOptions;
        return fieldOptions.filter(field =>
            field.label.toLowerCase().includes(searchField.toLowerCase()) ||
            field.category.toLowerCase().includes(searchField.toLowerCase())
        );
    }, [fieldOptions, searchField]);

    // Initialize form state
    const [formData, setFormData] = useState<BhautikData>({
        scheme_name: "",
        ekunSankhya: { female: '', male: '', total: '' },
        tribalPopulation: { female: '', male: '', total: '' },
        tribalPopulationTkWari: '',
        totalFamilyNumbers: '',
        tribalsWholeFamilyNumbers: '',
        vaitikAadivasi: '',
        samuhikVanpatta: '',
        cfrmAarakhda: '',
        aadharcard: { asleli: '', nasleli: '' },
        matdarOlahkhap: { asleli: '', nasleli: '' },
        jaticheGmanap: { asleli: '', nasleli: '' },
        rashionCard: { asleli: '', nasleli: '' },
        jobCard: { asleli: '', nasleli: '' },
        pmKisanCard: { asleli: '', nasleli: '' },
        ayushmanCard: { asleli: '', nasleli: '' },
        aadivasiHouse: { pakkeGhar: '', kudaMatiGhar: '' },
        pmAwasYojana: '',
        panyaPanyachiSuvidha: { asleli: '', nasleli: '' },
        harGharNalYojana: { asleli: '', nasleli: '' },
        vidyutikaran: { asleli: '', nasleli: '' },
        arogyUpcharKendra: '',
        generalHealthCheckup: '',
        sickleCellAnemiaScreening: '',
        primarySchool: '',
        middleSchool: '',
        kindergarten: '',
        mobileNetwork: '',
        gramPanchayatBuilding: '',
        mobileMedicalUnit: '',
        gotulSocietyBuilding: '',
        nadiTalav: '',
        // contact_no: '',
        // rationcard_no: '',
        allroadvillages: '',
        village_distance: '',
        taluka_id: '',
        village_id: '',
        gp_id: '',
    });

    const [populationErrors, setPopulationErrors] = useState<{ [key: string]: string }>({});

    // Handle nested state changes
    const handleNestedChange = (
        parentField: keyof BhautikData,
        childField: string,
        value: string
    ) => {
        // Validation for tribalPopulation fields
        if (parentField === 'tribalPopulation') {
            // let totalField = childField;
            // let totalValue = value;
            const ekunValue = formData.ekunSankhya[childField as keyof typeof formData.ekunSankhya] || '';
            if (childField === 'female' || childField === 'male') {
                // Check if tribal value > total value
                if (Number(value) > Number(ekunValue)) {
                    setPopulationErrors(prev => ({
                        ...prev,
                        [`tribalPopulation_${childField}`]: `आदिवासी ${childField === 'female' ? 'स्री' : 'पुरुष'} (${value}) एकूण लोकसंख्या (${ekunValue}) पेक्षा जास्त असू शकत नाही.`,
                    }));
                    toast.error(`आदिवासी ${childField === 'female' ? 'स्री' : 'पुरुष'} (${value}) एकूण लोकसंख्या (${ekunValue}) पेक्षा जास्त असू शकत नाही.`);
                    return;
                } else {
                    setPopulationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`tribalPopulation_${childField}`];
                        return newErrors;
                    });
                }
            }
        }
        // Validation for ekunSankhya: if total is less than tribal, reset tribal
        if (parentField === 'ekunSankhya' && (childField === 'female' || childField === 'male')) {
            // If new total is less than tribal, show error and do not update
            const tribalValue = formData.tribalPopulation[childField as keyof typeof formData.tribalPopulation] || '';
            if (Number(tribalValue) > Number(value)) {
                setPopulationErrors(prev => ({
                    ...prev,
                    [`ekunSankhya_${childField}`]: `एकूण लोकसंख्या (${value}) आदिवासी ${childField === 'female' ? 'स्री' : 'पुरुष'} (${tribalValue}) पेक्षा कमी असू शकत नाही.`,
                }));
                toast.error(`एकूण लोकसंख्या (${value}) आदिवासी ${childField === 'female' ? 'स्री' : 'पुरुष'} (${tribalValue}) पेक्षा कमी असू शकत नाही.`);
                return;
            } else {
                setPopulationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[`ekunSankhya_${childField}`];
                    return newErrors;
                });
            }
        }
        // 4. For all 'asleli' fields (auto-calc nasleli, validate against tribalPopulation.total)
        const asleliFields = [
            'aadharcard',
            'matdarOlahkhap',
            'jaticheGmanap',
            'rashionCard',
            'jobCard',
            'pmKisanCard',
            'ayushmanCard',
            'panyaPanyachiSuvidha',
            'harGharNalYojana',
            'vidyutikaran',
        ];
        if (asleliFields.includes(parentField) && childField === 'asleli') {
            const tribalTotal = Number(formData.tribalPopulation.total) || 0;
            if (Number(value) > tribalTotal) {
                setPopulationErrors(prev => ({
                    ...prev,
                    [`${parentField}_asleli`]: `असलेली आदिवासी संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`,
                }));
                toast.error(`असलेली आदिवासी संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setPopulationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[`${parentField}_asleli`];
                    return newErrors;
                });
            }
            setFormData(prev => {
                const parent = prev[parentField];
                const nasleli = String(tribalTotal - Number(value));
                return {
                    ...prev,
                    [parentField]: {
                        ...((typeof parent === 'object' && parent !== null) ? parent as Record<string, unknown> : {}),
                        asleli: value,
                        nasleli: nasleli
                    }
                };
            });
            return;
        }
        // For all 'asleli' fields, if user tries to edit 'nasleli' directly, just update as normal
        if (asleliFields.includes(parentField) && childField === 'nasleli') {
            setFormData(prev => {
                const parent = prev[parentField];
                return {
                    ...prev,
                    [parentField]: {
                        ...((typeof parent === 'object' && parent !== null) ? parent as Record<string, unknown> : {}),
                        nasleli: value
                    }
                };
            });
            return;
        }
        setFormData(prev => {
            const parent = prev[parentField];
            let updated: Record<string, string>;
            if (parentField === 'ekunSankhya' || parentField === 'tribalPopulation') {
                // Only destructure for population fields
                const { female = '', male = '', total = '', ...rest } = (typeof parent === 'object' && parent !== null) ? parent as { female?: string; male?: string; total?: string } : {};
                updated = {
                    ...rest,
                    female,
                    male,
                    total,
                    [childField]: value
                };
                if (childField === 'female' || childField === 'male') {
                    const newFemale = childField === 'female' ? value : female;
                    const newMale = childField === 'male' ? value : male;
                    updated.total = String(Number(newFemale) + Number(newMale));
                }
            } else {
                // Generic fallback for other fields
                const parentObj = (typeof parent === 'object' && parent !== null) ? parent : {};
                updated = {
                    ...parentObj,
                    [childField]: value
                };
            }
            return {
                ...prev,
                [parentField]: updated
            };
        });
    };


    // Handle simple field changes
    const handleChange = (field: keyof BhautikData, value: string) => {
        // 1. एकूण कुटुंब संख्या <= एकूण लोकसंख्या (totalFamilyNumbers <= ekunSankhya.total)
        if (field === 'totalFamilyNumbers') {
            const totalPop = Number(formData.ekunSankhya.total) || 0;
            if (Number(value) > totalPop) {
                setPopulationErrors(prev => ({
                    ...prev,
                    totalFamilyNumbers: `एकूण कुटुंब संख्या (${value}) एकूण लोकसंख्या (${totalPop}) पेक्षा जास्त असू शकत नाही.`,
                }));
                toast.error(`एकूण कुटुंब संख्या (${value}) एकूण लोकसंख्या (${totalPop}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setPopulationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.totalFamilyNumbers;
                    return newErrors;
                });
            }
        }
        // 2. एकूण कुटुंब संख्या पैकी आदिवासी कुटुंब संख्या <= आदिवासी लोकसंख्या (tribalsWholeFamilyNumbers <= tribalPopulation.total)
        if (field === 'tribalsWholeFamilyNumbers') {
            const tribalTotal = Number(formData.tribalPopulation.total) || 0;
            if (Number(value) > tribalTotal) {
                setPopulationErrors(prev => ({
                    ...prev,
                    tribalsWholeFamilyNumbers: `एकूण कुटुंब संख्या पैकी आदिवासी कुटुंब संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`,
                }));
                toast.error(`एकूण कुटुंब संख्या पैकी आदिवासी कुटुंब संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setPopulationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.tribalsWholeFamilyNumbers;
                    return newErrors;
                });
            }
        }
        // 3. वैयक्तिक आदिवासी वनपट्टेधारक संख्या <= आदिवासी लोकसंख्या (vaitikAadivasi <= tribalPopulation.total)
        if (field === 'vaitikAadivasi') {
            const tribalTotal = Number(formData.tribalPopulation.total) || 0;
            if (Number(value) > tribalTotal) {
                setPopulationErrors(prev => ({
                    ...prev,
                    vaitikAadivasi: `वैयक्तिक आदिवासी वनपट्टेधारक संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`,
                }));
                toast.error(`वैयक्तिक आदिवासी वनपट्टेधारक संख्या (${value}) आदिवासी लोकसंख्या (${tribalTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setPopulationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.vaitikAadivasi;
                    return newErrors;
                });
            }
        }
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validation function
    const validateInputs = () => {
        const errors: Partial<Record<keyof BhautikData, string>> = {};
        setisvalidation(true);

        // // Validate required fields
        // if (!formData.ekunSankhya.female) errors.ekunSankhya = "Female population is required";
        // if (!formData.tribalPopulationTkWari) errors.tribalPopulationTkWari = "Tribal population TK Wari is required";
        // Add more validations as needed

        return Object.keys(errors).length === 0;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bhautikapi');
            const result = await response.json();
            setData(result);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    useEffect(() => {
        fetchData();
    }, [])

    // Add this useEffect after formData is defined
    useEffect(() => {
        const total = Number(formData.ekunSankhya.female) + Number(formData.ekunSankhya.male);
        const tribal = Number(formData.tribalPopulation.female) + Number(formData.tribalPopulation.male);
        let percent = '';
        if (total > 0) {
            percent = ((tribal / total) * 100).toFixed(2);
        }
        setFormData(prev => ({
            ...prev,
            tribalPopulationTkWari: percent
        }));
    }, [formData.ekunSankhya.female, formData.ekunSankhya.male, formData.tribalPopulation.female, formData.tribalPopulation.male]);

    const transformFormData = (data: BhautikData) => {
        const transformTriple = (obj: Triple) =>
            obj && typeof obj === 'object'
                ? [obj.female ?? '', obj.male ?? '', obj.total ?? ''].join('|')
                : '';

        const transformDouble = (obj: Double) =>
            obj && typeof obj === 'object'
                ? [obj.asleli ?? '', obj.nasleli ?? ''].join('|')
                : '';

        return {
            scheme_name: data.scheme_name,
            totalpopulation: transformTriple(data.ekunSankhya),
            tribalpopulation: transformTriple(data.tribalPopulation),
            tribalpopulationtkkwari: data.tribalPopulationTkWari,
            totalfamilynumbers: data.totalFamilyNumbers,
            tribalwholefamilynumbers: data.tribalsWholeFamilyNumbers,
            forestshareholderno: data.vaitikAadivasi,
            collectiveforestry: data.samuhikVanpatta,
            cfrmplan: data.cfrmAarakhda,
            aadhaarcard: transformDouble(data.aadharcard),
            voteridcard: transformDouble(data.matdarOlahkhap),
            breedstandards: transformDouble(data.jaticheGmanap),
            rationcard: transformDouble(data.rashionCard),
            jobcard: transformDouble(data.jobCard),
            pmfarmercard: transformDouble(data.pmKisanCard),
            ayushmancard: transformDouble(data.ayushmanCard),
            adivasis: `${data.aadivasiHouse.pakkeGhar}|${data.aadivasiHouse.kudaMatiGhar}`,
            tribalbenefitnumber: data.pmAwasYojana,
            stepfacilities: transformDouble(data.panyaPanyachiSuvidha),
            everygharnaalyojana: transformDouble(data.harGharNalYojana),
            electrificationforfamilies: transformDouble(data.vidyutikaran),
            healthfacilityis: data.arogyUpcharKendra,
            generalhealthcheckup: data.generalHealthCheckup,
            sickleanemia: data.sickleCellAnemiaScreening,
            elementaryschool: data.primarySchool,
            middleschool: data.middleSchool,
            kindergarten: data.kindergarten,
            mobilenetwork: data.mobileNetwork,
            gramPanchayatBuilding: data.gramPanchayatBuilding,
            mobileMedicalUnit: data.mobileMedicalUnit,
            gotulSocietyBuilding: data.gotulSocietyBuilding,
            nadiTalav: data.nadiTalav,
            // contact_no: '',
            // rationcard_no: '',
            allroadvillages: data.allroadvillages,
            village_distance: data.village_distance,
            taluka_id: data.taluka_id,
            village_id: data.village_id,
            gp_id: data.gp_id
        };
    };


    // Handle form submission
    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);

        const apiUrl = '/api/bhautikapi';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const transformedData = {
                ...(isEditMode && { id: editId }), // include id only on PUT
                ...transformFormData(formData)
            };

            console.log("transformedData", transformedData);

            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transformedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            toast.success(isEditMode ? 'Data updated successfully!' : 'Data saved successfully!');
            fetchData();
            resetForm();
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error(isEditMode ? 'Failed to update data' : 'Failed to save data');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };



    // Reset form to initial state
    const resetForm = () => {
        setFormData({
            scheme_name: "",
            ekunSankhya: { female: '', male: '', total: '' },
            tribalPopulation: { female: '', male: '', total: '' },
            tribalPopulationTkWari: '',
            totalFamilyNumbers: '',
            tribalsWholeFamilyNumbers: '',
            vaitikAadivasi: '',
            samuhikVanpatta: '',
            cfrmAarakhda: '',
            aadharcard: { asleli: '', nasleli: '' },
            matdarOlahkhap: { asleli: '', nasleli: '' },
            jaticheGmanap: { asleli: '', nasleli: '' },
            rashionCard: { asleli: '', nasleli: '' },
            jobCard: { asleli: '', nasleli: '' },
            pmKisanCard: { asleli: '', nasleli: '' },
            ayushmanCard: { asleli: '', nasleli: '' },
            aadivasiHouse: { pakkeGhar: '', kudaMatiGhar: '' },
            pmAwasYojana: '',
            panyaPanyachiSuvidha: { asleli: '', nasleli: '' },
            harGharNalYojana: { asleli: '', nasleli: '' },
            vidyutikaran: { asleli: '', nasleli: '' },
            arogyUpcharKendra: '',
            generalHealthCheckup: '',
            sickleCellAnemiaScreening: '',
            primarySchool: '',
            middleSchool: '',
            kindergarten: '',
            mobileNetwork: '',
            gramPanchayatBuilding: '',
            mobileMedicalUnit: '',
            gotulSocietyBuilding: '',
            nadiTalav: '',
            // contact_no: '',
            // rationcard_no: '',
            allroadvillages: '',
            village_distance: '',
            taluka_id: '',
            village_id: '',
            gp_id: '',
        });
        setEditId(null);
    };


    // Download functions
    const handleFieldToggle = (fieldKey: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldKey)
                ? prev.filter(f => f !== fieldKey)
                : [...prev, fieldKey]
        );
    };

    const handleSelectAll = () => {
        setSelectedFields(fieldOptions.map(field => field.key));
    };

    const handleDeselectAll = () => {
        setSelectedFields([]);
    };

    const getFieldValue = (item: BhautikDataall, fieldKey: string): string => {
        switch (fieldKey) {
            case 'taluka_id':
                const taluka = talukadata.find(t => String(t.taluka_id) === String(item.taluka_id));
                return taluka ? taluka.name : item.taluka_id || '-';
            case 'village_id':
                const village = villagedata.find(v => String(v.village_id) === String(item.village_id));
                return village ? village.name : item.village_id || '-';
            case 'gp_id':
                const gp = getgrampanchayatdata.find(g => String(g.id) === String(item.gp_id));
                return gp ? gp.name : item.gp_id || '-';
            case 'totalpopulation_total':
                const [female, male, total] = item.totalpopulation ? item.totalpopulation.split('|') : ['', '', ''];
                return `स्री: ${female || 'N/A'}, पुरुष: ${male || 'N/A'}, एकूण: ${total || 'N/A'}`;
            case 'tribalpopulation_total':
                const [tfemale, tmale, ttotal] = item.tribalpopulation ? item.tribalpopulation.split('|') : ['', '', ''];
                return `स्री: ${tfemale || 'N/A'}, पुरुष: ${tmale || 'N/A'}, एकूण: ${ttotal || 'N/A'}`;
            case 'aadharcard':
                const [aasleli, anasleli] = item.aadhaarcard ? item.aadhaarcard.split('|') : ['', ''];
                return `असलेली: ${aasleli || 'N/A'}, नसलेली: ${anasleli || 'N/A'}`;
            case 'voteridcard':
                const [vasleli, vnasleli] = item.voteridcard ? item.voteridcard.split('|') : ['', ''];
                return `असलेली: ${vasleli || 'N/A'}, नसलेली: ${vnasleli || 'N/A'}`;
            case 'castcert':
                const [casleli, cnasleli] = item.breedstandards ? item.breedstandards.split('|') : ['', ''];
                return `असलेली: ${casleli || 'N/A'}, नसलेली: ${cnasleli || 'N/A'}`;
            case 'rationcard':
                const [rasleli, rnasleli] = item.rationcard ? item.rationcard.split('|') : ['', ''];
                return `असलेली: ${rasleli || 'N/A'}, नसलेली: ${rnasleli || 'N/A'}`;
            case 'jobcard':
                const [jasleli, jnasleli] = item.jobcard ? item.jobcard.split('|') : ['', ''];
                return `असलेली: ${jasleli || 'N/A'}, नसलेली: ${jnasleli || 'N/A'}`;
            case 'pmfarmercard':
                const [pasleli, pnasleli] = item.pmfarmercard ? item.pmfarmercard.split('|') : ['', ''];
                return `असलेली: ${pasleli || 'N/A'}, नसलेली: ${pnasleli || 'N/A'}`;
            case 'ayushmancard':
                const [ayasleli, aynasleli] = item.ayushmancard ? item.ayushmancard.split('|') : ['', ''];
                return `असलेली: ${ayasleli || 'N/A'}, नसलेली: ${aynasleli || 'N/A'}`;
            case 'waterdeink':
                const [wasleli, wnasleli] = item.adivasis ? item.adivasis.split('|') : ['', ''];
                return `असलेली: ${wasleli || 'N/A'}, नसलेली: ${wnasleli || 'N/A'}`;
            case 'hargharnal':
                const [hasleli, hnasleli] = item.everygharnaalyojana ? item.everygharnaalyojana.split('|') : ['', ''];
                return `असलेली: ${hasleli || 'N/A'}, नसलेली: ${hnasleli || 'N/A'}`;
            case 'electrificationforfamilies':
                const [easleli, enasleli] = item.electrificationforfamilies ? item.electrificationforfamilies.split('|') : ['', ''];
                return `असलेली: ${easleli || 'N/A'}, नसलेली: ${enasleli || 'N/A'}`;
            default:
                return item[fieldKey as keyof BhautikDataall]?.toString() || '-';
        }
    };

    const downloadExcel = () => {
        if (selectedFields.length === 0) {
            toast.error('कृपया डाउनलोड करण्यासाठी किमान एक फील्ड निवडा');
            return;
        }

        try {
            // Prepare headers
            // const headers = selectedFields.map(fieldKey => {
            //     const field = fieldOptions.find(f => f.key === fieldKey);
            //     return field ? field.label : fieldKey;
            // });

            // Prepare data
            const excelData = filteredData.map(item => {
                const row: Record<string, string | number | boolean | null | undefined> = {};

                selectedFields.forEach(fieldKey => {
                    const field = fieldOptions.find(f => f.key === fieldKey);
                    if (field) {
                        row[field.label] = getFieldValue(item, fieldKey);
                    }
                });
                return row;
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Bhautik Data');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `bhautik_data_${timestamp}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);

            toast.success('Excel फाईल यशस्वीरित्या डाउनलोड झाली');
            setShowDownloadModal(false);
            setSelectedFields([]);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('डाउनलोड करताना त्रुटी आली');
        }
    };

    const columns: Column<BhautikDataall>[] = [
        // Existing and population fields
      {
            key: "taluka_id",
            label: "तालुका",
            render: (data) => <span>{data.taluka_name || "-"}</span>,
        },

        {
            key: "gp_id",
            label: "ग्रामपंचायत",
            render: (data) => <span>{data.grampanchayat_name || "-"}</span>,
        },
        {
            key: "village_id",
            label: "गाव",
            render: (data) => <span>{data.village_name || "-"}</span>,
        },

        // {
        //     key: 'scheme_name',
        //     label: 'योजनाचे नाव',
        //     render: (data) => <span>{data.scheme_name || "-"}</span>,
        // },
        {
            key: 'totalpopulation_total',
            label: 'एकूण कुटुंब संख्या',
            render: (data) => {
                const [female, male, total] = data.totalpopulation ? data.totalpopulation.split('|') : ['', '', ''];
                return `स्री: ${female || 'N/A'}, पुरुष: ${male || 'N/A'}, एकूण: ${total || 'N/A'}`;
            }
        },
        {
            key: 'tribalpopulation_total',
            label: 'आदिवासी लोकसंख्या',
            render: (data) => {
                const [female, male, total] = data.tribalpopulation ? data.tribalpopulation.split('|') : ['', '', ''];
                return `स्री: ${female || 'N/A'}, पुरुष: ${male || 'N/A'}, एकूण: ${total || 'N/A'}`;
            }
        },
        {
            key: "tribalpopulationtkkwari",
            label: "आदिवासी लोकसंख्या टक्केवारी",
            render: (data) => <span>{data.tribalpopulationtkkwari || "-"}</span>,
        },
        {
            key: "totalfamilynumbers",
            label: "कुटुंब संख्या",
            render: (data) => <span>{data.totalfamilynumbers || "-"}</span>,
        },
        {
            key: "tribalwholefamilynumbers",
            label: "एकूण आदिवासी कुटुंब संख्या",
            render: (data) => <span>{data.tribalwholefamilynumbers || "-"}</span>,
        },

        // Document fields
        {
            key: 'aadharcard',
            label: 'आधारकार्ड',
            render: (data) => {
                const [asleli, nasleli] = data.aadhaarcard ? data.aadhaarcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },

        {
            key: 'voteridcard',
            label: "मतदार ओळखपत्र",
            render: (data) => {
                const [asleli, nasleli] = data.voteridcard ? data.voteridcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: 'castcert',
            label: "जातीचे प्रमाणपत्र",
            render: (data) => {
                const [asleli, nasleli] = data.breedstandards ? data.breedstandards.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "rationcard",
            label: "राशन कार्ड",
            render: (data) => {
                const [asleli, nasleli] = data.rationcard ? data.rationcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "jobcard",
            label: "जॉब कार्ड",
            render: (data) => {
                const [asleli, nasleli] = data.jobcard ? data.jobcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "pmfarmercard",
            label: "PM किसान कार्ड",
            render: (data) => {
                const [asleli, nasleli] = data.pmfarmercard ? data.pmfarmercard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "ayushmancard",
            label: "आयुष्मान कार्ड",
            render: (data) => {
                const [asleli, nasleli] = data.ayushmancard ? data.ayushmancard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "waterdeink",
            label: "पिण्याच्या पाण्याची सुविधा",
            render: (data) => {
                const [asleli, nasleli] = data.adivasis ? data.adivasis.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },

        // Facility and infrastructure fields
        {
            key: "hargharnal",
            label: "हर घर नळ योजना",
            render: (data) => {
                const [asleli, nasleli] = data.everygharnaalyojana ? data.everygharnaalyojana.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "electrificationforfamilies",
            label: "हर घर नळ योजना",
            render: (data) => {
                const [asleli, nasleli] = data.electrificationforfamilies ? data.electrificationforfamilies.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: "elementaryschool",
            label: "प्राथमिक शाळा",
            render: (data) => <span>{data.elementaryschool || "-"}</span>,
        },
        {
            key: "middleschool",
            label: "माध्यमिक शाळा",
            render: (data) => <span>{data.middleschool || "-"}</span>,
        },
        {
            key: "riverlake",
            label: "नदी तलाव",
            render: (data) => <span>{data.riverlake || "-"}</span>,
        },

        // Newly added fields for full coverage
        {
            key: "forestshareholderno",
            label: "वन हक्क धारक संख्या",
            render: (data) => <span>{data.forestshareholderno || "-"}</span>,
        },
        {
            key: "collectiveforestry",
            label: "सामूहिक वनपट्टा",
            render: (data) => <span>{data.collectiveforestry || "-"}</span>,
        },
        {
            key: "cfrmplan",
            label: "CFRM आराखडा",
            render: (data) => <span>{data.cfrmplan || "-"}</span>,
        },

        {
            key: "tribalbenefitnumber",
            label: "आदिवासी लाभार्थी संख्या",
            render: (data) => <span>{data.tribalbenefitnumber || "-"}</span>,
        },
        {
            key: "stepfacilities",
            label: "पायरी सुविधा",
            render: (data) => <span>{data.stepfacilities || "-"}</span>,
        },

        {
            key: "healthfacilityis",
            label: "आरोग्य सुविधा आहे",
            render: (data) => <span>{data.healthfacilityis || "-"}</span>,
        },
        {
            key: "generalhealthcheckup",
            label: "सर्वसाधारण आरोग्य तपासणी",
            render: (data) => <span>{data.generalhealthcheckup || "-"}</span>,
        },
        {
            key: "sickleanemia",
            label: "सिकल अ‍ॅनिमिया",
            render: (data) => <span>{data.sickleanemia || "-"}</span>,
        },
        {
            key: "kindergarten",
            label: "अंगणवाडी",
            render: (data) => <span>{data.kindergarten || "-"}</span>,
        },
        {
            key: "mobilefacilities",
            label: "मोबाइल सुविधा",
            render: (data) => <span>{data.mobilefacilities || "-"}</span>,
        },
        {
            key: "mobilemedicalunit",
            label: "मोबाइल मेडिकल युनिट",
            render: (data) => <span>{data.mobilemedicalunit || "-"}</span>,
        },
        {
            key: "gotulsocietybuilding",
            label: "गोटूल समाज भवन",
            render: (data) => <span>{data.gotulsocietybuilding || "-"}</span>,
        },
        {
            key: "allroadvillages",
            label: "सर्व रस्ते गाव",
            render: (data) => <span>{data.allroadvillages || "-"}</span>,
        },
        {
            key: "village_distance",
            label: "गावाचे अंतर",
            render: (data) => <span>{data.village_distance || "-"}</span>,
        },


        // Actions column (unchanged)

    ];



    return (
        <div className="">
            {loading && <Loader />}

            {/* Custom Filter UI */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">फिल्टर</h3>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            दाखवत आहे: <span className="font-semibold">{filteredData.length}</span> पैकी <span className="font-semibold">{data.length}</span> नोंदी
                        </div>
                        <button
                            onClick={() => setShowDownloadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                        >
                            <FaDownload className="text-sm" />
                            Excel डाउनलोड
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Taluka Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">तालुका</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={selectedTaluka}
                            onChange={(e) => handleTalukaFilterChange(e.target.value)}
                        >
                            <option value="">सर्व तालुका</option>
                            {talukadata.map((option) => (
                                <option key={option.taluka_id} value={option.taluka_id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grampanchayat Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ग्रामपंचायत</label>
                        <select
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedTaluka
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-800'
                                }`}
                            value={selectedGrampanchayat}
                            onChange={(e) => handleGrampanchayatFilterChange(e.target.value)}
                            disabled={!selectedTaluka}
                        >
                            <option value="">सर्व ग्रामपंचायत</option>
                            {getgrampanchayatdata.filter((data) => data.taluka_id == selectedTaluka).map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Village Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">गाव</label>
                        <select
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedTaluka || !selectedGrampanchayat
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-800'
                                }`}
                            value={selectedVillage}
                            onChange={(e) => handleVillageFilterChange(e.target.value)}
                            disabled={!selectedTaluka || !selectedGrampanchayat}
                        >
                            <option value="">सर्व गाव</option>
                            {villagedata.filter((data) => data.gp_name == selectedGrampanchayat).map((category) => (
                                <option key={category.village_id} value={category.village_id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                {(selectedTaluka || selectedGrampanchayat || selectedVillage) && (
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                setSelectedTaluka('');
                                setSelectedGrampanchayat('');
                                setSelectedVillage('');
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                        >
                            फिल्टर साफ करा
                        </button>
                    </div>
                )}
            </div>

            <Filtertablebhautik
                data={filteredData}
                title='धरती आबा ( भौतिक तक्ता)'
                classname={"h-[650px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="max-w-7xl mx-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5 ">
                            {/* CFRMC आराखडा */}


                            <div className="md:col-span-4 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 h-5">तालुका </label>
                                <select
                                    name=""
                                    id=""
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 "
                                        }`}
                                    value={formData.taluka_id}
                                    onChange={(e) => handleChange('taluka_id', e.target.value)}
                                >
                                    <option value="">तालुका निवडा</option>
                                    {talukadata.map((category) => (
                                        <option key={category.taluka_id} value={category.taluka_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                            </div>


                            {/* आधारकार्ड */}
                            <div className="md:col-span-4 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 h-5">ग्रामपंचायत  </label>
                                <select
                                    name=""
                                    id=""
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 "
                                        }`}
                                    value={formData.gp_id}
                                    onChange={(e) => handleChange('gp_id', e.target.value)}
                                >
                                    <option value="">ग्रामपंचायत  निवडा</option>
                                    {getgrampanchayatdata.filter((data) => data.taluka_id == formData.taluka_id).map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div className="md:col-span-4 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 h-5">
                                    गाव {formData.gp_id}
                                </label>
                                <select
                                    name=""
                                    id=""
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 "
                                        }`}
                                    value={formData.village_id}
                                    onChange={(e) => handleChange('village_id', e.target.value)}
                                >
                                    <option value="">गाव निवडा</option>
                                    {villagedata.filter((data) => data.taluka_id == formData.taluka_id && data.gp_name == formData.gp_id).map((category) => (
                                        <option key={category.village_id} value={category.village_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                            </div>
                        </div>
                        <div>
                            योजना
                            <select
                                name=""
                                id=""
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 "
                                        }`}
                                value={formData.scheme_name}
                                onChange={(e) => handleChange('scheme_name', e.target.value)}
                            >
                                <option value="">योजना निवडा</option>
                                {schemedata.map((category) => (
                                    <option key={category.scheme_id} value={category.scheme_id}>
                                        {category.scheme_name}
                                    </option>
                                ))}
                            </select>

                        </div>
                        <div className='md:flex gap-4 mt-5'>


                            <div className="bg-gray-100  rounded-lg shadow p-4  col-span-1 md:col-span-3">
                                <h3 className="text-lg font-semibold mb-2">एकूण लोकसंख्या</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">स्री</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white bg-white"
                                            value={formData.ekunSankhya.female}
                                            onChange={(e) => handleNestedChange('ekunSankhya', 'female', e.target.value)}
                                        />
                                        {populationErrors.ekunSankhya_female && (
                                            <div className="text-red-600 text-xs mt-1">{populationErrors.ekunSankhya_female}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">पुरुष</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white bg-white"
                                            value={formData.ekunSankhya.male}
                                            onChange={(e) => handleNestedChange('ekunSankhya', 'male', e.target.value)}
                                        />
                                        {populationErrors.ekunSankhya_male && (
                                            <div className="text-red-600 text-xs mt-1">{populationErrors.ekunSankhya_male}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">एकूण</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white bg-white"
                                            value={formData.ekunSankhya.total}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tribal population */}
                            <div className="bg-gray-100 rounded-lg shadow p-4  col-span-1 md:col-span-3 mt-5 md:mt-0">
                                <h3 className="text-lg font-semibold mb-2">आदिवासी लोकसंख्या</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">स्री</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.tribalPopulation.female}
                                            onChange={(e) => handleNestedChange('tribalPopulation', 'female', e.target.value)}
                                        />
                                        {populationErrors.tribalPopulation_female && (
                                            <div className="text-red-600 text-xs mt-1">{populationErrors.tribalPopulation_female}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">पुरुष</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.tribalPopulation.male}
                                            onChange={(e) => handleNestedChange('tribalPopulation', 'male', e.target.value)}
                                        />
                                        {populationErrors.tribalPopulation_male && (
                                            <div className="text-red-600 text-xs mt-1">{populationErrors.tribalPopulation_male}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">एकूण</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.tribalPopulation.total}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="">
                            {/* Total Population */}


                            {/* Other fields in 3-column layout */}
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-5'>
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-6 h-5">आदिवासी लोकसंख्या टक्केवारी</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.tribalPopulationTkWari}
                                        readOnly
                                    />
                                </div>


                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700  mb-6">एकूण कुटुंब संख्या</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.totalFamilyNumbers}
                                        onChange={(e) => handleChange('totalFamilyNumbers', e.target.value)}
                                    />
                                </div>

                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-6 h-5">एकूण कुटुंब संख्या पैकी आदिवासी कुटुंब संख्या</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.tribalsWholeFamilyNumbers}
                                        onChange={(e) => handleChange('tribalsWholeFamilyNumbers', e.target.value)}
                                    />
                                </div>


                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-6 h-5">वैयक्तिक आदिवासी वनपट्टेधारक संख्या</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.vaitikAadivasi}
                                        onChange={(e) => handleChange('vaitikAadivasi', e.target.value)}
                                    />
                                </div>

                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 ">
                                {/* CFRMC आराखडा */}


                                <div className="md:col-span-3 bg-gray-100 rounded-lg shadow p-4 mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-6 h-5">सामूहिक वनपट्टा वाटप आहे/नाही</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="samuhikVanpatta"
                                                value="yes"
                                                checked={formData.samuhikVanpatta === "yes"}
                                                onChange={() => handleChange("samuhikVanpatta", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="samuhikVanpatta"
                                                value="no"
                                                checked={formData.samuhikVanpatta === "no"}
                                                onChange={() => handleChange("samuhikVanpatta", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-3 bg-gray-100 rounded-lg shadow p-4 mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-6 h-5">
                                        CFRMC आराखडा सादर आहे/नाही
                                    </label>
                                    <div className="flex space-x-6 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="cfrmAarakhda"
                                                value="yes"
                                                checked={formData.cfrmAarakhda === "yes"}
                                                onChange={() => handleChange("cfrmAarakhda", "yes")}
                                                className="h-4 w-4 text-indigo-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="cfrmAarakhda"
                                                value="no"
                                                checked={formData.cfrmAarakhda === "no"}
                                                onChange={() => handleChange("cfrmAarakhda", "no")}
                                                className="h-4 w-4 text-indigo-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* आधारकार्ड */}
                                <div className="md:col-span-3 bg-gray-100 rounded-lg shadow p-4 mt-4">
                                    <h3 className="text-sm font-semibold h-5">आधारकार्ड</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                असलेली आदिवासी संख्या
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.aadharcard.asleli}
                                                onChange={(e) => handleNestedChange('aadharcard', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                नसलेली आदिवासी संख्या
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.aadharcard.nasleli}
                                                onChange={(e) => handleNestedChange('aadharcard', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* मतदार ओळखपत्र */}
                                <div className="md:col-span-3 bg-gray-100 rounded-lg shadow p-4 mt-4">
                                    <div className='flex'>

                                        <h3 className="text-sm font-semibold ">मतदार ओळखपत्र </h3> <span className='text-[12px] mr-1'> (18 वर्षावरील)</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                असलेली आदिवासी संख्या
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.matdarOlahkhap.asleli}
                                                onChange={(e) => handleNestedChange('matdarOlahkhap', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                नसलेली आदिवासी संख्या
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.matdarOlahkhap.nasleli}
                                                onChange={(e) => handleNestedChange('matdarOlahkhap', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className='md:flex gap-4 mt-5'>




                                {/* Matdar Olakhap */}


                                {/* <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-5">राशन कार्ड क्रमांक</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.rationcard_no}
                                        onChange={(e) => handleChange('rationcard_no', e.target.value)}
                                    />
                                </div> */}

                            </div>

                            <div className='md:flex gap-4 '>

                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb">जातीचे प्रमाणपत्र</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">असलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.jaticheGmanap.asleli}
                                                onChange={(e) => handleNestedChange('jaticheGmanap', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.jaticheGmanap.nasleli}
                                                onChange={(e) => handleNestedChange('jaticheGmanap', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className=" p-2 col-span-1 md:col-span-3 mb-2 bg-gray-100 p-2 rounded-lg shadow mt-5 md:mt-0">


                                    <h3 className="text-sm font-semibold mb-2">राशन कार्ड</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">असलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.rashionCard.asleli}
                                                onChange={(e) => handleNestedChange('rashionCard', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.rashionCard.nasleli}
                                                onChange={(e) => handleNestedChange('rashionCard', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className=" p-2 col-span-1 md:col-span-3 bg-gray-100 p-2 rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb-2">जॉब कार्ड</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">असलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.jobCard.asleli}
                                                onChange={(e) => handleNestedChange('jobCard', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.jobCard.nasleli}
                                                onChange={(e) => handleNestedChange('jobCard', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PM Kisan Card */}
                                <div className=" p-2 col-span-1 md:col-span-3 bg-gray-100 p-2 rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb-2">PM किसान कार्ड</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">असलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.pmKisanCard.asleli}
                                                onChange={(e) => handleNestedChange('pmKisanCard', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली आदिवासी संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.pmKisanCard.nasleli}
                                                onChange={(e) => handleNestedChange('pmKisanCard', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>



                            </div>
                            <div className='md:flex mt-5 gap-4'>


                                {/* Aadivasi House */}

                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow">
                                    <h3 className="text-sm font-semibold mb-2">एकूण आदिवासी कुटुंबाचे </h3>
                                    <div className="grid grid-cols-2 gap-3">

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8">पक्के घर </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.aadivasiHouse.pakkeGhar}
                                                onChange={(e) => handleNestedChange('aadivasiHouse', 'pakkeGhar', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8">कुडा/मातीचे घर</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.aadivasiHouse.kudaMatiGhar}
                                                onChange={(e) => handleNestedChange('aadivasiHouse', 'kudaMatiGhar', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Ayushman Card */}
                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb-2">आयुष्मान कार्ड</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8">असलेली आदिवासी कुटुंब संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.ayushmanCard.asleli}
                                                onChange={(e) => handleNestedChange('ayushmanCard', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8"> नसलेली आदिवासी कुटुंबसंख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.ayushmanCard.nasleli}
                                                onChange={(e) => handleNestedChange('ayushmanCard', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb-2">पिण्याच्या पाण्याची सुविधा </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8">असलेली आदिवासी कुटुंब संख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.panyaPanyachiSuvidha.asleli}
                                                onChange={(e) => handleNestedChange('panyaPanyachiSuvidha', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8"> नसलेली आदिवासी कुटुंबसंख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.panyaPanyachiSuvidha.nasleli}
                                                onChange={(e) => handleNestedChange('panyaPanyachiSuvidha', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow mt-5 md:mt-0">
                                    <h3 className="text-sm font-semibold mb-2">हर घर नळ योजना</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8">असलेली आदिवासी कुटुंबसंख्या </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.harGharNalYojana.asleli}
                                                onChange={(e) => handleNestedChange('harGharNalYojana', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 h-8"> नसलेली आदिवासी कुटुंबसंख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.harGharNalYojana.nasleli}
                                                onChange={(e) => handleNestedChange('harGharNalYojana', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='md:flex mt-5 gap-4'>

                                <div className=" p-2 col-span-1 md:col-span-3  bg-gray-100  rounded-lg shadow mt-5 md:mt-0 mb-5 md:mb-0">
                                    <h3 className="text-sm font-semibold mb-2 h-8">विद्युतीकरण</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">असलेली आदिवासी कुटुंबसंख्या </label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.vidyutikaran.asleli}
                                                onChange={(e) => handleNestedChange('vidyutikaran', 'asleli', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1"> नसलेली आदिवासी कुटुंबसंख्या</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                                value={formData.vidyutikaran.nasleli}
                                                onChange={(e) => handleNestedChange('vidyutikaran', 'nasleli', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-100 rounded-lg shadow p-4 mb-5 md:mb-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 h-8">सर्व रस्ते जोडलेल्या गावांची संख्या</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.allroadvillages}
                                        onChange={(e) => handleChange('allroadvillages', e.target.value)}
                                    />
                                </div>
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-7 h-8">५ किमी अंतरापर्यंत बाजारपेठ नसलेल्या गावांची संख्या</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.village_distance}
                                        onChange={(e) => handleChange('village_distance', e.target.value)}
                                    />
                                </div>
                                <div className=" p-2  bg-gray-100  rounded-lg shadow mt-5 md:mt-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 font-unwrap whitespace-nowrap h-8">पीएम आवास घरकुल लाभ संख्या</label>
                                    <div className="flex space-x-3 mt-1">

                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            name="pmAwasYojana"
                                            value={formData.pmAwasYojana}

                                            onChange={() => handleChange("pmAwasYojana", "yes")}

                                        />

                                    </div>
                                </div>
                            </div>
                            {/* Jatiche Gmanap */}
                            <div className='grid grid-cols-1 md:grid-cols-6 gap-4 mb-5 mt-5'>
                                {/* Continue with other sections in similar compact format */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 h-6">आरोग्य उपकेंद्र/PHC</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center mb-4">
                                            <input
                                                type="radio"
                                                name="arogyUpcharKendra"
                                                value="yes"
                                                checked={formData.arogyUpcharKendra === "yes"}
                                                onChange={() => handleChange("arogyUpcharKendra", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center  mb-4">
                                            <input
                                                type="radio"
                                                name="arogyUpcharKendra"
                                                value="no"
                                                checked={formData.arogyUpcharKendra === "no"}
                                                onChange={() => handleChange("arogyUpcharKendra", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>






                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">सामान्य आरोग्य तपासणी
                                        होय /नाही</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="generalHealthCheckup"
                                                value="yes"
                                                checked={formData.generalHealthCheckup === "yes"}
                                                onChange={() => handleChange("generalHealthCheckup", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="generalHealthCheckup"
                                                value="no"
                                                checked={formData.generalHealthCheckup === "no"}
                                                onChange={() => handleChange("generalHealthCheckup", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>


                                {/* Continue with all remaining fields in similar compact format */}
                                {/* Primary School */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">प्राथमिक शाळा</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="primarySchool"
                                                value="yes"
                                                checked={formData.primarySchool === "yes"}
                                                onChange={() => handleChange("primarySchool", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="primarySchool"
                                                value="no"
                                                checked={formData.primarySchool === "no"}
                                                onChange={() => handleChange("primarySchool", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Middle School */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">माध्यमिक शाळा</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="middleSchool"
                                                value="yes"
                                                checked={formData.middleSchool === "yes"}
                                                onChange={() => handleChange("middleSchool", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="middleSchool"
                                                value="no"
                                                checked={formData.middleSchool === "no"}
                                                onChange={() => handleChange("middleSchool", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>


                                {/* Kindergarten */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">अंगणवाडी इमारत आहे/ नाही</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="kindergarten"
                                                value="yes"
                                                checked={formData.kindergarten === "yes"}
                                                onChange={() => handleChange("kindergarten", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="kindergarten"
                                                value="no"
                                                checked={formData.kindergarten === "no"}
                                                onChange={() => handleChange("kindergarten", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Mobile Network */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">मोबाईल नेटवर्क सुविधा</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="mobileNetwork"
                                                value="yes"
                                                checked={formData.mobileNetwork === "yes"}
                                                onChange={() => handleChange("mobileNetwork", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="mobileNetwork"
                                                value="no"
                                                checked={formData.mobileNetwork === "no"}
                                                onChange={() => handleChange("mobileNetwork", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Gram Panchayat Building */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">ग्रामपंचायत इमारत</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="gramPanchayatBuilding"
                                                value="yes"
                                                checked={formData.gramPanchayatBuilding === "yes"}
                                                onChange={() => handleChange("gramPanchayatBuilding", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="gramPanchayatBuilding"
                                                value="no"
                                                checked={formData.gramPanchayatBuilding === "no"}
                                                onChange={() => handleChange("gramPanchayatBuilding", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Gotul Society Building */}
                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">गोटूल/ समाज भवन
                                        आहे/ नाही</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="gotulSocietyBuilding"
                                                value="yes"
                                                checked={formData.gotulSocietyBuilding === "yes"}
                                                onChange={() => handleChange("gotulSocietyBuilding", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="gotulSocietyBuilding"
                                                value="no"
                                                checked={formData.gotulSocietyBuilding === "no"}
                                                onChange={() => handleChange("gotulSocietyBuilding", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Nadi Talav */}



                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-6">मोबाईल वैद्यकीय युनिट</label>



                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="mobileMedicalUnit"
                                                value="yes"
                                                checked={formData.mobileMedicalUnit === "yes"}
                                                onChange={() => handleChange("mobileMedicalUnit", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>


                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="mobileMedicalUnit"
                                                value="no"
                                                checked={formData.mobileMedicalUnit === "no"}
                                                onChange={() => handleChange("mobileMedicalUnit", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>

                                    </div>
                                </div>




                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1 h-10">सिकलसेल आणि ॲनिमियासाठी तपासणी
                                        होय /नाही</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="sickleCellAnemiaScreening"
                                                value="yes"
                                                checked={formData.sickleCellAnemiaScreening === "yes"}
                                                onChange={() => handleChange("sickleCellAnemiaScreening", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="sickleCellAnemiaScreening"
                                                value="no"
                                                checked={formData.sickleCellAnemiaScreening === "no"}
                                                onChange={() => handleChange("sickleCellAnemiaScreening", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-gray-100 rounded-lg shadow p-2 ">
                                    <label className="block text-sm font-medium text-gray-700 mb-5 mb-1">नदी तलाव</label>
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="nadiTalav"
                                                value="yes"
                                                checked={formData.nadiTalav === "yes"}
                                                onChange={() => handleChange("nadiTalav", "yes")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="nadiTalav"
                                                value="no"
                                                checked={formData.nadiTalav === "no"}
                                                onChange={() => handleChange("nadiTalav", "no")}
                                                className="h-3 w-3 text-indigo-600"
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (isEditMode ? 'Update' : 'Save Changes')}
                    </button>
                }
                searchKey="beneficiery_name"
                columns={columns}
            />

            {/* Download Modal */}
            {showDownloadModal && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center z-999">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Excel डाउनलोड - फील्ड निवडा</h2>
                            <button
                                onClick={() => {
                                    setShowDownloadModal(false);
                                    setSelectedFields([]);
                                    setSearchField('');
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Search Field */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="फील्ड शोधा..."
                                value={searchField}
                                onChange={(e) => setSearchField(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Select All/Deselect All Buttons */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={handleSelectAll}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                                सर्व निवडा
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                                सर्व निवड रद्द करा
                            </button>
                        </div>

                        {/* Field Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {filteredFieldOptions.map((field) => (
                                <div key={field.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        id={field.key}
                                        checked={selectedFields.includes(field.key)}
                                        onChange={() => handleFieldToggle(field.key)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={field.key} className="ml-3 text-sm text-gray-700 cursor-pointer">
                                        <div className="font-medium">{field.label}</div>
                                        <div className="text-xs text-gray-500">{field.category}</div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDownloadModal(false);
                                    setSelectedFields([]);
                                    setSearchField('');
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                                रद्द करा
                            </button>
                            <button
                                onClick={downloadExcel}
                                disabled={selectedFields.length === 0}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedFields.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                डाउनलोड करा ({selectedFields.length} फील्ड)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bhautikadatafilter;