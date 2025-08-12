"use client";
import { usePathname } from 'next/navigation';
import React, {
  useEffect,
  useState,
  ReactNode,

  isValidElement,
} from 'react';

import Loader from '@/common/Loader';

interface PathHandlerProps {
  children: ReactNode;
}

interface ClickableChildProps {
  onClick?: () => void;
}

const PathHandler: React.FC<PathHandlerProps> = ({ children }) => {
  const router = usePathname();
  const [loading, setLoading] = useState(false);

  const handleItemClick = (path: string) => {
    setLoading(true);
    localStorage.setItem("currentPath", path);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setLoading(false);
    };

    if (router) {
      handleRouteChange();
    }

    return () => {
      // Cleanup if needed
    };
  }, [router]);

  return (
    <div>
      {loading && <div><Loader /></div>}
      {React.Children.map(children, (child) => {
        if (isValidElement<ClickableChildProps>(child)) {
          return React.cloneElement(child, {
            onClick: () => handleItemClick(router),
          });
        }
        return child;
      })}
    </div>
  );
};

export default PathHandler;
