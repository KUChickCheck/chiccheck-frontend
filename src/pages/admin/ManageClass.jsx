import React, { useEffect, useState } from 'react';
import api from '../../utilities/api';

const ManageClass = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);  // Ensure it's initialized as an empty array
  const [lateAllowance, setLateAllowance] = useState(''); // State for late allowance
  const [previousLateAllowance, setPreviousLateAllowance] = useState(''); // State to hold previous late allowance
  const [isLoading, setIsLoading] = useState(false); // Loading state for the PUT request
  const [classDetails, setClassDetails] = useState(null); // State to hold the selected class details

  // Fetch class names
  const getClassesName = async () => {
    try {
      const response = await api.get('/class');
      setClasses(response || []);  // Ensure that we always set an array
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  // Fetch class details (including late allowance) when a class is selected
  const getClassDetails = async (classId) => {
    try {
      const response = await api.get(`/class/${classId}`);  // API call to fetch class details
      setClassDetails(response); // Store the full class details
      if (response.schedule && response.schedule.length > 0) {
        const lateAllowance = response.schedule[0].late_allowance_minutes; // Get the late allowance
        setLateAllowance(lateAllowance);  // Set the fetched late allowance
        setPreviousLateAllowance(lateAllowance); // Store the previous late allowance value
      }
    } catch (e) {
      console.error('Error fetching class details:', e);
    }
  };

  // Handle class selection
  const handleChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId); // Set the selected class

    if (classId !== 'none') {
      getClassDetails(classId); // Fetch the class details including late allowance
    }
  };

  // Handle late allowance edit
  const handleLateAllowanceChange = (e) => {
    setLateAllowance(e.target.value); // Update the late allowance state when input changes
  };

  // Submit the updated late allowance
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Prepare the updated schedule with the new late allowance
      const updatedSchedule = classDetails.schedule.map(scheduleItem => ({
        ...scheduleItem,
        late_allowance_minutes: lateAllowance, // Update the late allowance for this schedule item
      }));

      // Create the payload to send to the API
      const payload = {
        schedule: updatedSchedule
      };

      // Send the PUT request with the updated schedule
      await api.put(`/class/${selectedClass}`, payload);
      alert('Late allowance updated successfully!');
      setPreviousLateAllowance(lateAllowance); // Update the previous late allowance after successful update
    } catch (e) {
      console.error('Error updating late allowance:', e);
      alert('Failed to update late allowance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getClassesName(); // Fetch the list of classes on component mount
  }, []);

  return (
    <div className='flex flex-col gap-4'>
      <h5 className='text-2xl font-bold'>Class Config</h5>
      <div className='flex items-center gap-4'>
        <div className='select-wrapper'>
          <select
            className='text-primary border border-gray-300 rounded-md py-2 px-4 w-full font-bold text-xl'
            onChange={handleChange}
            value={selectedClass}
          >
            <option value='none'>Select Class</option>
            {classes && classes.length > 0 ? (
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name}
                </option>
              ))
            ) : (
              <option value="none">No classes available</option>
            )}
          </select>
        </div>
      </div>
      
      {selectedClass && classDetails && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor='lateAllowance' className='block text-lg font-semibold'>
              Late Allowance (minutes):
            </label>
            <input
              id='lateAllowance'
              type='number'
              value={lateAllowance} // Show the current late allowance value
              onChange={handleLateAllowanceChange}
              className='text-primary border border-gray-300 rounded-md py-2 px-4 w-full font-bold text-xl mt-2'
              min='0'
            />
          </div>

          <div className='mt-2'>
            <span className='text-gray-600'>Previous Late Allowance: {previousLateAllowance} minutes</span>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='mt-4 bg-teal-700 hover:bg-teal-800 text-white py-2 px-4 rounded-md disabled:bg-gray-400'
          >
            {isLoading ? 'Updating...' : 'Update Late Allowance'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ManageClass;
