import { db } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Teacher login password
const TEACHER_PASSWORD = "lemmein";

let currentSelectedPeriod = 1;
let allRecords = [];

document.addEventListener("DOMContentLoaded", () => {

    // Handle teacher login
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("teacherPassword");
    const loginMessage = document.getElementById("loginMessage");

    // Check if teacher has already logged in
    if (sessionStorage.getItem("teacherLoggedIn") === "true") {
        document.getElementById("loginSection").hidden = true;
        document.getElementById("dashboardSection").hidden = false;
        loadDashboard();
    }

    // Handle teacher login
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (passwordInput.value === TEACHER_PASSWORD) {

            sessionStorage.setItem("teacherLoggedIn", "true");

            document.getElementById("loginSection").hidden = true;
            document.getElementById("dashboardSection").hidden = false;

            loginMessage.textContent = "";

            loadDashboard();

        } else {
            loginMessage.textContent = "Incorrect password. Please try again.";
            passwordInput.value = "";
        }
    });

});

// Load the teacher dashboard
function loadDashboard() {

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

        errorCell.colSpan = 6;
        errorCell.textContent = "Unable to load records. Please try again.";

        errorRow.appendChild(errorCell);
        errorRow.appendChild(errorCell);
        tableBody.appendChild(errorRow);
    });
}

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

        emptyCell.colSpan = 6;
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

                // Create Edit and Delete buttons
        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editRecord(
                record.id,
                record.studentName,
                record.studentNumber,
                record.signOutTime,
                record.signInTime
            );
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteRecord(record.id);
        });

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        row.appendChild(nameCell);
        row.appendChild(numberCell);
        row.appendChild(signOutCell);
        row.appendChild(signInCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}
// Update an existing record
async function editRecord(recordId, newName, newNumber, newOutTime, newInTime) {
    try {
        await updateDoc(doc(db, "hallPassRecords", recordId), {
            studentName: newName,
            studentNumber: newNumber,
            signOutTime: newOutTime,
            signInTime: newInTime
        });

        alert("Record updated successfully!");

    } catch (error) {
        console.error(error);
        alert("Could not update record.");
    }
}

// Delete an existing record
async function deleteRecord(recordId) {
    if (!confirm("Are you sure you want to delete this record?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "hallPassRecords", recordId));

        alert("Record deleted successfully!");

    } catch (error) {
        console.error(error);
        alert("Could not delete record.");
    }
}

// Make showPeriod available to the HTML buttons
window.showPeriod = showPeriod;

