import React from 'react'
import api from '../../utilities/api'
import { useEffect, useState } from 'react'
import { useSelector } from "react-redux";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const Overview = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceList, setAttendanceList] = useState([])

  const getClassesName = async () => {
    try {
      // const response = await api.get(`/teacher/${user._id}/all-classes`)
      const response = await api.get(`/class`)
      setClasses(response)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getClassesName()
  }, []);

  const handleChange = async (e) => {
    const class_id = e.target.value
    setSelectedClass(class_id); // Get the value of the selected option
  }

  const getClassAttendanceByDate = async () => {
    try {
      const response = await api.get(`/attendance/class/${selectedClass}/date/${selectedDate}`)
      setAttendanceList(response.attendance)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (selectedClass && selectedDate) {
      getClassAttendanceByDate()
    }
  }, [selectedClass, selectedDate]);

  return (
    <div>
      <div className='flex items-center gap-4 mb-5'>

        <div className="select-wrapper">
          <select
            className="text-primary border border-gray-300 rounded-md py-2 px-4 w-full font-bold text-xl"
            onChange={handleChange} // Set the event handler
            value={selectedClass} // Bind the selected value
          >
            <option defaultValue value="none">Select Class</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls._id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="flex justify-center items-center">
            <DatePicker
              label="Date of Class"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{ textField: { size: "small" } }}
            />
          </div>
        </LocalizationProvider>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
          <thead>
            <tr className="bg-primary text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Student ID</th>
              <th className="py-3 px-6 text-left">First Name</th>
              <th className="py-3 px-6 text-left">Last Name</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {attendanceList.map((student, index) => (
              <tr key={index} className="border-b border-gray-300 hover:bg-gray-100">
                <td className="py-3 px-6">{student.student_id}</td>
                <td className="py-3 px-6">{student.first_name}</td>
                <td className="py-3 px-6">{student.last_name}</td>
                <td
                  className={`py-3 px-6 font-semibold ${student.status === "Present" ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {student.status}
                </td>
                {student.timestamp ?
                  <td className="py-3 px-6">{new Date(student.timestamp).toLocaleString()}</td>
                  :
                  <td className="py-3 px-6">-</td>
                }

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Overview