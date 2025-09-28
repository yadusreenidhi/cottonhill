const apiURL = "https://script.google.com/macros/s/AKfycbz90Y4NGft2IFuYwcrYLpl7bnSXaepJ6jpdrhihv_UCaLgBUwSYciPrYIORSNHvJplJ/exec";
const leaderboardDiv = document.getElementById("leaderboard");

let results = [];
let globalCategory = "HS";  // Selected global category
let searchTerm = "";         // Event search term

// Helper: generate safe ID for HTML elements
function sanitizeID(str) {
  return str.replace(/\s+/g, '_').replace(/[^\w]/g, '');
}

// Fetch data from Google Sheet API
async function fetchResults() {
  try {
    // Add timestamp to prevent caching
    const response = await fetch(apiURL + "?timestamp=" + new Date().getTime());
    results = await response.json();

    if (!results || results.length === 0) {
      leaderboardDiv.innerHTML = "No results found.";
      return;
    }

    displayAllEventTables();
  } catch (error) {
    leaderboardDiv.innerHTML = "⚠️ Error loading results";
    console.error(error);
  }
}

// Get unique events for current category and search
function getFilteredEvents() {
  return [...new Set(
    results
      .filter(r => r["Category"] === globalCategory)
      .filter(r => r["Event Type"].toLowerCase().includes(searchTerm.toLowerCase()))
      .map(r => r["Event Type"])
  )];
}

// Display all event tables
function displayAllEventTables() {
  const events = getFilteredEvents();
  if (events.length === 0) {
    leaderboardDiv.innerHTML = "No events found for this category/search.";
    return;
  }

  let html = "";

  events.forEach(eventType => {
    const tableID = `table-${sanitizeID(eventType)}`;
    html += `<div class="event-section">
      <h2>${eventType} Results</h2>
      <div id="${tableID}">Loading...</div>
    </div>`;
  });

  leaderboardDiv.innerHTML = html;

  // Display table for each event
  events.forEach(eventType => {
    displayTable(eventType);
  });
}

// Display table for a given event
function displayTable(eventType) {
  const tableDiv = document.getElementById(`table-${sanitizeID(eventType)}`);
  if (!tableDiv) return;

  let filtered = results.filter(
    r => r["Event Type"] === eventType && r["Category"] === globalCategory
  );

  if (filtered.length === 0) {
    tableDiv.innerHTML = "No results for this event in this category.";
    return;
  }

  // Sort by RANK ascending (empty ranks at the end)
  filtered.sort((a, b) => {
    const rankA = Number(a["RANK"]) || 999;
    const rankB = Number(b["RANK"]) || 999;
    return rankA - rankB;
  });

  let table = `<table>
    <tr><th>Position</th><th>Name of Student</th><th>Class</th><th>Admission No</th></tr>`;

  filtered.forEach(row => {
    let rowClass = "";
    if (Number(row["RANK"]) === 1) rowClass = "top1";
    else if (Number(row["RANK"]) === 2) rowClass = "top2";

    table += `<tr class="${rowClass}">
      <td>${row["RANK"] || '-'}</td>
      <td>${row["Participant"]}</td>
      <td>${row["Class"]}</td>
      <td>${row["Ad no"]}</td>
    </tr>`;
  });

  table += "</table>";
  tableDiv.innerHTML = table;
}

// Update global category when button clicked
function updateGlobalCategory(category) {
  globalCategory = category;

  // Highlight active button
  document.querySelectorAll("#globalCategoryButtons button").forEach(btn => {
    btn.classList.remove("active");
    if (btn.textContent === category) btn.classList.add("active");
  });

  displayAllEventTables();
}

// Update search term when typing
function updateEventSearch() {
  searchTerm = document.getElementById("eventSearchInput").value;
  displayAllEventTables();
}

// Initial fetch
fetchResults();
setInterval(fetchResults, 10000); // Auto-refresh every 10 seconds
