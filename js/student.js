import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("studentName");
    const numberInput = document.getElementById("studentNumber");
    const buttons = document.querySelectorAll("form button");

    const signOutBtn = buttons[0];
    const signInBtn = buttons[1];

    const feedbackMsg = document.createElement("p");
    feedbackMsg.style.fontWeight = "bold";
    document.querySelector("form").appendChild(feedbackMsg);

    function getCurrentPeriod(dateObj) {
        const totalMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

        if (totalMinutes >= 505 && totalMinutes < 580) return 1;
        if (totalMinutes >= 583 && totalMinutes < 658) return 2;
        if (totalMinutes >= 733 && totalMinutes < 808) return 3;
        if (totalMinutes >= 811 && totalMinutes < 886) return 4;

        return 1;
    }

    function formatTime(dateObj) {
        return dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getTodayDateString(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function validateInputs() {
        const name = nameInput.value.trim();
        const number = numberInput.value.trim();

        if (!name || !number) {
            showFeedback("Please enter both your Student Name and Student Number.", "red");
            return null;
        }

        if (!/^\d{6,7}$/.test(number)) {
            showFeedback("Student Number must be valid.", "red");
            return null;
        }

        return { name, number };
    }

    function showFeedback(message, color) {
        feedbackMsg.textContent = message;
        feedbackMsg.style.color = color;
    }

    async function getTodaysRecords(today) {
        const recordsQuery = query(
            collection(db, "hallPassRecords"),
            where("date", "==", today)
        );

        const snapshot = await getDocs(recordsQuery);

        return snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));
    }

    // STUDENT SIGNS OUT
    signOutBtn.addEventListener("click", async () => {
        const student = validateInputs();
        if (!student) return;

        try {
            const now = new Date();
            const today = getTodayDateString(now);
            const records = await getTodaysRecords(today);

            const activeRecord = records.find(
                record =>
                    record.studentNumber === student.number &&
                    record.status === "Out"
            );

            if (activeRecord) {
                showFeedback(
                    `${student.name} is already signed out (since ${activeRecord.signOutTime}). Please Sign In first.`,
                    "orange"
                );
                return;
            }

            const currentPeriod = getCurrentPeriod(now);

            await addDoc(collection(db, "hallPassRecords"), {
                date: today,
                period: currentPeriod,
                studentName: student.name,
                studentNumber: student.number,
                signOutTime: formatTime(now),
                signInTime: "—",
                status: "Out"
            });

            showFeedback(
                `Signed OUT: ${student.name} (Period ${currentPeriod} at ${formatTime(now)})`,
                "green"
            );

        } catch (error) {
            console.error(error);
            showFeedback("Could not save your sign-out. Please try again.", "red");
        }
    });

    // STUDENT SIGNS IN
    signInBtn.addEventListener("click", async () => {
        const student = validateInputs();
        if (!student) return;

        try {
            const now = new Date();
            const today = getTodayDateString(now);
            const records = await getTodaysRecords(today);

            const activeRecord = records.find(
                record =>
                    record.studentNumber === student.number &&
                    record.status === "Out"
            );

            if (!activeRecord) {
                showFeedback(
                    `No active sign-out found for Student #${student.number}. Please Sign Out when leaving.`,
                    "red"
                );
                return;
            }

            const recordRef = doc(db, "hallPassRecords", activeRecord.id);

            await updateDoc(recordRef, {
                signInTime: formatTime(now),
                status: "Returned"
            });

            showFeedback(
                `Welcome back, ${activeRecord.studentName}! Signed IN at ${formatTime(now)}.`,
                "green"
            );

        } catch (error) {
            console.error(error);
            showFeedback("Could not save your sign-in. Please try again.", "red");
        }
    });
});
