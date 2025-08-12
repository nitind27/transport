// app/(admin)/(others-pages)/users/page.tsx

import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Usersdatas from '@/components/usersdata/Usersdatas';
import { UserData } from '@/components/usersdata/Userdata';
import { Taluka } from '@/components/Taluka/Taluka';
import { Village } from '@/components/Village/village';
import { UserCategory } from '@/components/usercategory/userCategory';
import { Suspense } from 'react';
import Loader from '@/common/Loader';
// import { Grampanchayattype } from '@/components/grampanchayat/gptype';

const getUsers = async (): Promise<UserData[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { cache: 'no-store' });
  return res.json();
};

const getVillages = async (): Promise<Village[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' });
  return res.json();
};

const getTalukas = async (): Promise<Taluka[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' });
  return res.json();
};




const getUserCategories = async (): Promise<UserCategory[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`, { cache: 'no-store' });
  return res.json();
};

const Page = async () => {
  const [users, villages, talukas, categories] = await Promise.all([
    getUsers(),
    getVillages(),
    getTalukas(),
    getUserCategories(),
    // getgrampanchayat()
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Users', href: '/users' },
  ];


  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
      <Suspense fallback={<Loader />}>
        <Breadcrumbs title="Users" breadcrumbs={breadcrumbItems} />
        <Usersdatas
          users={users}
          datavillage={villages}
          datataluka={talukas}
          datausercategorycrud={categories}
          // grampanchayat={[]}
        />
      </Suspense>
    </div>
    </div>
  );
};

export default Page;
