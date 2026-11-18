
// Display today's date
//let today = new Date();

//document.getElementById("date").textContent =
//    today.toDateString();


//
    let currentSelectedPeriod = 1;
//
    
    document.addEventListener("DOMContentLoaded", () => {
        // Display current date in <h2 id="date">
        const dateElement = document.getElementById("date");
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    
        // Load Period 1 by default on page load
        showPeriod(1);
    
        // Automatically refresh the table if the Student tab updates localStorage
        window.addEventListener("storage", (event) => {
            if (event.key === "hallPassRecords") {
                showPeriod(currentSelectedPeriod);
            }
        });
    });
    
    // Exposed globally so onclick="showPeriod(1)" in teacher.html works
    function showPeriod(periodNumber) {
        currentSelectedPeriod = periodNumber;
    
        const periodTitle = document.getElementById("periodTitle");
        const tableBody = document.getElementById("recordsTable");
    
        periodTitle.textContent = `Period ${periodNumber} Records`;
        tableBody.innerHTML = "";
    
        const todayString = new Date().toISOString().split("T")[0];
        const allRecords = JSON.parse(localStorage.getItem("hallPassRecords")) || [];
    
        // Filter records for today and the selected period
        const filteredRecords = allRecords.filter(
            (record) => record.date === todayString && record.period === periodNumber
        );
    
        if (filteredRecords.length === 0) {
            const emptyRow = document.createElement("tr");
            emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">No sign-out records for Period ${periodNumber} today.</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }
    
        // Populate table rows
        filteredRecords.forEach((record) => {
            const row = document.createElement("tr");
    
            const statusColor = record.status === "Out" ? "red" : "green";
    
            row.innerHTML = `
                <td>${escapeHTML(record.studentName)}</td>
                <td>${escapeHTML(record.studentNumber)}</td>
                <td>${record.signOutTime}</td>
                <td>${record.signInTime}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${record.status}</td>
            `;
    
            tableBody.appendChild(row);
        });
    }
    
    // Prevent HTML injection from text inputs
    function escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }