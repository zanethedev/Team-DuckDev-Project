
import { db } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let currentSelectedPeriod = 1;
let allRecords = [];

document.addEventListener("DOMContentLoaded", () => {

    // Display today's date
    const dateElement = document.getElementById("date");
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    // Get today's date in YYYY-MM-DD format
    const todayString =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Load today's records from Firestore
    const recordsQuery = query(
        collection(db, "hallPassRecords"),
        where("date", "==", todayString)
    );

    // Automatically update when records change
    onSnapshot(recordsQuery, (snapshot) => {

        allRecords = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        showPeriod(currentSelectedPeriod);

    }, (error) => {
        console.error("Error loading records:", error);

        const tableBody = document.getElementById("recordsTable");
        tableBody.innerHTML = "";

        const errorRow = document.createElement("tr");
        const errorCell = document.createElement("td");

        errorCell.colSpan = 5;
        errorCell.textContent = "Unable to load records. Please try again.";

        errorRow.appendChild(errorCell);
        tableBody.appendChild(errorRow);
    });

});

// Display records for the selected period
function showPeriod(periodNumber) {

    currentSelectedPeriod = periodNumber;

    const periodTitle = document.getElementById("periodTitle");
    const tableBody = document.getElementById("recordsTable");

    periodTitle.textContent = `Period ${periodNumber} Records`;
    tableBody.innerHTML = "";

    // Filter records for the selected period
    const filteredRecords = allRecords.filter(
        record => record.period === periodNumber
    );

    if (filteredRecords.length === 0) {

        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");

        emptyCell.colSpan = 5;
        emptyCell.style.textAlign = "center";
        emptyCell.textContent =
            `No sign-out records for Period ${periodNumber} today.`;

        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);

        return;
    }

    // Populate table rows
    filteredRecords.forEach(record => {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = record.studentName;

        const numberCell = document.createElement("td");
        numberCell.textContent = record.studentNumber;

        const signOutCell = document.createElement("td");
        signOutCell.textContent = record.signOutTime;

        const signInCell = document.createElement("td");
        signInCell.textContent = record.signInTime;

        const statusCell = document.createElement("td");
        statusCell.textContent = record.status;
        statusCell.style.color =
            record.status === "Out" ? "red" : "green";
        statusCell.style.fontWeight = "bold";

        row.appendChild(nameCell);
        row.appendChild(numberCell);
        row.appendChild(signOutCell);
        row.appendChild(signInCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);
    });
}

// Make showPeriod available to the HTML onclick buttons
window.showPeriod = showPeriod;
