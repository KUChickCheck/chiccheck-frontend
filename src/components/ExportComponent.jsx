import React from "react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, FileSpreadsheet } from "lucide-react";

const ExportComponent = ({ selectedClass, selectedDate, attendanceList, startTime }) => {
    const generatePDF = () => {
        const doc = new jsPDF({ orientation: "landscape" }); // Use landscape mode for better readability
    
        // Title of the document
        doc.text("Attendance Report", 14, 10);
        doc.text(`Date: ${selectedDate ? selectedDate.format("YYYY-MM-DD") : "N/A"}`, 14, 24);
    
        // Validate `attendanceList`
        if (!attendanceList || attendanceList.length === 0) {
            doc.text("No attendance records available", 14, 40);
        } else {
            // Attendance Table
            const tableData = attendanceList.map((student) => {
                let lateText = "";
                let lateMinutes = null;
                
                if (student.status === "Late" && student.timestamp) {
                    // Assuming `startTime` is available as a string "HH:MM" (you can adjust this as per your logic)
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
    
                // Format the student data, including the late time if applicable
                return [
                    student.student_id,
                    student.first_name,
                    student.last_name,
                    student.status,
                    student.timestamp
                        ? new Date(student.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + lateText
                        : "-",
                    student.location_status === "Unknown" ? "-" : student.location_status === "Outlier" ? "Out of Class" : "In Class",
                    // student.location_status === "Unknown"
                    //     ? "-"
                    //     : `https://www.google.com/maps?q=${student.location.latitude},${student.location.longitude}`
                ];
            });
    
            autoTable(doc, {
                startY: 40,
                head: [["Student ID", "First Name", "Last Name", "Status", "Timestamp","Location Status"]],
                body: tableData,
                styles: {
                    fontSize: 10, // Adjust font size for better readability
                    cellPadding: 2, // Reduce padding to fit more data
                },
                columnStyles: {
                    0: { cellWidth: "auto" }, // Student ID
                    1: { cellWidth: "auto" }, // First Name
                    2: { cellWidth: "auto" }, // Last Name
                    3: { cellWidth: "auto" }, // Status (Fixed width)
                    4: { cellWidth: "auto" }, // Timestamp
                    5: { cellWidth: "auto" },
                },
            });
        }
    
        doc.save(`${selectedClass}_${selectedDate.format("YYYY-MM-DD")}.pdf`);
    };

    const csvHeaders = [
        { label: "Student ID", key: "student_id" },
        { label: "First Name", key: "first_name" },
        { label: "Last Name", key: "last_name" },
        { label: "Status", key: "status" },
        { label: "Timestamp", key: "timestamp" },
        { label: "Location Status", key: "location_status" },
    ];

    const csvData = attendanceList.map((student) => {
        let lateText = "";
        let lateMinutes = null;
    
        if (student.status === "Late" && student.timestamp) {
            // Assuming `startTime` is available as a string "HH:MM" (you can adjust this as per your logic)
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
    
        return {
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            status: student.status,
            timestamp: student.timestamp
                ? new Date(student.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + lateText
                : "-",
            location_status: student.location_status === "Unknown" ? "-" : student.location_status === "Outlier" ? "Out of Class" : "In Class",
            // location: student.location_status === "Unknown"
            //     ? "-"
            //     : `https://www.google.com/maps?q=${student.location.latitude},${student.location.longitude}`
        };
    });
    

    return (
        <div className="flex gap-4">
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`${selectedClass}_${selectedDate.format("YYYY-MM-DD")}.csv`}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
            >
                <FileSpreadsheet size={20} />
                Export CSV
            </CSVLink>
            <button
                onClick={generatePDF}
                className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700"
            >
                <FileText size={20} />
                Export PDF
            </button>
        </div>
    );
};

export default ExportComponent;
