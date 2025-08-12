
import React from 'react';



interface BreadcrumbsProps {
  title: string;
 
}

const Titiledata: React.FC<BreadcrumbsProps> = ({ title }) => {
  return (
    <div className="p-4 bg-white rounded-lg w-full  mx-auto border">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>

    </div>
  );
};

export default Titiledata;
