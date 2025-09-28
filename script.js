const apiURL = "https://script.google.com/macros/s/AKfycbz90Y4NGft2IFuYwcrYLpl7bnSXaepJ6jpdrhihv_UCaLgBUwSYciPrYIORSNHvJplJ/exec";
const leaderboardDiv = document.getElementById("leaderboard");

let results = [];
let selectedCategory = {}; // track selected category per event

// Helper: generate safe ID for HTML elements
function sanitizeID(str) {
  return str.replace(/\s+/g, '_').replace(/[^\w]/g, '');
}

// Fetch data from Google Sheet API
async function fetchResults() {
  try {
    const response = await fetch(apiURL);
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

// Get unique event types from results
function getUniqueEvents() {
  return [...new Set(results.map(r => r["Event Type"]))];
}

// Display all event tables with category buttons (HS/HSS/UP only)
function displayAllEventTables() {
  const events = getUniqueEvents();
  if (events.length === 0) {
    leaderboardDiv.innerHTML = "No events found.";
    return;
  }

  let html = "";

  events.forEach(eventType => {
    const tableID = `table-${sanitizeID(eventType)}`;
    html += `<div class="event-section">
      <h2>${eventType} Results</h2>
      <div class="category-buttons">
        <button onclick="updateCategory('${eventType}','HS')">HS</button>
        <button onclick="updateCategory('${eventType}','HSS')">HSS</button>
        <button onclick="updateCategory('${eventType}','UP')">UP</button>
      </div>
      <div id="${tableID}">Loading...</div>
    </div>`;

    // Initialize selected category if not already
    if (!selectedCategory[eventType]) selectedCategory[eventType] = "HS";
  });

  leaderboardDiv.innerHTML = html;

  // Display table for each event using its selected category
  events.forEach(eventType => {
    displayTable(eventType, selectedCategory[eventType]);
    highlightActiveButton(eventType, selectedCategory[eventType]);
  });
}

// Update the selected category for an event and refresh its table
function updateCategory(eventType, category) {
  selectedCategory[eventType] = category;
  displayTable(eventType, category);
  highlightActiveButton(eventType, category);
}

// Highlight the active category button for an event
function highlightActiveButton(eventType, category) {
  const section = document.querySelector(`#table-${sanitizeID(eventType)}`).parentElement;
  section.querySelectorAll(".category-buttons button").forEach(btn => {
    btn.classList.remove("active");
  });
  const activeBtn = section.querySelector(`.category-buttons button[onclick="updateCategory('${eventType}','${category}')"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

// Display table for a given event and category (only top 2 positions)
function displayTable(eventType, category) {
  const tableDiv = document.getElementById(`table-${sanitizeID(eventType)}`);
  if (!tableDiv) return;

  let filtered = results.filter(
    r => r["Event Type"] === eventType && r["Category"] === category
  );

  // Show only top 2 positions
  filtered = filtered.filter(r => Number(r["RANK"]) <= 2);

  if (filtered.length === 0) {
    tableDiv.innerHTML = "No results for this category.";
    return;
  }

  // Sort by RANK ascending
  filtered.sort((a, b) => Number(a["RANK"]) - Number(b["RANK"]));

  let table = `<table>
    <tr><th>Position</th><th>Name of Student</th><th>Class</th><th>Admission No</th></tr>`;

  filtered.forEach(row => {
    let rowClass = "";
    if (Number(row["RANK"]) === 1) rowClass = "top1";
    else if (Number(row["RANK"]) === 2) rowClass = "top2";

    table += `<tr class="${rowClass}">
      <td>${row["RANK"]}</td>
      <td>${row["Participant"]}</td>
      <td>${row["Class"]}</td>
      <td>${row["Ad no"]}</td>
    </tr>`;
  });

  table += "</table>";
  tableDiv.innerHTML = table;
}

// Auto-refresh every 10 seconds while preserving selected categories
fetchResults();
setInterval(fetchResults, 10000);
