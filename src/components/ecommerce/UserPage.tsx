'use client';

import { useEffect, useState } from 'react';

interface SafeUser {
    user_id: number;
    name: string;
    user_category_id: number;
    username: string;
    contact_no: string;
    address: string;
    taluka_id: number;
    village_id: number;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function UserPage() {
    const [users, setUsers] = useState<SafeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: SafeUser[] = await response.json();
                setUsers(data);
               
            } catch (err) {
               
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div>Loading users...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">User List</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 border">ID</th>
                            <th className="py-2 px-4 border">Name</th>
                            <th className="py-2 px-4 border">Username</th>
                            <th className="py-2 px-4 border">Contact</th>
                            <th className="py-2 px-4 border">Address</th>
                            <th className="py-2 px-4 border">Status</th>
                            <th className="py-2 px-4 border">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.user_id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border">{user.user_id}</td>
                                <td className="py-2 px-4 border">{user.name}</td>
                                <td className="py-2 px-4 border">{user.username}</td>
                                <td className="py-2 px-4 border">{user.contact_no}</td>
                                <td className="py-2 px-4 border">{user.address}</td>
                                <td className="py-2 px-4 border capitalize">{user.status}</td>
                                <td className="py-2 px-4 border">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
