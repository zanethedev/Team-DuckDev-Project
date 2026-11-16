
// Display today's date
let today = new Date();

document.getElementById("date").textContent =
    today.toDateString();


// Temporary sample records
let records = [
    {
        name: "John Smith",
        number: "123456",
        period: 1,
        out: "9:15 AM",
        back: "9:25 AM"
    },
    {
        name: "Jane Doe",
        number: "654321",
        period: 1,
        out: "9:20 AM",
        back: ""
    },
    {
        name: "Alex Brown",
        number: "456789",
        period: 2,
        out: "10:30 AM",
        back: "10:40 AM"
    }
];


// Display records for selected period
function showPeriod(period) {

    let table = document.getElementById("recordsTable");

    document.getElementById("periodTitle").textContent =
        "Period " + period + " Records";

    table.innerHTML = "";

    let filteredRecords = records.filter(function(record) {
        return record.period === period;
    });

    filteredRecords.forEach(function(record) {

        let status = record.back === "" ?
            "Signed Out" : "Returned";

        let row = table.insertRow();

        row.insertCell(0).textContent = record.name;
        row.insertCell(1).textContent = record.number;
        row.insertCell(2).textContent = record.out;
        row.insertCell(3).textContent = record.back || "";
        row.insertCell(4).textContent = status;

    });

}

// Initially display Period 1
showPeriod(1);

