import React from "react";

const ReportCard = ({ icon, status, amount }) => {
  return (
    <div className="flex items-center justify-between bg-primary p-4 rounded-lg border border-black w-full h-24">
      <div className="flex-shrink-0">
        <img src={icon} alt="Icon" className="h-16 w-16" />
      </div>
      <div className="w-3/5 text-center">
        <h3 className="text-white text-2xl font-bold">{amount}</h3>
        <p className="text-white text-sm font-light">{status}</p>
      </div>
    </div>
  );
};

export default ReportCard;
