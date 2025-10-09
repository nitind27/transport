import { useState, useEffect } from 'react';

export interface RolePermissions {
  canAccessMasters: boolean;
  canAccessStockInventory: boolean;
  canAccessZPOrderDetails: boolean;
  canAccessDispatchDetails: boolean;
  canAccessRoutePaper: boolean;
  canAddStock: boolean;
  canTransferStock: boolean;
  canDamageStock: boolean;
}

export const useRoleAccess = () => {
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({
    canAccessMasters: false,
    canAccessStockInventory: false,
    canAccessZPOrderDetails: false,
    canAccessDispatchDetails: false,
    canAccessRoutePaper: false,
    canAddStock: false,
    canTransferStock: false,
    canDamageStock: false,
  });

  useEffect(() => {
    const category = sessionStorage.getItem('category_id');
    setUserCategory(category);
    
    if (category) {
      switch (category) {
        case '1': // Admin
          setPermissions({
            canAccessMasters: true,
            canAccessStockInventory: true,
            canAccessZPOrderDetails: true,
            canAccessDispatchDetails: true,
            canAccessRoutePaper: true,
            canAddStock: true,
            canTransferStock: true,
            canDamageStock: true,
          });
          break;
        case '2': // Owner
          setPermissions({
            canAccessMasters: false,
            canAccessStockInventory: false,
            canAccessZPOrderDetails: true,
            canAccessDispatchDetails: false,
            canAccessRoutePaper: false,
            canAddStock: false,
            canTransferStock: false,
            canDamageStock: false,
          });
          break;
        case '3': // Supervisor
          setPermissions({
            canAccessMasters: false,
            canAccessStockInventory: true,
            canAccessZPOrderDetails: true,
            canAccessDispatchDetails: false,
            canAccessRoutePaper: false,
            canAddStock: true,
            canTransferStock: true,
            canDamageStock: true,
          });
          break;
        case '4': // Staff
          setPermissions({
            canAccessMasters: false,
            canAccessStockInventory: true,
            canAccessZPOrderDetails: false,
            canAccessDispatchDetails: true,
            canAccessRoutePaper: true,
            canAddStock: false,
            canTransferStock: false,
            canDamageStock: false,
          });
          break;
        default:
          setPermissions({
            canAccessMasters: false,
            canAccessStockInventory: false,
            canAccessZPOrderDetails: false,
            canAccessDispatchDetails: false,
            canAccessRoutePaper: false,
            canAddStock: false,
            canTransferStock: false,
            canDamageStock: false,
          });
      }
    }
  }, []);

  return { userCategory, permissions };
};
