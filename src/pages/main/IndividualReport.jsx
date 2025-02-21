import React from "react";
import ReportCard from "../../components/ReportCard";
import HeaderComponent from "../../components/Header";
import api from "../../utilities/api";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const IndividualReport = () => {
    const { user } = useSelector((state) => state.auth);
    const [classes, setClasses] = useState([])
    const [report, setReport] = useState([
        { icon: "calendar-days.svg", status: "Total Class", amount: 0 },
        { icon: "circle-check-big.svg", status: "On Time", amount: 0 },
        { icon: "clock-alert.svg", status: "Late", amount: 0 },
        { icon: "circle-x.svg", status: "Absent", amount: 0 },
    ])
    
    const [selectedClass, setSelectedClass] = useState('');

    const handleChange = async (e) => {
        const class_id = e.target.value
        if (class_id === "none" || !class_id) {
            const items = [
                { icon: "calendar-days.svg", status: "Total Class", amount: 0 },
                { icon: "circle-check-big.svg", status: "On Time", amount: 0 },
                { icon: "clock-alert.svg", status: "Late", amount: 0 },
                { icon: "circle-x.svg", status: "Absent", amount: 0 },
            ];
            setReport(items)
            return;
        }
        setSelectedClass(class_id); // Get the value of the selected option

        try {
            const response = await api.get(`/attendance/report/${user._id}/${class_id}`)
            const items = [
                { icon: "calendar-days.svg", status: "Total Class", amount: response.report.total_classes },
                { icon: "circle-check-big.svg", status: "On Time", amount: response.report.ontime },
                { icon: "clock-alert.svg", status: "Late", amount: response.report.late },
                { icon: "circle-x.svg", status: "Absent", amount: response.report.absent },
            ];
            setReport(items)
        } catch (e) {
            console.error(e)
        }
    };

    const getClassesName = async () => {
        try {
            const response = await api.get(`/student/enrolled/${user._id}`)
            setClasses(response)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        getClassesName()
    }, []);
    return (
        <div className="container mx-auto w-full max-w-md h-screen flex flex-col gap-4 px-4">
            {/* Header */}
            <HeaderComponent title={"Report"} />
            <div>
                <div className="select-wrapper">
                    <select
                        className="text-primary bg-white border border-gray-300 rounded-md py-2 px-4 w-full font-bold text-xl"
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
                <div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {report.map((item) => (
                            <ReportCard key={item.status} icon={item.icon} status={item.status} amount={item.amount} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualReport;
