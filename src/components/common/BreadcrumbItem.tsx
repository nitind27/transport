import Link from 'next/link';
import React from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ title, breadcrumbs }) => {
  return (
    <div className="p-4 bg-white rounded-lg w-full  mx-auto border">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <nav className="flex space-x-2 text-gray-600">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <Link
              href={item.href}
              className={`hover:text-blue-500 transition-colors ${index === breadcrumbs.length - 1 ? 'text-blue-500 font-medium' : ''
                }`}
            >
              {item.label}
            </Link>
            {index < breadcrumbs.length - 1 && (
              <span className="text-gray-400">/</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
