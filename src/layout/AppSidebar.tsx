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

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Super Admin (category_id = 5) - Full access to all menus including Masters
const adminNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Masters",
    subItems: [
      // { name: "Companies", path: "/companies" },
      { name: "Users", path: "/users" },
      { name: "District", path: "/distdata" },
      { name: "Taluka", path: "/taluka" },
      { name: "Center's", path: "/center" },
      { name: "Schools", path: "/school" },
      { name: "Items", path: "/itemsgrains" },
      { name: "Owners", path: "/owner" },
      { name: "Trucks", path: "/trucks" },
      { name: "Dealers", path: "/dealer" },
      { name: "Godown", path: "/godown" },  
      // { name: "Sales Return", path: "/salesreturen" }, 
    ],
  },
  // {
  //   icon: <TbCategoryPlus />,
  //   name: "Stock Inventory",
  //   path: "/stockinventory",
  // },
  // {
  //   icon: <TbCategoryPlus />,
  //   name: "ZP Order Details",
  //   subItems: [
  //     { name: "Order Details", path: "/zporderdetails" },
  //     { name: "Add Schools Wise Order Detials", path: "/addSchoolswiseorder" },
  //     { name: "Order Register", path: "/orderregister" },
  //   ],
  // },
  // {
  //   icon: <TbCategoryPlus />,
  //   name: "Dispatch Details",
  //   path: "/dipatchdetials",
  // },
  // {
  //   icon: <TbCategoryPlus />,
  //   name: "Route Paper",
  //   path: "/routepaper",
  // },
];

// Owner (category_id = 2) - Dashboard and ZP Order Details only
const superadmin: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Companies",
    path: "/companies",
  },
  {
    icon: <RxDashboard />,
    name: "Create Admin",
    path: "/admincompanies",
  },
 
];
const ownerNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <TbCategoryPlus />,
    name: "ZP Order Details",
    subItems: [
      { name: "Order Details", path: "/zporderdetails" },
      { name: "Add Schools Wise Order Detials", path: "/addSchoolswiseorder" },
      { name: "Order Register", path: "/orderregister" },
    ],
  },
];

// Supervisor (category_id = 3) - Dashboard, ZP Order Details, and Stock Inventory
const supervisorNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Companies",
    path: "/companies",
  },
  {
    icon: <TbCategoryPlus />,
    name: "ZP Order Details",
    subItems: [
      { name: "Order Details", path: "/zporderdetails" },
      { name: "Add Schools Wise Order Detials", path: "/addSchoolswiseorder" },
      { name: "Order Register", path: "/orderregister" },
    ],
  },
  {
    icon: <TbCategoryPlus />,
    name: "Stock Inventory",
    path: "/stockinventory",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Billing Register",
    path: "/billingregister",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Sales Summary",
    path: "/salessummary",
  },
];

// Staff (category_id = 4) - Dashboard, Dispatch Details, Route Paper, and Stock Inventory
const staffNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Dispatch Details",
    path: "/dipatchdetials",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Route Paper",
    path: "/routepaper",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Stock Inventory",
    path: "/stockinventory",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Billing Register",
    path: "/billingregister",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Sales Summary",
    path: "/salessummary",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Transportation Detials",
    path: "/transportationdetials",
  },
  {
    icon: <TbCategoryPlus />,
    name: "Sales Return",
    path: "/salesreturen",
  },
  
];

// Default fallback - Dashboard only
const defaultNavItems: NavItem[] = [
  {
    icon: <RxDashboard />,
    name: "Dashboard",
    path: "/",
  },
];

const AppSidebar: React.FC = () => {
  // All hooks must be called first - before any conditional returns
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { setIsglobleloading } = useToggleContext();
  const router = usePathname();
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [storedValuecategory_id, setStoredValuecategory_id] = useState<string | null>(null);
  // const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // All state hooks
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // All callbacks
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // Function to get navigation items based on user category
  const getNavItemsByCategory = (categoryId: string | null): NavItem[] => {
    switch (categoryId) {
      case "5": // Super Admin
        return superadmin;
      case "1": // Admin
        return adminNavItems;
      case "2": // Owner
        return ownerNavItems;
      case "3": // Supervisor
        return supervisorNavItems;
      case "4": // Staff
        return staffNavItems;
      default:
        return defaultNavItems;
    }
  };

  const navItems: NavItem[] = getNavItemsByCategory(storedValuecategory_id);

  // All useEffect hooks - must be called before any conditional returns
  useEffect(() => {
    const value = sessionStorage.getItem('userName');
    const category_id = sessionStorage.getItem('category_id');
    const superAdmin = sessionStorage.getItem('isSuperAdmin');
    
    // Debug logs
    console.log('AppSidebar Debug:', {
      userName: value,
      category_id: category_id,
      isSuperAdmin: superAdmin,
      isSuperAdminCheck: superAdmin === "true" && category_id === "5"
    });
    setStoredValue(value);
    setStoredValuecategory_id(category_id);
    // setIsSuperAdmin(superAdmin === "true" && category_id === "5");
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsglobleloading(false);
    };

    if (router) {
      handleRouteChange();
    }
    return () => {
      // Cleanup if needed
    };
  }, [router, setIsglobleloading]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : [];
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
  }, [pathname, isActive, navItems]);

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

  // Function to handle click and store path in localStorage
  const handleItemClick = (path: string) => {
    setIsglobleloading(true);
    localStorage.setItem("currentPath", path);
  };

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

  // Early return AFTER all hooks - Remove the super admin check
  // Sidebar should show for all logged-in users based on their category
  if (!storedValuecategory_id) {
    return null; // Only hide if no category_id is set
  }

  // JSX return
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
              <h1 className="dark:hidden text-[20px] font-semibold">Hello, {storedValue}</h1>
              <h1 className="hidden dark:block text-white text-[20px] font-semibold">Hello, {storedValue}</h1>
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

