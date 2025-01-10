import React from "react";
import HeaderComponent from "../../components/Header";
import ClassCard from "../../components/ClassCard";

const Home = () => {
  // Mock data for multiple class objects
  const classObjects = [
    {
      status: "active",
      className: "Yoga Class",
      time: "13.00 P.M. - 16.00 P.M.",
      instructor: "John Doe",
    },
    {
      status: "inactive",
      className: "Pilates Class",
      time: "13.00 P.M. - 16.00 P.M.",
      instructor: "Jane Smith",
    },
    {
      status: "active",
      className: "Zumba Class",
      time: "13.00 P.M. - 16.00 P.M.",
      instructor: "Michael Brown",
    },
  ];

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
