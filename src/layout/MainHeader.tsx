"use client";

import Link from "next/link";

const MainHeader: React.FC = () => {




    return (
        <header className="sticky top-0 flex w-full bg-[#007AFF] border-gray-200  dark:border-gray-800 dark:bg-gray-900 lg:border-b z-999">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6 z-999">
                <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">


                    <Link href="/" className="lg:hidden">

                        <span className="text-white text-[12px] whitespace-nowrap">

                            Scheme - Serve
                        </span>

                    </Link>


                    <div className="hidden lg:block">
                        <h1 className="text-2xl font-semibold text-white whitespace-nowrap">Scheme - Serve </h1>
                    </div>
                </div>


            </div>
        </header>
    );
};

export default MainHeader;
