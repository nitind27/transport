"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { RxDashboard } from "react-icons/rx";
import { TbCategoryPlus } from "react-icons/tb"


import {

  ChevronDownIcon,

  HorizontaLDots,

} from "../icons/index";

import { useToggleContext } from "@/context/ToggleContext";
// import { FarmdersType } from "@/components/farmersdata/farmers";
// import { Schemesdatas } from "@/components/schemesdata/schemes";
// import { UserData } from "@/components/usersdata/Userdata";



// const { farmers, schemes ,users} = await getData();


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const allNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Masters",
   
     subItems: [
      { name: "User's", path: "/users" },
      { name: "District", path: "/distdata" },
      { name: "Taluka", path: "/yearmaster" },
      { name: "Village", path: "/users" },
      { name: "Centre", path: "/users" },
      { name: "Schools", path: "/users" },
      { name: "Items / Grains", path: "/users" },
      { name: "Owners", path: "/users" },
      { name: "Trucks", path: "/users" },
      { name: "Dealer", path: "/users" },
      { name: "Godown", path: "/users" },
    ],
  },
  {
    icon: <TbCategoryPlus />,
    name: "Stock Inventory",
    path: "/stockinventory",
  },
  {
    icon: <TbCategoryPlus />,
    name: "ZP Order Details",
    // path: "/zporderdetails",
    subItems: [
      { name: "Order Details", path: "/zporderdetails" },
      { name: "Add Schools Wise Order Detials", path: "/addSchoolswiseorder" },

    ],
  },
  // {
  //   icon: <RxDashboard />,
  //   name: "भौतिक तक्ता",
  //   path: "/bhautik",
  // },
  // {
  //   icon: <RxDashboard />,
  //   name: "वैयक्तिक",
  //   path: "/selfform",
  // },
];
const dashboardOnly: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
  // {
  //   icon: <RxDashboard />,
  //   name: "भौतिक तक्ता",
  //   path: "/bhautik",
  // },

  // {
  //   icon: <RxDashboard />,
  //   name: "वैयक्तिक",
  //   path: "/selfform",
  // },

];



const othersItems: NavItem[] = [



];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  // Any component
  const { setIsglobleloading } = useToggleContext();
  // const currentUser = sessionStorage?.getItem('userName');
  const router = usePathname();
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [storedValuecategory_name, setStoredValuecategory_name] = useState<string | null>(null);
  const navItems: NavItem[] = storedValuecategory_name === "1"
    ? allNavItems
    : (storedValuecategory_name === "25")
      ? dashboardOnly
      : dashboardOnly;


  useEffect(() => {
    const value = sessionStorage.getItem('userName');
    const category_name = sessionStorage.getItem('category_id');
    setStoredValue(value);
    setStoredValuecategory_name(category_name);
  }, []);


  // Function to handle click and store path in localStorage
  const handleItemClick = (path: string) => {
    setIsglobleloading(true);
    localStorage.setItem("currentPath", path);
  };

  useEffect(() => {
    const handleRouteChange = () => {

      setIsglobleloading(false);
    };

    if (router) {
      handleRouteChange();
    }
    return () => {

    };
  }, [router]);


  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">

      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <>

                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}

                  onClick={() => handleItemClick(`${nav.path}`)}
                >
                  <span
                    className={`${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              </>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 flex flex-col gap-2">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-item group ${isActive(subItem.path) ? "menu-item-active" : "menu-item-inactive"} pl-10`}
                      onClick={() => handleItemClick(`${subItem.path}`)}
                    >
                      <span
                        className={`${isActive(subItem.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                          }`}
                      >
                        <span className="block h-1.5 w-1.5 rounded-full bg-current" />
                      </span>
                      <span className={`menu-item-text`}>{subItem.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {/* <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              /> */}
              <h1 className="dark:hidden text-[20px] font-semibold">Hello, {storedValue}</h1>
              <h1 className="hidden dark:block text-white text-[20px] font-semibold">Hello, {storedValue}</h1>
              {/* <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              /> */}
            </>
          ) : (
            <Image
              src="/images/logo/maharasstralogo.png"
              alt="Logo"
              width={50}
              height={50}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>


          </div>
        </nav>

      </div>
    </aside>
  );
};

export default AppSidebar;
