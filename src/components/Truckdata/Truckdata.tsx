"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

type Owner = {
	id: number;
	name: string;
	status: string;
};

type TruckRow = {
	id: number;
	truckNo: string;
	ownerId: number;
	ownerName: string;
	mobileNumber: string;
	status: string;
};

type Props = {
	// Keeping props for compatibility, not used now
	truckdata: TruckRow[];
	owner: Owner[];
};

type FormErrors = {
	truckNo?: string;
	ownerId?: string;
	mobileNumber?: string;
};

const Truckdata = ({ truckdata }: Props) => {
	//    const [data, setData] = useState<Taluka[]>(district || []);
	const [data, setData] = useState<TruckRow[]>(truckdata || []);
	const [owners, setOwners] = useState<Owner[]>([]);

	// Form state
	const [truckNo, setTruckNo] = useState('');
	const [ownerId, setOwnerId] = useState<number | ''>('');
	const [ownerName, setOwnerName] = useState('');
	const [mobileNumber, setMobileNumber] = useState('');

	const [editId, setEditId] = useState<number | null>(null);
	const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
	const [loading, setLoading] = useState(false);
	const [error, setErrors] = useState<FormErrors>({});

	// Fetch owners for the select
	const fetchOwners = async () => {
		try {
			const res = await fetch('/api/ownerdata');
			const rows: Owner[] = await res.json();
			setOwners(rows);
		} catch {
			toast.error('Failed to load owners');
		}
	};

	// TODO: Hook this to your truck API when available
	const fetchData = async () => {
		try {
			const response = await fetch('/api/truckdata');
			const trucks: TruckRow[] = await response.json();
			setData(trucks);
		} catch  {
			toast.error('Failed to load truck data');
		}
	};


	useEffect(() => {
		fetchOwners();
		fetchData();
	}, []);

	useEffect(() => {
		if (!isvalidation) setErrors({});
	}, [isvalidation]);

	const reset = () => {
		setTruckNo('');
		setOwnerId('');
		setOwnerName('');
		setMobileNumber('');
		setEditId(0);
	};

	useEffect(() => {
		if (!isEditMode) reset();
	}, [isEditMode]);

	const validateInputs = () => {
		const newErrors: FormErrors = {};
		setisvalidation(true);

		if (!truckNo) newErrors.truckNo = "Truck No is required";
		if (!ownerId) newErrors.ownerId = "Owner is required";
		if (!mobileNumber) newErrors.mobileNumber = "Mobile Number is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	   const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
 	const apiUrl = editId ? '/api/truckdata' : '/api/truckdata';
			const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
					id: editId,
					truckNo,
					ownerId,
					ownerName,
					mobileNumber,
					status: "Active",
				})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId
                ? 'Updated successfully!'
                : 'Inserted successfully!');


            reset()
            setEditId(null);
            fetchData();
            	fetchOwners();
        } catch (error) {
            console.error('Error saving Users:', error);
            toast.error(editId
                ? 'Failed to update Users. Please try again.'
                : 'Failed to create Users. Please try again.');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
            fetchData();
			fetchOwners();
        }
    };



	const handleEdit = (row: TruckRow) => {
		setIsActive(!isActive);
		setIsmodelopen(true);
		setIsEditmode(true);

		setEditId(row.id);
		setTruckNo(row.truckNo);
		setOwnerId(row.ownerId);
		setOwnerName(row.ownerName);
		setMobileNumber(row.mobileNumber);
	};

	// Owner select change to set both ownerId and ownerName
	const onChangeOwner = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const idVal = e.target.value ? Number(e.target.value) : '';
		setOwnerId(idVal as number | '');
		if (idVal) {
			const found = owners.find(o => o.id === idVal);
			setOwnerName(found?.name ?? '');
		} else {
			setOwnerName('');
		}
	};

	const columns: Column<TruckRow>[] = [
		{ key: 'truckNo', label: 'Truck No', accessor: 'truckNo', render: (row) => <span>{row.truckNo}</span> },
		{ key: 'ownerName', label: 'Owner', accessor: 'ownerName', render: (row) => <span>{row.ownerName}</span> },
		{ key: 'mobileNumber', label: 'Mobile', accessor: 'mobileNumber', render: (row) => <span>{row.mobileNumber}</span> },
		{
			key: 'actions',
			label: 'Actions',
			render: (row) => (
				<div className="flex gap-2 whitespace-nowrap w-full">
					<span onClick={() => handleEdit(row)} className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200">
						<FaEdit className="inline-block align-middle text-lg" />
					</span>
					<span>
						<DefaultModal id={row.id} fetchData={fetchData} endpoint={"truckdata"} bodyname='id' newstatus={row.status} />
					</span>
				</div>
			),
		}
	];


	return (
		<div className="mt-5">
			<ReusableTable
				data={data}
				classname={"h-auto overflow-y-auto scrollbar-hide"}
				inputfiled={
					<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
						<div>
							<Label>Truck No</Label>
							<input
								type="text"
								placeholder="Enter Truck No"
								className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.truckNo ? "border-red-500" : ""}`}
								value={truckNo}
								onChange={(e) => setTruckNo(e.target.value)}
							/>
							{error.truckNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.truckNo}</div>}
						</div>

						<div>
							<Label>Owner</Label>
							<select
								className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 bg-white text-gray-800 ${error.ownerId ? "border-red-500" : ""}`}
								value={ownerId}
								onChange={onChangeOwner}
							>
								<option value="">Select Owner</option>
								{owners.map((o) => (
									<option key={o.id} value={o.id}>
										{o.name}
									</option>
								))}
							</select>
							{error.ownerId && <div className="text-red-500 text-sm mt-1 pl-1">{error.ownerId}</div>}
						</div>

						<div>
							<Label>Mobile Number</Label>
							<input
								type="tel"
								placeholder="Enter Mobile Number"
								className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.mobileNumber ? "border-red-500" : ""}`}
								value={mobileNumber}
								onChange={(e) => setMobileNumber(e.target.value)}
							/>
							{error.mobileNumber && <div className="text-red-500 text-sm mt-1 pl-1">{error.mobileNumber}</div>}
						</div>
					</div>
				}
				columns={columns}
				title="Truck"
				filterOptions={[]}
				submitbutton={
					<button
						type='button'
						onClick={handleSave}
						className='bg-blue-700 text-white py-2 p-2 rounded'
						disabled={loading}
					>
						{loading ? 'Submitting...' : (editId ? 'Update' : 'Save')}
					</button>
				}
				searchKey="truckNo"
			/>
		</div>
	);
};

export default Truckdata;
