
import Breadcrumbs from '@/components/common/BreadcrumbItem';

import UserCategorydata from '@/components/usercategory/UserCategorydata';
import React from 'react';

const Page = async () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'User Category', href: '/usercategory' },
  ];
  const apiurl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${apiurl}/api/usercategorycrud`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Failed to fetch user categories:', res.status, res.statusText);

    return <div>Error loading user categories</div>;
  }

  const data = await res.json();


  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Breadcrumbs
          title="User Category"
          breadcrumbs={breadcrumbItems}
        />
        <UserCategorydata serverData={data} />

      </div>
    </div>
  );
};

export default Page;
