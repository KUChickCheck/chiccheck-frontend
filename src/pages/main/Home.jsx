import React, {useState, useEffect} from "react";
import HeaderComponent from "../../components/Header";
import ClassCard from "../../components/ClassCard";
import api from "../../utilities/api";

const Home = () => {
  // Mock data for multiple class objects
  const [classObjects, setClassObjects] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
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
  

  return (
    <div className="container mx-auto w-full max-w-md h-screen flex flex-col gap-4 px-4">
      {/* Header */}
      <HeaderComponent title={"Home"} />

      {/* Class Cards */}
      <div className="flex flex-col gap-4">
        {classObjects.map((classObject, index) => (
          <ClassCard key={index} classObject={classObject} />
        ))}
      </div>
    </div>
  );
};

export default Home;
