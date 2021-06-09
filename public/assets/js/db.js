//initialize db and create new db request for 'budget db'
let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("pending", { 
    keyPath: "id",
    autoIncrement: true 
  });
};

request.onsuccess = (event) => {
  db = event.target.result;

  // check if app online
  if (navigator.onLine) {
    checkDatabase();
  }
};

//provide for error
request.onerror = (event) => {
  console.log("There seems to be an error " + event.target.errorCode);
};

//if fetch fails, saveRecord will be called to save trasnsaction 
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction("pending", "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

//function called when app goes back online
function checkDatabase() {
  const transaction = db.transaction("pending", "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  //post all pending transactions stored in indexedDB to online database
  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, empty stored transactions from indexedDB
        const transaction = db.transaction("pending", "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

//lastly, listen for app coming back online
window.addEventListener("online", checkDatabase);