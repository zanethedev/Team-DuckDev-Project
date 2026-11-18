document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("studentName");
    const numberInput = document.getElementById("studentNumber");
    const buttons = document.querySelectorAll("form button");

    // Assign buttons based on their order in your HTML (0 = Sign In, 1 = Sign Out)
    const signOutBtn = buttons[0];
    const signInBtn = buttons[1];

    // Create a status message element below the form for user feedback
    const feedbackMsg = document.createElement("p");
    feedbackMsg.style.fontWeight = "bold";
    document.querySelector("form").appendChild(feedbackMsg);

    // Helper: Determine current period based on time of day (24-hour clock)
    // Adjust these times to match your school's actual bell schedule
    function getCurrentPeriod(dateObj) {
        const totalMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

        if (totalMinutes >= 480 && totalMinutes < 570) return 1;  // 8:00 AM - 9:30 AM
        if (totalMinutes >= 570 && totalMinutes < 660) return 2;  // 9:30 AM - 11:00 AM
        if (totalMinutes >= 660 && totalMinutes < 780) return 3;  // 11:00 AM - 1:00 PM
        if (totalMinutes >= 780 && totalMinutes < 900) return 4;  // 1:00 PM - 3:00 PM

        return 1; // Default fallback to Period 1 outside school hours
    }

    // Helper: Format timestamp cleanly (e.g., "2:16:05 PM")
    function formatTime(dateObj) {
        return dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    // Helper: Format today's date (e.g., "2026-11-18")
    function getTodayDateString(dateObj) {
        return dateObj.toISOString().split("T")[0];
    }

    // Helper: Load existing records from localStorage
    function getRecords() {
        const data = localStorage.getItem("hallPassRecords");
        return data ? JSON.parse(data) : [];
    }

    // Helper: Save updated records to localStorage
    function saveRecords(records) {
        localStorage.setItem("hallPassRecords", JSON.stringify(records));
    }

    // Helper: Validate inputs and show messages
    function validateInputs() {
        const name = nameInput.value.trim();
        const number = numberInput.value.trim();

        if (!name || !number) {
            showFeedback("Please enter both your Student Name and Student Number.", "red");
            return null;
        }
        return { name, number };
    }

    function showFeedback(message, color) {
        feedbackMsg.textContent = message;
        feedbackMsg.style.color = color;
    }

    // ACTION 1: Student Signs Out (Leaving class)
    signOutBtn.addEventListener("click", () => {
        const student = validateInputs();
        if (!student) return;

        const now = new Date();
        const today = getTodayDateString(now);
        const records = getRecords();

        // Check if this student is ALREADY signed out and hasn't returned yet
        const activeRecord = records.find(
            (r) =>
                r.studentNumber === student.number &&
                r.date === today &&
                r.status === "Out"
        );

        if (activeRecord) {
            showFeedback(
                `${student.name} is already signed out (since ${activeRecord.signOutTime}). Please Sign In first.`,
                "orange"
            );
            return;
        }

        const currentPeriod = getCurrentPeriod(now);

        const newRecord = {
            id: Date.now(),
            date: today,
            period: currentPeriod,
            studentName: student.name,
            studentNumber: student.number,
            signOutTime: formatTime(now),
            signInTime: "—",
            status: "Out"
        };

        records.push(newRecord);
        saveRecords(records);

        showFeedback(
            `Signed OUT: ${student.name} (Period ${currentPeriod} at ${newRecord.signOutTime})`,
            "green"
        );
        nameInput.value = "";
        numberInput.value = "";
    });

    // ACTION 2: Student Signs In (Returning to class)
    signInBtn.addEventListener("click", () => {
        const student = validateInputs();
        if (!student) return;

        const now = new Date();
        const today = getTodayDateString(now);
        const records = getRecords();

        // Find the student's open "Out" record for today
        const activeRecord = records.find(
            (r) =>
                r.studentNumber === student.number &&
                r.date === today &&
                r.status === "Out"
        );

        if (!activeRecord) {
            showFeedback(
                `No active sign-out found for Student #${student.number}. Please Sign Out when leaving.`,
                "red"
            );
            return;
        }

        // Update the existing record with Sign-In time and status
        activeRecord.signInTime = formatTime(now);
        activeRecord.status = "Returned";

        saveRecords(records);

        showFeedback(
            `Welcome back, ${activeRecord.studentName}! Signed IN at ${activeRecord.signInTime}.`,
            "green"
        );
        nameInput.value = "";
        numberInput.value = "";
    });
});