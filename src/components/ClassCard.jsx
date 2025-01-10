import React from "react";

const ClassCard = ({ classObject }) => {
  return (
    <div className="w-full h-32 rounded-xl p-4 shadow-custom flex flex-col justify-between">
      {/* Top Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">CLASS</p>
          <p className={`text-sm uppercase ${classObject.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            {classObject.status}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="text-xl font-bold">{classObject.className}</h5>
          <p className="text-sm">{classObject.time}</p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-end">
        <p className="text-sm text-gray-600">{classObject.instructor}</p>
        <div className="flex gap-2">
          <button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-1 px-3 rounded">
            Check In
          </button>
          <button className="border border-teal-700 text-teal-700 text-xs font-semibold py-1 px-3 rounded">
            Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
