import React, { useState, useEffect } from "react";
import HeaderComponent from "../../components/Header";
import ClassCard from "../../components/ClassCard";
import api from "../../utilities/api";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Home = () => {
  // Mock data for multiple class objects
  const [classObjects, setClassObjects] = useState([]);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (!user || !user._id) {
          console.error("User information is missing in localStorage.");
          return;
        }

        const response = await api.get(`/student/${user._id}`);
        setClassObjects(response.class_ids); // Assuming response.data contains the data you need
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, []);

  const isCurrentDay = (classObject) => {
    try {
      const { days } = classObject.schedule;
      const currentDay = new Date().toLocaleString("en-US", {
        weekday: "long",
      }); // e.g., "Monday"
      return currentDay === days;
    } catch (error) {
      console.error("Error checking day:", error.message);
      return false;
    }
  };

  return (
    <div className="container mx-auto w-full max-w-md h-screen flex flex-col gap-4 px-4">
      {/* Header */}
      <HeaderComponent title={"Home"} />

      {/* Profile */}
      <div className="flex justify-between items-center shadow-sm rounded-xl p-4">
        <div className="flex gap-4">
          <div>
            <img src="/studentIcon.png" alt="student-icon" className="w-12 h-12" />
          </div>
          <div>
            <h5 className="text-xl font-bold">
              {user.first_name} {user.last_name}
            </h5>
            <p className="text-sm text-gray-500">{user.student_id}</p>
          </div>
        </div>

        <div>
          <Link to="/report">
          <img src="/statIcon.png" alt="stat-icon" className="hover:scale-110 transition-transform w-8 h-8"/>
          </Link>
        </div>
      </div>

      <h5 className="text-xl font-bold">Today Schedule</h5>
      {/* Class Cards */}
      <div className="flex flex-col gap-4">
        {classObjects.filter((classObject) => isCurrentDay(classObject))
          .length === 0 ? (
          <h2>There are no classes today</h2>
        ) : (
          classObjects
            .filter((classObject) => isCurrentDay(classObject))
            .map((classObject, index) => (
              <ClassCard key={index} classObject={classObject} />
            ))
        )}
      </div>
    </div>
  );
};

export default Home;
