const socket = io();

socket.on("connect", () => {
    console.log("LIVE connection established");
});

socket.on("dashboard_update", (data) => {
    updateDashboard(data);
    document.querySelector(".live-pill").innerHTML = "<i></i> LIVE";
});

socket.on("disconnect", () => {
    document.querySelector(".live-pill").innerHTML = "<i style='background:#ff4b4b'></i> OFFLINE";
});
