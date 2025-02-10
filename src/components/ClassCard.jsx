import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const ClassCard = ({ classObject }) => {
    // Helper to check if current time is within the specified range
    const { user, token } = useSelector((state) => state.auth);
    useEffect(() => {
        try {
            if (!user || !user.student_id) {
                console.error("User information is missing in localStorage.");
                return;
            }
        } catch (error) {
            console.error(error)
        }
    }, []);

    const isCurrentTimeInRange = () => {
        try {
            // Extract start and end times in HH:mm format
            const { start_time, end_time } = classObject.schedule;

            const parseTime = (time) => {
                const [hours, minutes] = time.split(":").map((part) => parseInt(part, 10));
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



    return (
        <div className="w-full h-32 rounded-xl p-4 shadow-custom flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                    <p className="text-sm text-gray-600">CLASS</p>
                    <p className={`text-sm uppercase ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                    </p>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <h5 className="text-xl font-bold truncate">{classObject.class_name}</h5>
                    <p className="text-sm whitespace-nowrap">{classObject.schedule.start_time} - {classObject.schedule.end_time}</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end">
                <div className="flex gap-1">
                    {classObject.teacher_ids.map((teacher) => (
                        <p className="text-sm text-gray-600">{teacher.first_name} {teacher.last_name}</p>
                    ))}
                </div>
                <div className="flex gap-2">

                    <Link
                        to={`/facescan/${classObject._id}`}
                        className={`${isActive
                            ? "bg-teal-700 hover:bg-teal-800"
                            : "bg-gray-300 cursor-not-allowed"
                            } text-white text-xs font-semibold py-1 px-3 rounded flex justify-center items-center`}
                        style={{ pointerEvents: isActive ? "auto" : "none" }} // Prevents clicking if disabled
                    >
                        Check In
                    </Link>

                    <button
                        className="border border-teal-700 text-teal-700 text-xs font-semibold py-1 px-3 rounded"
                    >
                        Note
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassCard;
