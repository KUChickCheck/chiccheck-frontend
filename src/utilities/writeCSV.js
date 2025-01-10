/**
 * Writes an array of objects to a CSV file and triggers a download in the browser.
 * @param {Array} data - Array of objects to be written to CSV.
 * @param {string} filename - The name of the CSV file to download.
 */
 export const writeCSVBrowser = (data, filename) => {
    if (!data || data.length === 0) {
      console.error("No data provided for CSV.");
      return;
    }
  
    // Extract headers from the first object
    const headers = Object.keys(data[0]);
  
    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map((row) => headers.map((key) => row[key]).join(",")), // Data rows
    ].join("\n");
  
    // Create a Blob with CSV content
    const blob = new Blob([csvContent], { type: "text/csv" });
  
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  
    console.log(`CSV file "${filename}" created and downloaded.`);
  };
  