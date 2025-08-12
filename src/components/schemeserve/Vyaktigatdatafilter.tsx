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
// import { BhautikTable } from '../tables/BhautikTable';
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
    id: number;
    scheme_name: string;

    castdata: string;
    totalmembersname: string;

    familymembercount: {
        female: string;
        male: string;
        total: string;
    };
    agedata: {
        female: string;
        male: string;
        total: string;
    };

    castcertificate: {
        asleli: string;
        nasleli: string;
    };

    aadharcard: {
        asleli: string;
        nasleli: string;
    };

    voteridcard: {
        asleli: string;
        nasleli: string;
    };


    rationcard: string;
    rationcardtype: string;
    rationcard_no: string;
    jobcard: string;
    pmfarmercard: string;
    farmercreditcard: string;
    aayushmancard: string;
    headofmember: string;

    pmKisanCard: {
        asleli: string;
        nasleli: string;
    };

    ayushmanCard: {
        asleli: string;
        nasleli: string;
    };

    housetype: string;

    benefiteofpmhouse: string;
    waterdrink: string;
    hargharnal: string;
    electricity: string;
    contact_no: string;
    hospitalphc: string;
    sanjaygandhi: string;
    studybenefite: string;
    farmeavilebleornot: string;
    studyvanpatta: string;
    sikklacelloffamily: string;
    whichschoolchlid: string;
    anyhaveaashramschool: string;
    lpggas: string;
    bankaccount: string;
    studtatcoop: string;
    pmvimayojna: string;
    praklpkaryalaly: string;
    itarvibhagudan: string;
    niymitaarogya: string;
    taluka_id: string;
    village_id: string;
    gp_id: string;
}


interface BhautikDataall {
    id: number,
    scheme_name: string,
    castdata: string,
    totalmembersname: string,
    familymembercount: string,
    castcertificate: string,
    aadharcard: string,
    voteridcard: string,
    rationcardtype: string,
    rationcard_no: string,
    rationcard: string,
    jobcard: string,
    pmfarmercard: string,
    farmercreditcard: string,
    aayushmancard: string,
    headofmember: string,
    pmKisanCard: string,
    ayushmanCard: string,
    housetype: string,
    benefiteofpmhouse: string,
    waterdrink: string,
    hargharnal: string,
    electricity: string,
    hospitalphc: string,
    sanjaygandhi: string,
    contact_no: string,
    studybenefite: string,
    farmeavilebleornot: string,
    studyvanpatta: string,
    sikklacelloffamily: string,
    whichschoolchlid: string,
    anyhaveaashramschool: string,
    lpggas: string,
    bankaccount: string,
    studtatcoop: string,
    pmvimayojna: string,
    praklpkaryalaly: string,
    itarvibhagudan: string,
    niymitaarogya: string,
    status: string,
    taluka_id: string;
    village_id: string;
    gp_id: string;
    agedata: string;
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
}

// Add this helper at the top (after imports):
function hasAsleli(obj: unknown): obj is { asleli: string } {
    return !!obj && typeof obj === 'object' && 'asleli' in obj;
}

const Vyaktigatdatafilter: React.FC<Props> = ({
    initialdata,
    schemescrud,
    talukadata,
    villagedata,
    getgrampanchayatdata

}) => {
    const { isEditMode, setIsmodelopen, setisvalidation } = useToggleContext();
    // const {  isEditMode, setIsmodelopen, setisvalidation } = useToggleContext();
    const [data, setData] = useState<BhautikDataall[]>(initialdata || []);
    const [schemedata] = useState<Schemesdatas[]>(schemescrud || []);

    const [loading, setLoading] = useState(false);

    const [familyErrors, setFamilyErrors] = useState<{ [key: string]: string }>({});
    console.log("editId", familyErrors)


    // Add filter state variables
    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedGrampanchayat, setSelectedGrampanchayat] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');

    

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
        { key: 'totalmembersname', label: 'कुटुंब प्रमुखाचे नाव', category: 'Basic Info' },
        { key: 'contact_no', label: 'कुटुंब संपर्क क्रमांक', category: 'Basic Info' },
        { key: 'castdata', label: 'जात', category: 'Basic Info' },
        { key: 'familymembercount', label: 'कुटुंबातील सदस्य संख्या', category: 'Family' },
        { key: 'castcertificate', label: 'जातीचे दाखले', category: 'Documents' },
        { key: 'aadharcard', label: 'आधारकार्ड', category: 'Documents' },
        { key: 'voteridcard', label: 'मतदार ओळखपत्र', category: 'Documents' },
        { key: 'rationcard_no', label: 'राशन कार्ड क्रमांक', category: 'Documents' },
        { key: 'rationcard', label: 'राशन कार्ड', category: 'Documents' },
        { key: 'rationcardtype', label: 'रेशन कार्डचा प्रकार', category: 'Documents' },
        { key: 'jobcard', label: 'जॉब कार्ड', category: 'Documents' },
        { key: 'pmfarmercard', label: 'PM किसान कार्ड', category: 'Documents' },
        { key: 'farmercreditcard', label: 'किसान क्रेडिट कार्ड', category: 'Documents' },
        { key: 'aayushmancard', label: 'आयुष्मान कार्ड', category: 'Documents' },
        { key: 'headofmember', label: 'कुटुंब प्रमुखाकडे अधिवास प्रमाणपत्र', category: 'Documents' },
        { key: 'housetype', label: 'राहते घराचा प्रकार', category: 'Housing' },
        { key: 'benefiteofpmhouse', label: 'PM आवास योजनेचा लाभ', category: 'Housing' },
        { key: 'waterdrink', label: 'पिण्याच्या पाण्याची सुविधा', category: 'Facilities' },
        { key: 'hargharnal', label: 'हर घर नळ योजना', category: 'Facilities' },
        { key: 'electricity', label: 'विद्युतीकरण', category: 'Facilities' },
        { key: 'hospitalphc', label: 'आरोग्य उपकेंद्र / PHC', category: 'Health' },
        { key: 'sanjaygandhi', label: 'संजय गांधी निराधार योजनेचे लाभार्थी', category: 'Benefits' },
        { key: 'studybenefite', label: 'असल्यास, लाभ', category: 'Benefits' },
        { key: 'farmeavilebleornot', label: 'शेती आहे काय?', category: 'Agriculture' },
        { key: 'studyvanpatta', label: 'असल्यास, वन पट्टा धारक', category: 'Forest' },
        { key: 'sikklacelloffamily', label: 'सिकलसेल सदस्य', category: 'Health' },
        { key: 'whichschoolchlid', label: 'मुले कोणत्या शाळेत शिकत आहे', category: 'Education' },
        { key: 'anyhaveaashramschool', label: 'सिकलसेल बाधित संख्या', category: 'Health' },
        { key: 'lpggas', label: 'LPG सिलिंडर', category: 'Facilities' },
        { key: 'bankaccount', label: 'बँक खाते', category: 'Financial' },
        { key: 'studtatcoop', label: 'बँक प्रकार', category: 'Financial' },
        { key: 'pmvimayojna', label: 'PM विमा योजना', category: 'Benefits' },
        { key: 'praklpkaryalaly', label: 'ट्राइबल कार्यालयाकडून योजना', category: 'Benefits' },
        { key: 'itarvibhagudan', label: 'इतर विभागाकडून योजना', category: 'Benefits' },
        { key: 'niymitaarogya', label: 'नियमित आरोग्य तपासणी', category: 'Health' },
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
        id: 0,
        scheme_name: "",

        castdata: '',
        totalmembersname: '',
        familymembercount: { female: '', male: '', total: '' },
        agedata: { female: '', male: '', total: '' },
        castcertificate: { asleli: '', nasleli: '' },
        aadharcard: { asleli: '', nasleli: '' },
        voteridcard: { asleli: '', nasleli: '' },
        rationcard_no: '',
        rationcard: '',
        rationcardtype: '',
        jobcard: '',
        pmfarmercard: '',
        farmercreditcard: '',
        aayushmancard: '',
        headofmember: '',
        pmKisanCard: { asleli: '', nasleli: '' },
        ayushmanCard: { asleli: '', nasleli: '' },
        housetype: '',
        benefiteofpmhouse: '',
        waterdrink: '',
        hargharnal: '',
        electricity: '',
        hospitalphc: '',
        sanjaygandhi: '',
        studybenefite: '',
        farmeavilebleornot: '',
        studyvanpatta: '',
        sikklacelloffamily: '',
        whichschoolchlid: '',
        anyhaveaashramschool: '',
        lpggas: '',
        bankaccount: '',
        studtatcoop: '',
        contact_no: '',
        pmvimayojna: '',
        praklpkaryalaly: '',
        itarvibhagudan: '',
        niymitaarogya: '',
        taluka_id: '',
        village_id: '',
        gp_id: ''
    });

    // Handle nested state changes
const handleNestedChange = (
    parentField: keyof BhautikData,
    childField: string,
    value: string
) => {
    // Validate input is a number or empty
    if (value && !/^\d*$/.test(value)) {
        return; // Only allow numbers
    }

    const familyTotal = Number(formData.familymembercount.total) || 0;
    const asleliFields = ['castcertificate', 'aadharcard', 'voteridcard', 'pmKisanCard', 'ayushmanCard'];

    // Validation for asleli fields
    if (asleliFields.includes(parentField) && childField === 'asleli') {
        if (Number(value) > familyTotal) {
            setFamilyErrors(prev => ({ 
                ...prev, 
                [`${parentField}_asleli`]: `असलेली संख्या (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.` 
            }));
            toast.error(`असलेली संख्या (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.`);
            return;
        } else {
            setFamilyErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${parentField}_asleli`];
                return newErrors;
            });
        }
    }

    // Validation for family member counts
    if (parentField === 'familymembercount' && (childField === 'female' || childField === 'male')) {
        const newTotal = (childField === 'female' ? Number(value) : Number(formData.familymembercount.female || 0)) + 
                         (childField === 'male' ? Number(value) : Number(formData.familymembercount.male || 0));

        // Validate against asleli fields
        for (const field of asleliFields) {
            const valueObj = formData[field as keyof BhautikData];
            if (hasAsleli(valueObj)) {
                const asleliValue = Number(valueObj.asleli) || 0;
                if (newTotal < asleliValue) {
                    setFamilyErrors(prev => ({ 
                        ...prev, 
                        familymembercount: `कुटुंबातील सदस्य संख्या (${newTotal}) असलेली संख्या (${asleliValue}) पेक्षा कमी असू शकत नाही.` 
                    }));
                    toast.error(`कुटुंबातील सदस्य संख्या (${newTotal}) असलेली संख्या (${asleliValue}) पेक्षा कमी असू शकत नाही.`);
                    return;
                }
            }
        }
        setFamilyErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.familymembercount;
            return newErrors;
        });
    }

    // Validation for agedata fields
    if (parentField === 'agedata') {
        if (childField === 'female') {
            const femaleCount = Number(value);
            const totalFemales = Number(formData.familymembercount.female || 0);
            if (femaleCount > totalFemales) {
                setFamilyErrors(prev => ({
                    ...prev,
                    agedata_female: `18 वर्षावरील स्री (${value}) कुटुंबातील स्री (${totalFemales}) पेक्षा जास्त असू शकत नाही.`
                }));
                toast.error(`18 वर्षावरील स्री (${value}) कुटुंबातील स्री (${totalFemales}) पेक्षा जास्त असू शकत नाही.`);
                return;
            }
        }

        if (childField === 'male') {
            const maleCount = Number(value);
            const totalMales = Number(formData.familymembercount.male || 0);
            if (maleCount > totalMales) {
                setFamilyErrors(prev => ({
                    ...prev,
                    agedata_male: `18 वर्षावरील पुरुष (${value}) कुटुंबातील पुरुष (${totalMales}) पेक्षा जास्त असू शकत नाही.`
                }));
                toast.error(`18 वर्षावरील पुरुष (${value}) कुटुंबातील पुरुष (${totalMales}) पेक्षा जास्त असू शकत नाही.`);
                return;
            }
        }

        if (childField === 'total') {
            const totalAdults = Number(value);
            if (totalAdults > familyTotal) {
                setFamilyErrors(prev => ({
                    ...prev,
                    agedata_total: `18 वर्षावरील एकूण (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.`
                }));
                toast.error(`18 वर्षावरील एकूण (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            }
        }

        // Clear any agedata errors if validation passes
        setFamilyErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.agedata_female;
            delete newErrors.agedata_male;
            delete newErrors.agedata_total;
            return newErrors;
        });
    }

    // Update the form state
    setFormData(prev => {
        const newFormData = { ...prev };
        
        // Handle familymembercount updates
        if (parentField === 'familymembercount') {
            const updated = { 
                ...newFormData.familymembercount,
                [childField]: value 
            };
            
            if (childField === 'female' || childField === 'male') {
                updated.total = String(
                    Number(childField === 'female' ? value : newFormData.familymembercount.female || 0) + 
                    Number(childField === 'male' ? value : newFormData.familymembercount.male || 0)
                );
            }
            
            newFormData.familymembercount = updated;
        } 
        // Handle agedata updates
        else if (parentField === 'agedata') {
            const updated = { 
                ...newFormData.agedata,
                [childField]: value 
            };
            
            if (childField === 'female' || childField === 'male') {
                updated.total = String(
                    Number(childField === 'female' ? value : newFormData.agedata.female || 0) + 
                    Number(childField === 'male' ? value : newFormData.agedata.male || 0)
                );
            }
            
            newFormData.agedata = updated;
        }
        // Handle asleli/nasleli fields
        else if (asleliFields.includes(parentField)) {
            const parent = newFormData[parentField] as { asleli: string; nasleli: string };
            const updated = { ...parent, [childField]: value };
            
            if (childField === 'asleli') {
                updated.nasleli = String(Math.max(0, familyTotal - Number(value)));
            }
            
            newFormData[parentField as 'castcertificate' | 'aadharcard' | 'voteridcard' | 'pmKisanCard' | 'ayushmanCard'] = updated;
        }
        
        return newFormData;
    });
};

    // Handle simple field changes
    const handleChange = (field: keyof BhautikData, value: string) => {
        const familyTotal = Number(formData.familymembercount.total) || 0;

        if (field === 'sikklacelloffamily') {
            if (Number(value) > familyTotal) {
                setFamilyErrors(prev => ({
                    ...prev,
                    sikklacelloffamily: `कुटुंबात सिकलसेल बाधित सदस्य संख्या (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.`
                }));
                toast.error(`कुटुंबात सिकलसेल बाधित सदस्य संख्या (${value}) कुटुंबातील सदस्य संख्या (${familyTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setFamilyErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.sikklacelloffamily;
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
            const response = await fetch('/api/vyaktikapi');
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
    // useEffect(() => {
    //     const total = Number(formData.ekunSankhya.female) + Number(formData.ekunSankhya.male);
    //     const tribal = Number(formData.tribalPopulation.female) + Number(formData.tribalPopulation.male);
    //     let percent = '';
    //     if (total > 0) {
    //         percent = ((tribal / total) * 100).toFixed(2);
    //     }
    //     setFormData(prev => ({
    //         ...prev,
    //         tribalPopulationTkWari: percent
    //     }));
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [formData.ekunSankhya.female, formData.ekunSankhya.male, formData.tribalPopulation.female, formData.tribalPopulation.male]);

    // const transformFormData = (data: BhautikData) => {
    //     const transformTriple = (obj: Triple) => {
    //         if (obj && typeof obj === 'object') {
    //             return [obj.female ?? '', obj.male ?? '', obj.total ?? ''].join('|');
    //         }
    //         return '';
    //     };

    //     const transformDouble = (obj: Double) => {
    //         if (obj && typeof obj === 'object') {
    //             return [obj.asleli ?? '', obj.nasleli ?? ''].join('|');
    //         }
    //         return '';
    //     };

    //     return {
    //         ...data,
    //         ekunSankhya: transformTriple(data.ekunSankhya),
    //         tribalPopulation: transformTriple(data.tribalPopulation),
    //         aadharcard: transformDouble(data.aadharcard),
    //         matdarOlahkhap: transformDouble(data.matdarOlahkhap),
    //         jaticheGmanap: transformDouble(data.jaticheGmanap),
    //         rashionCard: transformDouble(data.rashionCard),
    //         jobCard: transformDouble(data.jobCard),
    //         pmKisanCard: transformDouble(data.pmKisanCard),
    //         ayushmanCard: transformDouble(data.ayushmanCard),
    //         aadivasiHouse: `${data.aadivasiHouse.pakkeGhar}|${data.aadivasiHouse.kudaMatiGhar}`,
    //         panyaPanyachiSuvidha: transformDouble(data.panyaPanyachiSuvidha),
    //         harGharNalYojana: transformDouble(data.harGharNalYojana),
    //         vidyutikaran: transformDouble(data.vidyutikaran)
    //     };
    // };


    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);

        const apiUrl = '/api/vyaktikapi';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const transformedData: Record<string, string | number> = {
                ...(isEditMode && { id: formData.id }), // ✅ Include ID for PUT
                scheme_name: formData.scheme_name,
                castdata: formData.castdata,
                totalmembersname: formData.totalmembersname,
                familymembercount: `${formData.familymembercount.female}|${formData.familymembercount.male}|${formData.familymembercount.total}`,
                agedata: `${formData.agedata.female}|${formData.agedata.male}|${formData.agedata.total}`,
                castcertificate: `${formData.castcertificate.asleli}|${formData.castcertificate.nasleli}`,
                aadharcard: `${formData.aadharcard.asleli}|${formData.aadharcard.nasleli}`,
                voteridcard: `${formData.voteridcard.asleli}|${formData.voteridcard.nasleli}`,
                rationcard: formData.rationcard,
                jobcard: formData.jobcard,
                pmfarmercard: formData.pmfarmercard,
                farmercreditcard: formData.farmercreditcard,
                aayushmancard: formData.aayushmancard,
                headofmember: formData.headofmember,
                pmKisanCard: `${formData.pmKisanCard.asleli}|${formData.pmKisanCard.nasleli}`,
                ayushmanCard: `${formData.ayushmanCard.asleli}|${formData.ayushmanCard.nasleli}`,
                housetype: formData.housetype,
                benefiteofpmhouse: formData.benefiteofpmhouse,
                waterdrink: formData.waterdrink,
                hargharnal: formData.hargharnal,
                electricity: formData.electricity,
                hospitalphc: formData.hospitalphc,
                sanjaygandhi: formData.sanjaygandhi,
                studybenefite: formData.studybenefite,
                farmeavilebleornot: formData.farmeavilebleornot,
                studyvanpatta: formData.studyvanpatta,
                sikklacelloffamily: formData.sikklacelloffamily,
                whichschoolchlid: formData.whichschoolchlid,
                anyhaveaashramschool: formData.anyhaveaashramschool,
                lpggas: formData.lpggas,
                bankaccount: formData.bankaccount,
                studtatcoop: formData.studtatcoop,
                pmvimayojna: formData.pmvimayojna,
                praklpkaryalaly: formData.praklpkaryalaly,
                itarvibhagudan: formData.itarvibhagudan,
                niymitaarogya: formData.niymitaarogya,
                rationcard_no: formData.rationcard_no,
                rationcardtype: formData.rationcardtype,
                contact_no: formData.contact_no,
                taluka_id: formData.taluka_id,
                village_id: formData.village_id,
                gp_id: formData.gp_id,
                status: 'Active' // ✅ Optional, add if backend requires it
            };

            console.log("Sending data:", transformedData);

            const response = await fetch(apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transformedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("Response data:", responseData);

            toast.success(isEditMode ? 'Data updated successfully!' : 'Data saved successfully!');
            fetchData();

        } catch (error) {
            console.error('Error saving data:', error);
            toast.error(isEditMode ? 'Failed to update data' : 'Failed to save data');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };


    // Reset form to initial state
    // const resetForm = () => {
    //     setFormData({
    //         scheme_name: "",
    //         ekunSankhya: { female: '', male: '', total: '' },
    //         tribalPopulation: { female: '', male: '', total: '' },
    //         tribalPopulationTkWari: '',
    //         totalFamilyNumbers: '',
    //         tribalsWholeFamilyNumbers: '',
    //         vaitikAadivasi: '',
    //         samuhikVanpatta: '',
    //         cfrmAarakhda: '',
    //         aadharcard: { asleli: '', nasleli: '' },
    //         matdarOlahkhap: { asleli: '', nasleli: '' },
    //         jaticheGmanap: { asleli: '', nasleli: '' },
    //         rashionCard: { asleli: '', nasleli: '' },
    //         jobCard: { asleli: '', nasleli: '' },
    //         pmKisanCard: { asleli: '', nasleli: '' },
    //         ayushmanCard: { asleli: '', nasleli: '' },
    //         aadivasiHouse: { pakkeGhar: '', kudaMatiGhar: '' },
    //         pmAwasYojana: '',
    //         panyaPanyachiSuvidha: { asleli: '', nasleli: '' },
    //         harGharNalYojana: { asleli: '', nasleli: '' },
    //         vidyutikaran: { asleli: '', nasleli: '' },
    //         arogyUpcharKendra: '',
    //         generalHealthCheckup: '',
    //         sickleCellAnemiaScreening: '',
    //         primarySchool: '',
    //         middleSchool: '',
    //         kindergarten: '',
    //         mobileNetwork: '',
    //         gramPanchayatBuilding: '',
    //         mobileMedicalUnit: '',
    //         gotulSocietyBuilding: '',
    //         nadiTalav: '',
    //         contact_no: '',
    //         rationcard_no: '',
    //         allroadvillages: '',
    //         village_distance: '',
    //     });
    //     setEditId(null);
    // };

 

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
            case 'familymembercount':
                const [female, male, total] = item.familymembercount ? item.familymembercount.split('|') : ['', '', ''];
                return `स्री: ${female || 'N/A'}, पुरुष: ${male || 'N/A'}, एकूण: ${total || 'N/A'}`;
            case 'castcertificate':
                const [casleli, cnasleli] = item.castcertificate ? item.castcertificate.split('|') : ['', ''];
                return `असलेली संख्या: ${casleli || 'N/A'}, नसलेली संख्या: ${cnasleli || 'N/A'}`;
            case 'aadharcard':
                const [aasleli, anasleli] = item.aadharcard ? item.aadharcard.split('|') : ['', ''];
                return `असलेली: ${aasleli || 'N/A'}, नसलेली: ${anasleli || 'N/A'}`;
            case 'voteridcard':
                const [vasleli, vnasleli] = item.voteridcard ? item.voteridcard.split('|') : ['', ''];
                return `असलेली: ${vasleli || 'N/A'}, नसलेली: ${vnasleli || 'N/A'}`;
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
            XLSX.utils.book_append_sheet(wb, ws, 'Vyaktigat Data');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `vyaktigat_data_${timestamp}.xlsx`;

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
        // Location columns
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

        {
            key: 'totalmembersname',
            label: 'कुटुंब प्रमुखाचे नाव',
            render: (data) => <span>{data.totalmembersname}</span>,
        },
        {
            key: 'contact_no',
            label: 'कुटुंब संपर्क क्रमांक',
            render: (data) => <span>{data.contact_no}</span>,
        },
        {
            key: 'castdata',
            label: 'जात',
            render: (data) => <span>{data.castdata}</span>,
        },
        {
            key: 'familymembercount',
            label: 'कुटुंबातील सदस्य संख्या',
            render: (item) => {
                const [female, male, total] = item.familymembercount ? item.familymembercount.split('|') : ['', '', ''];
                return `स्री: ${female || 'N/A'}, पुरुष: ${male || 'N/A'}, एकूण: ${total || 'N/A'}`;
            }
        },
        {
            key: 'castcertificate',
            label: 'जातीचे दाखले',
            render: (item) => {
                const [female, male] = item.castcertificate ? item.castcertificate.split('|') : ['', ''];
                return `असलेली संख्या: ${female || 'N/A'}, नसलेली संख्या: ${male || 'N/A'}`;
            }
        },
        {
            key: 'aadharcard',
            label: 'आधारकार्ड',
            render: (item) => {
                const [asleli, nasleli] = item.aadharcard ? item.aadharcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: 'voteridcard',
            label: 'मतदार ओळखपत्र',
            render: (item) => {
                const [asleli, nasleli] = item.voteridcard ? item.voteridcard.split('|') : ['', ''];
                return `असलेली: ${asleli || 'N/A'}, नसलेली: ${nasleli || 'N/A'}`;
            }
        },
        {
            key: 'rationcard_no',
            label: 'राशन कार्ड क्रमांक',
            render: (data) => <span>{data.rationcard_no}</span>,
        },
        {
            key: 'rationcard',
            label: 'राशन कार्ड',
            render: (data) => <span>{data.rationcard}</span>,
        },
        {
            key: 'rationcardtype',
            label: 'रेशन कार्डचा प्रकार',
            render: (data) => <span>{data.rationcardtype}</span>,
        },
        {
            key: 'jobcard',
            label: 'जॉब कार्ड',
            render: (data) => <span>{data.jobcard}</span>,
        },
        {
            key: 'pmfarmercard',
            label: 'PM किसान कार्ड',
            render: (data) => <span>{data.pmfarmercard}</span>,
        },
        {
            key: 'farmercreditcard',
            label: 'किसान क्रेडिट कार्ड',
            render: (data) => <span>{data.farmercreditcard}</span>,
        },

        {
            key: 'aayushmancard',
            label: 'आयुष्मान कार्ड',
            render: (data) => <span>{data.aayushmancard}</span>,
        },
        {
            key: 'headofmember',
            label: 'कुटुंब प्रमुखाकडे अधिवास प्रमाणपत्र',
            render: (data) => <span>{data.headofmember}</span>,
        },
        {
            key: 'housetype',
            label: 'राहते घराचा प्रकार',
            render: (data) => <span>{data.housetype}</span>,
        },
        {
            key: 'benefiteofpmhouse',
            label: 'PM आवास योजनेचा लाभ',
            render: (data) => <span>{data.benefiteofpmhouse}</span>,
        },
        {
            key: 'waterdrink',
            label: 'पिण्याच्या पाण्याची सुविधा',
            render: (data) => <span>{data.waterdrink}</span>,
        },
        {
            key: 'hargharnal',
            label: 'हर घर नळ योजना',
            render: (data) => <span>{data.hargharnal}</span>,
        },
        {
            key: 'electricity',
            label: 'विद्युतीकरण',
            render: (data) => <span>{data.electricity}</span>,
        },
        {
            key: 'hospitalphc',
            label: 'आरोग्य उपकेंद्र / PHC',
            render: (data) => <span>{data.hospitalphc}</span>,
        },
        {
            key: 'sanjaygandhi',
            label: 'संजय गांधी निराधार योजनेचे लाभार्थी आहे/नाही',
            render: (data) => <span>{data.sanjaygandhi}</span>,
        },
        {
            key: 'studybenefite',
            label: 'असल्यास, लाभ',
            render: (data) => <span>{data.studybenefite}</span>,
        },
        {
            key: 'farmeavilebleornot',
            label: 'शेती आहे काय?',
            render: (data) => <span>{data.farmeavilebleornot}</span>,
        },
        {
            key: 'studyvanpatta',
            label: 'असल्यास, वन पट्टा धारक',
            render: (data) => <span>{data.studyvanpatta}</span>,
        },
        {
            key: 'sikklacelloffamily',
            label: 'सिकलसेल सदस्य',
            render: (data) => <span>{data.sikklacelloffamily}</span>,
        },
        {
            key: 'whichschoolchlid',
            label: 'मुले कोणत्या शाळेत शिकत आहे',
            render: (data) => <span>{data.whichschoolchlid}</span>,
        },
        {
            key: 'anyhaveaashramschool',
            label: 'सिकलसेल बाधित संख्या',
            render: (data) => <span>{data.anyhaveaashramschool}</span>,
        },
        {
            key: 'lpggas',
            label: 'LPG सिलिंडर',
            render: (data) => <span>{data.lpggas}</span>,
        },
        {
            key: 'bankaccount',
            label: 'बँक खाते',
            render: (data) => <span>{data.bankaccount}</span>,
        },
        {
            key: 'studtatcoop',
            label: 'बँक प्रकार',
            render: (data) => <span>{data.studtatcoop}</span>,
        },
        {
            key: 'pmvimayojna',
            label: 'PM विमा योजना',
            render: (data) => <span>{data.pmvimayojna}</span>,
        },
        {
            key: 'praklpkaryalaly',
            label: 'ट्राइबल कार्यालयाकडून योजना',
            render: (data) => <span>{data.praklpkaryalaly}</span>,
        },
        {
            key: 'itarvibhagudan',
            label: 'इतर विभागाकडून योजना',
            render: (data) => <span>{data.itarvibhagudan}</span>,
        },
        {
            key: 'niymitaarogya',
            label: 'नियमित आरोग्य तपासणी',
            render: (data) => <span>{data.niymitaarogya}</span>,
        },

        // {
        //     key: "actions",
        //     label: "Actions",
        //     render: (data) => (
        //         <div className="flex gap-2 whitespace-nowrap w-full">
        //             <span
        //                 onClick={() => handleEdit(data)}
        //                 className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
        //             >
        //                 <FaEdit className="inline-block align-middle text-lg" />
        //             </span>
        //             <span>
        //                 <DefaultModal
        //                     id={data.id}
        //                     fetchData={fetchData}
        //                     endpoint={"vyaktikapi"}
        //                     bodyname={"id"}
        //                     newstatus={data.status}
        //                 />
        //             </span>
        //         </div>
        //     ),
        // },
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
                title='वैयक्तिक'
                classname={"h-[650px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="max-w-7xl mx-auto p-1">
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
                                    गाव
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
                        {/* Scheme Selection - Full Width */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">योजना निवडा</label>
                            <select
                                name="scheme_name"
                                className="text-gray-900 h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={formData.scheme_name}
                                onChange={e => handleChange('scheme_name', e.target.value)}
                            >
                                <option value="" disabled selected style={{ color: '#a0aec0' }}>योजना निवडा</option>


                                {schemedata.map((category) => (
                                    <option key={category.scheme_id} value={category.scheme_id}>
                                        {category.scheme_name}
                                    </option>
                                ))}
                            </select>
                        </div>



                        {/* First Row - 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                            {/* Tribal Population Section */}

                            {/* Family Head Name */}

                            <div className="bg-gray-100 rounded-lg shadow p-4 md:mb-6 mb-0">
                                <label className="block text-sm font-medium text-gray-700 mb-6">कुटुंब प्रमुखाचे नाव</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.totalmembersname}
                                    onChange={e => handleChange('totalmembersname', e.target.value)}
                                />
                            </div> <div className="bg-gray-100 rounded-lg shadow p-4 md:mb-6 mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-6">कुटुंब संपर्क क्रमांक</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.contact_no}
                                    onChange={e => handleChange('contact_no', e.target.value)}
                                />
                            </div>     <div className="bg-gray-100 rounded-lg shadow p-4 md:mb-6 mb-0">
                                <label className="block text-sm font-medium text-gray-700 mb-2">जात</label>
                                <select
                                    name="castdata"
                                    id=""
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30  text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-white dark:text-white/90 dark:focus:border-brand-800 bg-white"
                                        }`}
                                    value={formData.castdata}
                                    onChange={(e) => handleChange('castdata', e.target.value)}
                                >
                                    <option value="" disabled>जात निवडा</option>
                                    <option value="गोंड">गोंड</option>
                                    <option value="माडिया">माडिया</option>
                                    <option value="हलबी">हलबी</option>
                                    <option value="परधान">परधान</option>
                                    <option value="कंवर">कंवर</option>
                                    <option value="कोलाम">कोलाम</option>
                                    <option value="बिंझावर">बिंझावर</option>
                                    <option value="माना">माना</option>
                                    <option value="इतर">इतर</option>
                                </select>
                            </div>



                            {/* Family Members Count */}



                        </div>
                        {/* Caste Certificate */}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">

                            <div className="bg-gray-100 rounded-lg shadow p-4 mb-6">
                                <h3 className="text-sm font-semibold mb-2">कुटुंबातील सदस्य संख्या</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">स्री</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.familymembercount.female}
                                            onChange={e => handleNestedChange('familymembercount', 'female', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">पुरुष</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.familymembercount.male}
                                            onChange={e => handleNestedChange('familymembercount', 'male', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">एकूण</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.familymembercount.total}
                                            onChange={e => handleNestedChange('familymembercount', 'total', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg shadow p-4 mb-6">
                                <h3 className="text-sm font-semibold mb-2">18 वर्षावरील</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">स्री</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.agedata.female}
                                            onChange={e => handleNestedChange('agedata', 'female', e.target.value)}
                                        />
                                        {/* {familyErrors.agedata_female && <div className="text-red-600 text-xs mt-1">{familyErrors.agedata_female}</div>} */}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">पुरुष</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.agedata.male}
                                            onChange={e => handleNestedChange('agedata', 'male', e.target.value)}
                                        />
                                        {/* {familyErrors.agedata_male && <div className="text-red-600 text-xs mt-1">{familyErrors.agedata_male}</div>} */}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">एकूण</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.agedata.total}
                                            onChange={e => handleNestedChange('agedata', 'total', e.target.value)}
                                        />
                                        {/* {familyErrors.agedata_total && <div className="text-red-600 text-xs mt-1">{familyErrors.agedata_total}</div>} */}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg shadow p-4 mb-6 ">
                                <h3 className="text-sm font-semibold mb-2">जातीचे दाखले</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">असलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.castcertificate.asleli}
                                            onChange={e => handleNestedChange('castcertificate', 'asleli', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mb-1">नसलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.castcertificate.nasleli}
                                            onChange={e => handleNestedChange('castcertificate', 'nasleli', e.target.value)}
                                        />
                                    </div>

                                </div>
                            </div>


                            {/* Second Row - Aadhar Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 mb-6">
                                <h3 className="text-sm font-semibold mb-2">आधारकार्ड</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">असलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.aadharcard.asleli}
                                            onChange={e => handleNestedChange('aadharcard', 'asleli', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.aadharcard.nasleli}
                                            onChange={e => handleNestedChange('aadharcard', 'nasleli', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Third Row - 2 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Voter ID Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <h3 className="text-sm font-semibold mb-2">मतदार ओळखपत्र (18 वर्षावरील )</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">असलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.voteridcard.asleli}
                                            onChange={e => handleNestedChange('voteridcard', 'asleli', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">नसलेली संख्या</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.voteridcard.nasleli}
                                            onChange={e => handleNestedChange('voteridcard', 'nasleli', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Ration Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-6">राशन कार्ड क्रमांक</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.rationcard_no}
                                    onChange={e => handleChange('rationcard_no', e.target.value)}
                                />

                            </div>
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-6">राशन कार्ड</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.rationcardtype}
                                    onChange={e => handleChange('rationcardtype', e.target.value)}
                                />

                            </div>
                            {/* <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <h3 className="text-sm font-semibold mb-2">राशन कार्ड </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex space-x-3 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="rationcard"
                                                value="yes"
                                                checked={formData.rationcard === 'yes'}
                                                onChange={e => handleChange('rationcard', e.target.value)}
                                            />
                                            <span className="ml-1 text-xs text-gray-700">होय</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="rationcard"
                                                value="no"
                                                checked={formData.rationcard === 'no'}
                                                onChange={e => handleChange('rationcard', e.target.value)}
                                            />
                                            <span className="ml-1 text-xs text-gray-700">नाही</span>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">रेशन कार्डचा प्रकार</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.rationcardtype}
                                            onChange={e => handleChange('rationcardtype', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div> */}

                        </div>

                        {/* Fourth Row - 3 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Job Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">जॉब कार्ड</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="jobcard"
                                            value="yes"
                                            checked={formData.jobcard === 'yes'}
                                            onChange={e => handleChange('jobcard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="jobcard"
                                            value="no"
                                            checked={formData.jobcard === 'no'}
                                            onChange={e => handleChange('jobcard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* PM Farmer Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">PM किसान कार्ड</label>


                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="pmfarmercard"
                                            value="yes"
                                            checked={formData.pmfarmercard === 'yes'}
                                            onChange={e => handleChange('pmfarmercard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="pmfarmercard"
                                            value="no"
                                            checked={formData.pmfarmercard === 'no'}
                                            onChange={e => handleChange('pmfarmercard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* Farmer Credit Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">किसान क्रेडिट कार्ड</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="farmercreditcard"
                                            value="yes"
                                            checked={formData.farmercreditcard === 'yes'}
                                            onChange={e => handleChange('farmercreditcard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="farmercreditcard"
                                            value="no"
                                            checked={formData.farmercreditcard === 'no'}
                                            onChange={e => handleChange('farmercreditcard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Fifth Row - 3 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Ayushman Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">आयुष्मान कार्ड</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="aayushmancard"
                                            value="yes"
                                            checked={formData.aayushmancard === 'yes'}
                                            onChange={e => handleChange('aayushmancard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="aayushmancard"
                                            value="no"
                                            checked={formData.aayushmancard === 'no'}
                                            onChange={e => handleChange('aayushmancard', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* Head of Member */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">कुटुंब प्रमुखाकडे अधिवास प्रमाणपत्र</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="headofmember"
                                            value="yes"
                                            checked={formData.headofmember === 'yes'}
                                            onChange={e => handleChange('headofmember', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="headofmember"
                                            value="no"
                                            checked={formData.headofmember === 'no'}
                                            onChange={e => handleChange('headofmember', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* House Type */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">राहते घराचा प्रकार</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="housetype"
                                            value="पक्केघर"
                                            checked={formData.housetype === 'पक्केघर'}
                                            onChange={e => handleChange('housetype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">पक्के घर</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="housetype"
                                            value="कुडाचेघर"
                                            checked={formData.housetype === 'कुडाचेघर'}
                                            onChange={e => handleChange('housetype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">कुडाचे घर</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="housetype"
                                            value="मातीचेघर"
                                            checked={formData.housetype === 'मातीचेघर'}
                                            onChange={e => handleChange('housetype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">मातीचे घर</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="housetype"
                                            value="इतर"
                                            checked={formData.housetype === 'इतर'}
                                            onChange={e => handleChange('housetype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">इतर</span>
                                    </label>
                                </div>
                            </div>
                        </div>


                        {/* Seventh Row - 3 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Drinking Water */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">PM आवास योजनेचा लाभ घेतला आहे/ नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="benefiteofpmhouse"
                                            value="yes"
                                            checked={formData.benefiteofpmhouse === 'yes'}
                                            onChange={e => handleChange('benefiteofpmhouse', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="benefiteofpmhouse"
                                            value="no"
                                            checked={formData.benefiteofpmhouse === 'no'}
                                            onChange={e => handleChange('benefiteofpmhouse', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* Drinking Water */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">पिण्याच्या पाण्याची सुविधा आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="waterdrink"
                                            value="नळ"
                                            checked={formData.waterdrink === 'नळ'}
                                            onChange={e => handleChange('waterdrink', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नळ</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="waterdrink"
                                            value="विहीर"
                                            checked={formData.waterdrink === 'विहीर'}
                                            onChange={e => handleChange('waterdrink', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">विहीर</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="waterdrink"
                                            value="बोअरवेल"
                                            checked={formData.waterdrink === 'बोअरवेल'}
                                            onChange={e => handleChange('waterdrink', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">बोअरवेल</span>
                                    </label>
                                </div>
                            </div>
                            {/* Har Ghar Nal */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">हर घर नळ योजना लाभ आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="hargharnal"
                                            value="yes"
                                            checked={formData.hargharnal === 'yes'}
                                            onChange={e => handleChange('hargharnal', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="hargharnal"
                                            value="no"
                                            checked={formData.hargharnal === 'no'}
                                            onChange={e => handleChange('hargharnal', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* Electricity */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">विद्युतीकरण आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="electricity"
                                            value="yes"
                                            checked={formData.electricity === 'yes'}
                                            onChange={e => handleChange('electricity', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="electricity"
                                            value="no"
                                            checked={formData.electricity === 'no'}
                                            onChange={e => handleChange('electricity', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Eighth Row - 3 Columns */}

                        <div className="flex flex-col md:flex-row gap-4 mb-6">


                            {/* <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">आरोग्य उपकेंद्र / PHC आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="hospitalphc"
                                            value="yes"
                                            checked={formData.hospitalphc === 'yes'}
                                            onChange={e => handleChange('hospitalphc', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="hospitalphc"
                                            value="no"
                                            checked={formData.hospitalphc === 'no'}
                                            onChange={e => handleChange('hospitalphc', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div> */}
                            {/* Sanjay Gandhi */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">संजय गांधी निराधार योजनेचे लाभार्थी आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="sanjaygandhi"
                                            value="yes"
                                            checked={formData.sanjaygandhi === 'yes'}
                                            onChange={e => handleChange('sanjaygandhi', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="sanjaygandhi"
                                            value="no"
                                            checked={formData.sanjaygandhi === 'no'}
                                            onChange={e => handleChange('sanjaygandhi', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>

                            {/* Study Benefit */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">असल्यास, लाभ मिळतो काय?</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studybenefite"
                                            value="yes"
                                            checked={formData.studybenefite === 'yes'}
                                            onChange={e => handleChange('studybenefite', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studybenefite"
                                            value="no"
                                            checked={formData.studybenefite === 'no'}
                                            onChange={e => handleChange('studybenefite', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>

                            {/* Farming */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">शेती आहे काय?</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="farmeavilebleornot"
                                            value="yes"
                                            checked={formData.farmeavilebleornot === 'yes'}
                                            onChange={e => handleChange('farmeavilebleornot', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="farmeavilebleornot"
                                            value="no"
                                            checked={formData.farmeavilebleornot === 'no'}
                                            onChange={e => handleChange('farmeavilebleornot', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Twelfth Row - 3 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Forest Rights */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">असल्यास, वनपट्टेधारक आहे काय?</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studyvanpatta"
                                            value="yes"
                                            checked={formData.studyvanpatta === 'yes'}
                                            onChange={e => handleChange('studyvanpatta', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studyvanpatta"
                                            value="no"
                                            checked={formData.studyvanpatta === 'no'}
                                            onChange={e => handleChange('studyvanpatta', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>

                            {/* Cycle Scheme */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">कुटुंबात सिकलसेल बाधित सदस्य संख्या</label>
                                <div className="flex space-x-3 mt-1">

                                    <input
                                        type="text"
                                        name="sikklacelloffamily"
                                        value={formData.sikklacelloffamily}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"

                                        onChange={e => handleChange('sikklacelloffamily', e.target.value)}
                                    />

                                </div>
                            </div>

                            {/* Children School */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">मुले कोणत्या शाळेत शिकत आहे </label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">

                                        <input
                                            type="radio"
                                            name="whichschoolchlid"
                                            value="आश्रमशाळा"
                                            checked={formData.whichschoolchlid === 'आश्रमशाळा'}
                                            onChange={e => handleChange('whichschoolchlid', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">आश्रम शाळा</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="whichschoolchlid"
                                            value="जिल्हापरिषद"
                                            checked={formData.whichschoolchlid === 'जिल्हापरिषद'}
                                            onChange={e => handleChange('whichschoolchlid', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">जिल्हा परिषद</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="whichschoolchlid"
                                            value="इतर"
                                            checked={formData.whichschoolchlid === 'इतर'}
                                            onChange={e => handleChange('whichschoolchlid', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">इतर</span>
                                    </label>
                                </div>
                            </div>

                        </div>

                        {/* Tenth Row - 3 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Ashram School */}

                            {/* LPG Cylinder */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">LPG सिलिंडर आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="lpggas"
                                            value="yes"
                                            checked={formData.lpggas === 'yes'}
                                            onChange={e => handleChange('lpggas', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="lpggas"
                                            value="no"
                                            checked={formData.lpggas === 'no'}
                                            onChange={e => handleChange('lpggas', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>

                            {/* Bank Account */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">बँक खाते आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="bankaccount"
                                            value="yes"
                                            checked={formData.bankaccount === 'yes'}
                                            onChange={e => handleChange('bankaccount', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="bankaccount"
                                            value="no"
                                            checked={formData.bankaccount === 'no'}
                                            onChange={e => handleChange('bankaccount', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                            {/* Bank Type */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">असल्यास, राष्ट्रीयकृत/को-ऑप/सोसायटी</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studtatcoop"
                                            value="राष्ट्रीयकृत"
                                            checked={formData.studtatcoop === 'राष्ट्रीयकृत'}
                                            onChange={e => handleChange('studtatcoop', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">राष्ट्रीयकृत</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studtatcoop"
                                            value="को-ऑप"
                                            checked={formData.studtatcoop === 'को-ऑप'}
                                            onChange={e => handleChange('studtatcoop', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">को-ऑप</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="studtatcoop"
                                            value="सोसायटी"
                                            checked={formData.studtatcoop === 'सोसायटी'}
                                            onChange={e => handleChange('studtatcoop', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">सोसायटी</span>
                                    </label>
                                </div>
                            </div>
                            {/* PM Vima Yojana */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">PM विमा योजना केली आहे/नाही</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="pmvimayojna"
                                            value="yes"
                                            checked={formData.pmvimayojna === 'yes'}
                                            onChange={e => handleChange('pmvimayojna', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="pmvimayojna"
                                            value="no"
                                            checked={formData.pmvimayojna === 'no'}
                                            onChange={e => handleChange('pmvimayojna', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                        </div>



                        {/* Twelfth Row - 2 Columns */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">



                            {/* Department Scheme */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">प्रकल्प कार्यालयाकडून कोणती योजना मिळाली</label>
                                <div className="flex space-x-3 mt-1">

                                    <input
                                        type="text"
                                        name="praklpkaryalaly"
                                        value={formData.praklpkaryalaly}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        onChange={e => handleChange('praklpkaryalaly', e.target.value)}
                                    />

                                </div>
                            </div>
                            {/* Other Department Scheme */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">इतर विभागाकडून कोणती योजना मिळाली</label>
                                <div className="flex space-x-3 mt-1">

                                    <input
                                        type="text"
                                        name="itarvibhagudan"
                                        value={formData.itarvibhagudan}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        onChange={e => handleChange('itarvibhagudan', e.target.value)}
                                    />


                                </div>
                            </div>

                            {/* Health Checkup */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">नियमित आरोग्य तपासणी करण्यात येते काय?</label>
                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="niymitaarogya"
                                            value="yes"
                                            checked={formData.niymitaarogya === 'yes'}
                                            onChange={e => handleChange('niymitaarogya', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="niymitaarogya"
                                            value="no"
                                            checked={formData.niymitaarogya === 'no'}
                                            onChange={e => handleChange('niymitaarogya', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                }
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
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                                    selectedFields.length === 0
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

export default Vyaktigatdatafilter;