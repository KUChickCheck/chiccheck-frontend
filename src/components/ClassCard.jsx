import React, { useState } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../utilities/api";

const ClassCard = ({ classObject }) => {
  // Helper to check if current time is within the specified range
  const { user, token } = useSelector((state) => state.auth);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!user || !user.student_id) {
        console.error("User information is missing in localStorage.");
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const isCurrentTimeInRange = () => {
    try {
      // Extract start and end times in HH:mm format
      const { start_time, end_time } = classObject.schedule;

      const parseTime = (time) => {
        const [hours, minutes] = time
          .split(":")
          .map((part) => parseInt(part, 10));
        return hours * 60 + minutes; // Convert to minutes
      };

      const startMinutes = parseTime(start_time);
      const endMinutes = parseTime(end_time);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } catch (error) {
      console.error("Error parsing time:", error.message);
      return false; // Default to false if an error occurs
    }
  };

  const isActive = isCurrentTimeInRange();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const currentDate = new Date().toISOString();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/attendance/note`, {
        student_id: user._id,
        class_id: classObject.class_id,
        date: currentDate,
        note_text: note
      });
    } catch (error) {
      console.error("Error add note:", error);
    }
    handleClose();
    setNote("");
  };

  return (
    <div className="w-full h-32 rounded-xl p-4 shadow-custom flex flex-col justify-between">
      {/* Top Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">CLASS</p>
          <p
            className={`text-sm uppercase ${
              isActive && classObject.status === "Not checked"
                ? "text-green-600"
                : !isActive && classObject.status === "Not checked"
                ? "text-red-600"
                : classObject.status === "Late"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {isActive && classObject.status === "Not checked"
              ? "ACTIVE"
              : !isActive && classObject.status === "Not checked"
              ? "INACTIVE"
              : classObject.status}
          </p>
        </div>
        <div className="flex justify-between items-center gap-4">
          <h5 className="text-xl font-bold truncate">
            {classObject.class_name}
          </h5>
          <p className="text-sm whitespace-nowrap">
            {classObject.schedule.start_time} - {classObject.schedule.end_time}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-end">
        <div className="flex gap-1">
          {classObject.teachers.map((teacher, index) => (
            <p key={index} className="text-sm text-gray-600">{teacher.name}, </p>
          ))}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/facescan/${classObject.class_id}`}
            className={`${
              isActive && classObject.status === "Not checked"
                ? "bg-teal-700 hover:bg-teal-800"
                : "bg-gray-300 cursor-not-allowed"
            } text-white text-xs font-semibold py-1 px-3 rounded flex justify-center items-center`}
            style={{
              pointerEvents:
                isActive && classObject.status === "Not checked"
                  ? "auto"
                  : "none",
            }} // Prevents clicking if disabled
          >
            Check In
          </Link>

          <button
            className="border border-teal-700 text-teal-700 text-xs font-semibold py-1 px-3 rounded"
            onClick={handleOpen}
          >
            Note
          </button>
          {/* Modal (shown only when open is true) */}
          {open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-6">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                {/* Modal Title */}
                <h2 className="text-lg font-semibold text-gray-900">
                  Note for any reason
                </h2>
                <p className="text-gray-600">
                  {user.student_id} {user.first_name} {user.last_name}
                </p>
                <p className="text-gray-600">
                  Class: {classObject.class_name}
                </p>

                {/* Input Field */}
                <input
                  type="text"
                  className="w-full mt-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="write your reason..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
