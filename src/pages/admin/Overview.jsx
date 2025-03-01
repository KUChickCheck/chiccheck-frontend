import React from "react";
import api from "../../utilities/api";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import ReportCard from "../../components/ReportCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";


const Overview = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [classScheduleDay, setClassScheduleDay] = useState("");
  const [report, setReport] = useState([
    { icon: "users.svg", status: "Total Student", amount: 0 },
    { icon: "circle-check-big.svg", status: "On Time", amount: 0 },
    { icon: "clock-alert.svg", status: "Late", amount: 0 },
    { icon: "circle-x.svg", status: "Absent", amount: 0 },
  ]);
  const [notes, setNotes] = useState([
  ])

  const [startTime, setStartTime] = useState("")

  const getClassesName = async () => {
    try {
      // const response = await api.get(`/teacher/${user._id}/all-classes`)
      const response = await api.get(`/class`);
      setClasses(response);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getClassesName();
  }, []);

  const handleChange = async (e) => {
    const class_id = e.target.value;
    setSelectedClass(class_id); // Get the value of the selected option
    setSelectedDate(null);
    setAttendanceList([])


    // Find the selected class to get the schedule day
    const selectedClassData = classes.find((cls) => cls._id === class_id);
    if (selectedClassData) {


      setClassScheduleDay(selectedClassData.schedule);

      // Store class_id and class_name in localStorage
      localStorage.setItem('class_id', class_id);
    }
  };

  const getClassAttendanceByDate = async () => {
    try {
      const response = await api.get(
        `/attendance/class/${selectedClass}/date/${selectedDate}`
      );
      const { total_students, ontime, late, absent } = response.statistics
      setAttendanceList(response.attendance);
      setReport([
        { icon: "users.svg", status: "Total Student", amount: total_students },
        { icon: "circle-check-big.svg", status: "On Time", amount: ontime },
        { icon: "clock-alert.svg", status: "Late", amount: late },
        { icon: "circle-x.svg", status: "Absent", amount: absent },
      ])
      setNotes(response.notes)
    } catch (e) {
      console.error(e);
    }
  };

  const disableNonMatchingDays = (date) => {
    if (!classScheduleDay || classScheduleDay.length === 0) return false; // Don't disable if no class is selected

    const daysMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    // Check if the date matches at least one of the scheduled days
    const isMatchingDay = classScheduleDay.some(schedule => date.day() === daysMap[schedule.days]);

    return !isMatchingDay; // Disable if no matching days
  };

  useEffect(() => {
    if (selectedClass && selectedDate) {
      getClassAttendanceByDate();
    }
  }, [selectedClass, selectedDate]);

  const handleDateChange = (newValue) => {
    const newDate = dayjs(newValue).add(7, 'hour'); // Adjust the date if necessary
    setSelectedDate(newDate);

    // Store the selected date in localStorage
    localStorage.setItem('selected_date', newDate.toISOString());


    // Find the selected class to get the schedule day
    const selectedClassData = classes.find((cls) => cls._id === selectedClass);
    if (selectedClassData) {
      const daysMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      console.log(selectedClassData);
      const matchingSchedule = selectedClassData.schedule.find(schedule => newValue.day() === daysMap[schedule.days]);


      if (matchingSchedule) {
        setStartTime(matchingSchedule.start_time)
        localStorage.setItem('start_time', matchingSchedule.start_time);
      }
    }
  };

  useEffect(() => {
    // Check if class_id exists in localStorage and set the selected class
    const storedClassId = localStorage.getItem('class_id');
    if (storedClassId) {
      setSelectedClass(storedClassId);
      const selectedClassData = classes.find((cls) => cls._id === storedClassId);
      if (selectedClassData) {
        setClassScheduleDay(selectedClassData.schedule);
      }
    }

    const storedDate = localStorage.getItem('selected_date');
    if (storedDate) {
      setSelectedDate(dayjs(storedDate)); // Set the selected date from localStorage
    }

    const storedStartTime = localStorage.getItem('start_time');
    if (storedStartTime) {
      setStartTime(storedStartTime); // Set the selected date from localStorage
    }
  }, [classes])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="select-wrapper">
          <select
            className="text-primary border border-gray-300 rounded-md py-2 px-4 w-full font-bold text-xl"
            onChange={handleChange} // Set the event handler
            value={selectedClass} // Bind the selected value
          >
            <option defaultValue value="none">
              Select Class
            </option>
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
              // label="Date of Class"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{ textField: { size: "small" } }}
              shouldDisableDate={(date) =>
                date.isAfter(dayjs()) || disableNonMatchingDays(date)
              }
              disabled={!selectedClass} // Disable if no class is selected
            />
          </div>
        </LocalizationProvider>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {report.map((item) => (
          <ReportCard
            key={item.status}
            icon={item.icon}
            status={item.status}
            amount={item.amount}
          />
        ))}
      </div>
      <div className="w-full">
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={16}
          slidesPerView={1.2} // Slightly show next card
          centeredSlides={false} // Ensure it starts from the left
          // navigation
          // pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4.2 },
            1280: { slidesPerView: 5.2 },
            1536: { slidesPerView: 6.2 },
          }}
          className="py-4"
        >
          {notes.map((note) => (
            <SwiperSlide key={note.id}>
              <div className="bg-white shadow-sm rounded-lg p-4 border">
                <h3 className="text-base font-bold">{note.student_id} {note.first_name} {note.last_name}</h3>
                <p className="text-gray-500">{note.note_text}</p>
                <p className="text-sm text-gray-500 mt-2">{note.timestamp}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
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
              <th className="py-3 px-6 text-left">Location</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {attendanceList.map((student, index) => {
              let lateMinutes = null;
              let lateText = "";

              if (student.status === "Late" && student.timestamp) {
                // Convert "HH:MM" start time to hours and minutes
                const [startHour, startMinute] = startTime.split(":").map(Number);
                const expectedTime = new Date(student.timestamp);
                expectedTime.setHours(startHour, startMinute, 0, 0); // Set expected start time

                const actualTime = new Date(student.timestamp);
                lateMinutes = Math.floor((actualTime - expectedTime) / 60000); // Convert milliseconds to minutes

                // If late, calculate in hours and minutes
                if (lateMinutes > 0) {
                  const lateHours = Math.floor(lateMinutes / 60);
                  const remainingMinutes = lateMinutes % 60;

                  lateText = lateHours > 0
                    ? ` (${lateHours} hr ${remainingMinutes} min late)`
                    : ` (${lateMinutes} min late)`;
                }
              }

              return (
                <tr key={index} className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="py-3 px-6">{student.student_id}</td>
                  <td className="py-3 px-6">{student.first_name}</td>
                  <td className="py-3 px-6">{student.last_name}</td>
                  <td
                    className={`py-3 px-6 font-semibold ${student.status === "Present"
                        ? "text-green-600"
                        : student.status === "Late"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                  >
                    {student.status}
                  </td>
                  {student.timestamp ? (
                    <td className="py-3 px-6">
                      {new Date(student.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                      {lateText}
                    </td>
                  ) : (
                    <td className="py-3 px-6">-</td>
                  )}
                  <td className="py-3 px-6">{student.location_status ? student.location_status : "-"}</td>
                </tr>
              );
            })}
          </tbody>


        </table>
      </div>
    </div>
  );
};

export default Overview;
