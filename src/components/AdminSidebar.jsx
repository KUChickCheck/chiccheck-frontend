import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ links, isVisible, setIsVisible }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/");
  const currentPage = pathSegments[pathSegments.length - 1]; // Get last part of the path

  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setIsVisible(false);
    } else if (window.innerWidth > 768) {
      setIsVisible(true);
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <div
        className={`h-full fixed ${isVisible ? 'left-0' : '-left-64'} transition-all duration-500 ease-in-out bg-primary shadow-md`}
        style={{ zIndex: '999', width: '200px' }}
      >
        <div className="flex flex-col">
          <div className="flex px-4 pt-4 pb-3">
            <Link to="/">
              <h1 className="text-center text-3xl font-bold text-white">ChicCheck</h1>
            </Link>
          </div>
          <ul className="p-0">
            {links.map((link, index) => {
              const isActive = currentPage === link.path;

              return (
                <li className="flex flex-col" key={index}>
                  <Link
                    to={link.path}
                    className={`px-4 py-3 transition-colors duration-200 flex items-center ${
                      isActive ? 'bg-white text-primary font-semibold' : 'hover:bg-white hover:text-primary text-white '
                    }`}
                  >
                    <i className={link.icon}></i>
                    &nbsp; &nbsp;
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
