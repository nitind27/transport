'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

// Define the type for your user data
interface UserData {
  name: string;
  user_id: number;
  category_name: string;
  taluka_id: number;
  village_id: number;
  category_id: number;
}

const Userinfo: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const cookie = Cookies.get('user_data');
    if (cookie) {
      try {
        setUserData(JSON.parse(cookie));
      } catch {
        setUserData(null);
      }
    }
  }, []);

  if (!userData) {
    return <div>No user data found in cookie.</div>;
  }

  return (
    <div>
      <h2>User Data from Cookie</h2>
      <ul>
        <li><strong>Name:</strong> {userData.name}</li>
        <li><strong>User ID:</strong> {userData.user_id}</li>
        <li><strong>Category Name:</strong> {userData.category_name}</li>
        <li><strong>Taluka ID:</strong> {userData.taluka_id}</li>
        <li><strong>Village ID:</strong> {userData.village_id}</li>
        <li><strong>Category ID:</strong> {userData.category_id}</li>
      </ul>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
    </div>
  );
};

export default Userinfo;
