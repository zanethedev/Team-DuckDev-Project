
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
const TEACHER_PASSWORD = "decagood";

let currentSelectedPeriod = 1;
let allRecords = [];
let editingRecordId = null;
let unsubscribeRecords = null;
let currentSelectedDate = "";

// Format a date as YYYY-MM-DD
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Convert a YYYY-MM-DD date into a readable date
function displayDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

document.addEventListener("DOMContentLoaded", () => {

    // Handle teacher login
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("teacherPassword");
    const loginMessage = document.getElementById("loginMessage");

    // Date history controls
    const historyDate = document.getElementById("historyDate");
    const loadDateButton = document.getElementById("loadDateButton");
    const todayButton = document.getElementById("todayButton");

    const todayString = formatDate(new Date());

    // Allow viewing the past 14 days
    const oldestDate = new Date();
    oldestDate.setDate(oldestDate.getDate() - 13);

    historyDate.min = formatDate(oldestDate);
    historyDate.max = todayString;
    historyDate.value = todayString;

    // View selected date
    loadDateButton.addEventListener("click", () => {
        const selectedDate = historyDate.value;

        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        if (selectedDate < historyDate.min || selectedDate > historyDate.max) {
            alert("Please select a date within the available range.");
            return;
        }

        loadDashboard(selectedDate);
    });

    // Return to today's records
    todayButton.addEventListener("click", () => {
        historyDate.value = todayString;
        loadDashboard(todayString);
    });

    // Check if teacher has already logged in
    if (localStorage.getItem("teacherLoggedIn") === "true") {
        document.getElementById("loginSection").hidden = true;
        document.getElementById("dashboardSection").hidden = false;
        loadDashboard(todayString);
    }

    // Handle teacher login
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (passwordInput.value === TEACHER_PASSWORD) {

            localStorage.setItem("teacherLoggedIn", "true");

            document.getElementById("loginSection").hidden = true;
            document.getElementById("dashboardSection").hidden = false;

            loginMessage.textContent = "";

            historyDate.value = todayString;
            loadDashboard(todayString);

        } else {
            loginMessage.textContent = "Incorrect password. Please try again.";
            passwordInput.value = "";
        }
    });

    // Save edited record
    document.getElementById("editForm").addEventListener("submit", async (event) => {

        event.preventDefault();

        const newName = document.getElementById("editName").value.trim();
        const newNumber = document.getElementById("editNumber").value.trim();
        const newOutTime = document.getElementById("editOutTime").value.trim();
        const newInTime = document.getElementById("editInTime").value.trim();

        if (!newName || !/^\d{6,7}$/.test(newNumber) || !newOutTime) {
            alert("Please enter a valid name, student number, and sign-out time.");
            return;
        }

        try {
            await updateDoc(doc(db, "hallPassRecords", editingRecordId), {
                studentName: newName,
                studentNumber: newNumber,
                signOutTime: newOutTime,
                signInTime: newInTime || "—",
                status: newInTime ? "Returned" : "Out"
            });

            document.getElementById("editSection").hidden = true;
            editingRecordId = null;

            alert("Record updated successfully!");

        } catch (error) {
            console.error(error);
            alert("Could not update record. Please try again.");
        }
    });

    // Cancel editing
    document.getElementById("cancelEdit").addEventListener("click", () => {

        document.getElementById("editSection").hidden = true;
        editingRecordId = null;

    });

});

// Load dashboard for a specific date
function loadDashboard(dateString) {

    currentSelectedDate = dateString;

    // Display selected date
    const dateElement = document.getElementById("date");
    dateElement.textContent = displayDate(dateString);

    // Stop listening to the previous date
    if (unsubscribeRecords) {
        unsubscribeRecords();
    }

    // Clear previous records
    allRecords = [];
    showPeriod(currentSelectedPeriod);

    // Query Firebase using the selected date
    const recordsQuery = query(
        collection(db, "hallPassRecords"),
        where("date", "==", dateString)
    );

    // Automatically update when Firebase records change
    unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {

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
            `No sign-out records for Period ${periodNumber} on ${displayDate(currentSelectedDate)}.`;

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
        editButton.className = "table-action edit-action";

        editButton.addEventListener("click", () => {

            editingRecordId = record.id;

            document.getElementById("editName").value = record.studentName;
            document.getElementById("editNumber").value = record.studentNumber;
            document.getElementById("editOutTime").value = record.signOutTime;
            document.getElementById("editInTime").value =
                record.signInTime === "—" ? "" : record.signInTime;

            document.getElementById("editSection").hidden = false;

            document.getElementById("editSection").scrollIntoView({
                behavior: "smooth"
            });
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "table-action delete-action";

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
