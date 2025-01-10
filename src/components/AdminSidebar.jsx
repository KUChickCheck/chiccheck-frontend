import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = ({ links, isVisible, setIsVisible }) => {

  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setIsVisible(false); 
    }
    else if (window.innerWidth > 768) {
      setIsVisible(true); 
    }
  };

  useEffect(() => {
    // Set the initial state based on the current width
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [window.innerWidth]);

  return (
    <div>
      <div className={`h-full fixed ${isVisible ? 'left-0' : '-left-64'} transition-all duration-500 ease-in-out bg-primary shadow-md`} style={{zIndex: "999", width: "200px"}}>
        <div className='flex flex-col'>
          <div className='flex px-4 pt-4 pb-3'>
            <a href="/home">
              <h1 className='text-center text-3xl font-bold text-white hover:text-4xl transition-transform duration-300'>ChicCheck</h1>
            </a>
          </div>
          <ul className='p-0'>
            {links.map((link, index) => (
              <li className='flex flex-col' key={index}>
                <a href={link.path} className='px-4 py-3 text-white hover:bg-white hover:text-primary transition-colors duration-200'>
                  <i className={link.icon}></i> &nbsp; &nbsp; <span className='text-sm font-medium'>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
