"use client";

import { useEffect, useState } from 'react';
// import Label from "../form/Label";
// import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
// import Select from 'react-select';
import { toast } from 'react-toastify';
import React from 'react';
// import { MultiValue } from 'react-select';
import { useToggleContext } from '@/context/ToggleContext';
import Loader from '@/common/Loader';
import DefaultModal from '../example/ModalExample/DefaultModal';
// import { FaEdit } from 'react-icons/fa';
// import { Schemesdatas } from '../schemesdata/schemes';
import { BhautikTable } from '../tables/BhautikTable';
import { FaEdit } from 'react-icons/fa';
import { Schemesdatas } from '../schemesdata/schemes';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import { Grampanchayattype } from '../grampanchayat/gptype';
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
    userId: string;
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

const Vyaktigatdata: React.FC<Props> = ({
    initialdata,
    // schemescrud,
    talukadata,
    villagedata,
    getgrampanchayatdata

}) => {
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, setisvalidation } = useToggleContext();
    // const {  isEditMode, setIsmodelopen, setisvalidation } = useToggleContext();
    const [data, setData] = useState<BhautikDataall[]>(initialdata || []);
    // const [schemedata] = useState<Schemesdatas[]>(schemescrud || []);

    const [storedValue, setStoredValue] = useState<string | null>(null);
    // const [schemedata] = useState<Schemesdatas[]>(schemescrud || []);
    const filterdata = storedValue === "1"
        ? data
        : data.filter(item => item.userId == storedValue);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [familyErrors, setFamilyErrors] = useState<{ [key: string]: string }>({});
    console.log("editId", familyErrors)
    console.log("editId", editId)

    // Initialize form state
    useEffect(() => {
        const value = sessionStorage.getItem('userid');

        setStoredValue(value);

    }, []);


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

        // Validation for voteridcard.asleli should not exceed agedata.total
        if (parentField === 'voteridcard' && childField === 'asleli') {
            const agedataTotal = Number(formData.agedata.total) || 0;
            if (Number(value) > agedataTotal) {
                setFamilyErrors(prev => ({
                    ...prev,
                    voteridcard_asleli: `मतदार ओळखपत्र असलेली संख्या (${value}) 18 वर्षावरील एकूण (${agedataTotal}) पेक्षा जास्त असू शकत नाही.`
                }));
                toast.error(`मतदार ओळखपत्र असलेली संख्या (${value}) 18 वर्षावरील एकूण (${agedataTotal}) पेक्षा जास्त असू शकत नाही.`);
                return;
            } else {
                setFamilyErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.voteridcard_asleli;
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

            // Special: voteridcard.nasleli = agedata.total - voteridcard.asleli
            if ((parentField === 'voteridcard' && childField === 'asleli') || (parentField === 'agedata' && childField === 'total')) {
                const agedataTotal = Number(parentField === 'agedata' ? value : newFormData.agedata.total) || 0;
                const asleliValue = Number(parentField === 'voteridcard' ? value : newFormData.voteridcard.asleli) || 0;
                newFormData.voteridcard = {
                    ...newFormData.voteridcard,
                    nasleli: String(Math.max(0, agedataTotal - asleliValue))
                };
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
            const transformedData: Record<string, string | number | null> = {
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
                status: 'Active', // ✅ Optional, add if backend requires it
                userId: storedValue
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

    const handleEdit = (item: BhautikDataall) => {


        setIsmodelopen(true);
        setIsEditmode(true);
        setIsActive(!isActive)
        setEditId(item.id)

        const parseTriple = (value: string): { female: string; male: string; total: string } => {
            const [female = '', male = '', total = ''] = value?.split('|') || [];
            return { female, male, total };
        };
        const parseDouble = (value: string): { asleli: string; nasleli: string } => {
            const [asleli = '', nasleli = ''] = value?.split('|') || [];
            return { asleli, nasleli };
        };

        setFormData({
            id: item.id,
            scheme_name: item.scheme_name || "",
            castdata: item.castdata || "",
            totalmembersname: item.totalmembersname || "",
            familymembercount: parseTriple(item.familymembercount),
            agedata: parseTriple(item.familymembercount),
            castcertificate: parseDouble(item.castcertificate),
            aadharcard: parseDouble(item.aadharcard),
            voteridcard: parseDouble(item.voteridcard),
            rationcard_no: item.rationcard_no || "",
            rationcard: item.rationcard || "",
            rationcardtype: item.rationcardtype || "",
            jobcard: item.jobcard || "",
            pmfarmercard: item.pmfarmercard || "",
            farmercreditcard: item.farmercreditcard || "",
            aayushmancard: item.aayushmancard || "",
            headofmember: item.headofmember || "",
            pmKisanCard: parseDouble(item.pmKisanCard),
            ayushmanCard: parseDouble(item.ayushmanCard),
            housetype: item.housetype || "",
            benefiteofpmhouse: item.benefiteofpmhouse || "",
            waterdrink: item.waterdrink || "",
            hargharnal: item.hargharnal || "",
            electricity: item.electricity || "",
            hospitalphc: item.hospitalphc || "",
            sanjaygandhi: item.sanjaygandhi || "",
            studybenefite: item.studybenefite || "",
            farmeavilebleornot: item.farmeavilebleornot || "",
            studyvanpatta: item.studyvanpatta || "",
            sikklacelloffamily: item.sikklacelloffamily || "",
            whichschoolchlid: item.whichschoolchlid || "",
            anyhaveaashramschool: item.anyhaveaashramschool || "",
            lpggas: item.lpggas || "",
            bankaccount: item.bankaccount || "",
            studtatcoop: item.studtatcoop || "",
            contact_no: item.contact_no || "",
            pmvimayojna: item.pmvimayojna || "",
            praklpkaryalaly: item.praklpkaryalaly || "",
            itarvibhagudan: item.itarvibhagudan || "",
            niymitaarogya: item.niymitaarogya || "",
            taluka_id: item.taluka_id || "",
            village_id: item.village_id || "",
            gp_id: item.gp_id || "",
        });
    };
    const columns: Column<BhautikDataall>[] = [
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
            label: 'जातीचे दाखल',
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
            key: 'yojnasheti',
            label: 'कृषी सन्मान योजना ( रु. 6000)',
            render: (data) => <span>{data.scheme_name}</span>,
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

        {
            key: "actions",
            label: "Actions",
            render: (data) => (
                <div className="flex gap-2 whitespace-nowrap w-full">
                    <span
                        onClick={() => handleEdit(data)}
                        className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <FaEdit className="inline-block align-middle text-lg" />
                    </span>
                    <span>
                        <DefaultModal
                            id={data.id}
                            fetchData={fetchData}
                            endpoint={"vyaktikapi"}
                            bodyname={"id"}
                            newstatus={data.status}
                        />
                    </span>
                </div>
            ),
        },
    ];


    return (
        <div className="">
            {loading && <Loader />}
            <BhautikTable
                data={filterdata}
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
                                    {villagedata.filter((data) => data.gp_name == formData.gp_id).map((category) => (
                                        <option key={category.village_id} value={category.village_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                            </div>
                        </div>
                        {/* Scheme Selection - Full Width */}
                        {/* <div className="mb-6">
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
                        </div> */}



                        {/* First Row - 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                            {/* Tribal Population Section */}

                            {/* Family Head Name */}

                            <div className="bg-gray-100 rounded-lg shadow p-4 md:mb-6 mb-0">
                                <label className="block text-sm font-medium text-gray-700 mb-6">कुटुंब प्रमुखाचे नाव</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.totalmembersname.toUpperCase()}
                                    onChange={e => handleChange('totalmembersname', e.target.value.toUpperCase())}
                                />
                            </div> <div className="bg-gray-100 rounded-lg shadow p-4 md:mb-6 mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-6">कुटुंब संपर्क क्रमांक</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.contact_no}
                                    // onChange={e => handleChange('contact_no', e.target.value)}

                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Allow only digits and maximum length of 10
                                        if (/^\d*$/.test(val) && val.length <= 10) {
                                            handleChange('contact_no', val);
                                        }
                                    }}

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
                                            disabled
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.familymembercount.total}
                                            onChange={e => handleNestedChange('familymembercount', 'total', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg shadow p-4 mb-6">
                                <h3 className="text-sm font-semibold mb-2">18 वर्षावरील सदस्य संख्या.</h3>
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
                                            disabled
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
                                            disabled
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
                                            disabled
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
                                            disabled
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                            value={formData.voteridcard.nasleli}
                                            onChange={e => handleNestedChange('voteridcard', 'nasleli', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-6">राशन कार्ड</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="rationcardtype"
                                            value="yes"
                                            checked={formData.rationcardtype === 'yes'}
                                            onChange={e => handleChange('rationcardtype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="rationcardtype"
                                            value="no"
                                            checked={formData.rationcardtype === 'no'}
                                            onChange={e => handleChange('rationcardtype', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>

                            </div>
                            {/* Ration Card */}
                            <div className="bg-gray-100 rounded-lg shadow p-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-6">राशन कार्ड क्रमांक</label>
                                <input
                                    type="text"
                                    disabled={formData.rationcardtype === 'no' || formData.rationcardtype == ""}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    value={formData.rationcard_no}
                                    // onChange={e => handleChange('rationcard_no', e.target.value)}

                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Allow only digits and maximum length of 10
                                        if (/^\d*$/.test(val) && val.length <= 12) {
                                            handleChange('rationcard_no', val);
                                        }
                                    }}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">कृषी सन्मान योजना (रु.6000)</label>

                                <div className="flex space-x-3 mt-1">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="scheme_name"
                                            value="yes"
                                            checked={formData.scheme_name === 'yes'}
                                            onChange={e => handleChange('scheme_name', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">होय</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="scheme_name"
                                            value="no"
                                            checked={formData.scheme_name === 'no'}
                                            onChange={e => handleChange('scheme_name', e.target.value)}
                                        />
                                        <span className="ml-1 text-xs text-gray-700">नाही</span>
                                    </label>
                                </div>
                            </div>
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

                                        // onChange={e => handleChange('sikklacelloffamily', e.target.value)}

                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Allow only digits and maximum length of 10
                                            if (/^\d*$/.test(val)) {
                                                handleChange('sikklacelloffamily', val);
                                            }
                                        }}

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
                                        value={formData.praklpkaryalaly.toUpperCase()}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        onChange={e => handleChange('praklpkaryalaly', e.target.value.toUpperCase())}
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
                                        value={formData.itarvibhagudan.toUpperCase()}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                        onChange={e => handleChange('itarvibhagudan', e.target.value.toUpperCase())}
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
        </div>
    );
};

export default Vyaktigatdata;