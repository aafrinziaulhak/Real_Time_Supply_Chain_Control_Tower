let ordersChart, statusChart, warehouseChart, demandChart;

const fmt = n => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));


/* =========================================================
   INITIALIZE CHARTS
========================================================= */

function initCharts() {

    const common = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                labels: {
                    color: "#b9cad7",
                    font: {
                        size: 10
                    }
                }
            }
        },

        scales: {
            x: {
                ticks: {
                    color: "#849bad",
                    font: {
                        size: 9
                    }
                },
                grid: {
                    color: "#123047"
                }
            },

            y: {
                ticks: {
                    color: "#849bad",
                    font: {
                        size: 9
                    }
                },
                grid: {
                    color: "#123047"
                }
            }
        }
    };


    /* =====================================================
       ORDERS OVER TIME
    ===================================================== */

    ordersChart = new Chart(
        document.getElementById("ordersChart"),
        {
            type: "line",

            data: {
                labels: [
                    "12 AM", "1 AM", "2 AM", "3 AM",
                    "4 AM", "5 AM", "6 AM", "7 AM",
                    "8 AM", "9 AM", "10 AM", "11 AM",
                    "12 PM", "1 PM", "2 PM", "3 PM",
                    "4 PM", "5 PM", "6 PM", "7 PM",
                    "8 PM", "9 PM"
                ],

                datasets: [
                    {
                        label: "Orders",
                        data: [],
                        borderColor: "#278dff",
                        backgroundColor: "transparent",
                        tension: 0.35,
                        pointRadius: 2
                    },

                    {
                        label: "Shipments",
                        data: [],
                        borderColor: "#42c84e",
                        backgroundColor: "transparent",
                        tension: 0.35,
                        pointRadius: 2
                    }
                ]
            },

            options: common
        }
    );


    /* =====================================================
       SHIPMENT STATUS
    ===================================================== */

    statusChart = new Chart(
        document.getElementById("statusChart"),
        {
            type: "doughnut",

            data: {
                labels: [
                    "In Transit",
                    "Delivered",
                    "Delayed",
                    "Processing"
                ],

                datasets: [
                    {
                        data: [0, 0, 0, 0],

                        backgroundColor: [
                            "#22c55e",
                            "#2196f3",
                            "#ff4d5a",
                            "#f5b942"
                        ],

                        borderColor: "#061a2a",
                        borderWidth: 2
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );


    /* =====================================================
       WAREHOUSE UTILIZATION
    ===================================================== */

    warehouseChart = new Chart(
        document.getElementById("warehouseChart"),
        {
            type: "doughnut",

            data: {
                labels: [
                    "High",
                    "Medium",
                    "Low"
                ],

                datasets: [
                    {
                        data: [0, 0, 0],

                        backgroundColor: [
                            "#ff4d5a",
                            "#f5b942",
                            "#22c55e"
                        ],

                        borderColor: "#061a2a",
                        borderWidth: 2
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "62%",

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );


    /* =====================================================
       DEMAND PREDICTION
    ===================================================== */

    demandChart = new Chart(
        document.getElementById("demandChart"),
        {
            type: "line",

            data: {
                labels: [
                    "Day 1",
                    "Day 2",
                    "Day 3",
                    "Day 4",
                    "Day 5",
                    "Day 6",
                    "Day 7"
                ],

                datasets: [
                    {
                        label: "Predicted Demand",
                        data: [],

                        borderColor: "#278dff",
                        backgroundColor: "rgba(39,141,255,.08)",

                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }
                ]
            },

            options: common
        }
    );
}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard(d) {

    /* =====================================================
       KPI VALUES
    ===================================================== */

    document.getElementById("totalOrders").textContent =
        fmt(d.total_orders);

    document.getElementById("activeShipments").textContent =
        fmt(d.active_shipments);

    document.getElementById("onTime").textContent =
        d.on_time + "%";

    document.getElementById("delayedOrders").textContent =
        fmt(d.delayed_orders);

    document.getElementById("warehouseCount").textContent =
        fmt(d.warehouses);

    document.getElementById("logisticsCost").textContent =
        "₹" + Number(d.logistics_cost).toFixed(1) + " L";


    /* =====================================================
       SHIPMENT STATUS
    ===================================================== */

    const statusTotal =
        Object.values(d.shipment_status)
            .reduce((a, b) => a + b, 0);

    document.getElementById("statusTotal").textContent =
        fmt(statusTotal);


    const labels = [
        "In Transit",
        "Delivered",
        "Delayed",
        "Processing"
    ];

    const vals = labels.map(
        x => d.shipment_status[x] || 0
    );

    statusChart.data.datasets[0].data = vals;

    statusChart.update("none");


    /* =====================================================
       SHIPMENT STATUS LEGEND
    ===================================================== */

    const statusColors = [
        "#22c55e",
        "#2196f3",
        "#ff4d5a",
        "#f5b942"
    ];

    document.getElementById("statusLegend").innerHTML =
        labels.map((x, i) => `
            <div>
                <span>
                    <i style="
                        display:inline-block;
                        width:8px;
                        height:8px;
                        border-radius:50%;
                        background:${statusColors[i]};
                        margin-right:6px;
                    "></i>
                    ${x}
                </span>

                <span>${fmt(vals[i])}</span>
            </div>
        `).join("");


    /* =====================================================
       TOP ROUTES
    ===================================================== */

    const routeMax =
        Math.max(
            ...d.routes.map(x => x.count),
            1
        );

    document.getElementById("routes").innerHTML =
        d.routes.map(x => `
            <div class="route-row">

                <span>${x.route}</span>

                <div
                    class="route-bar"
                    style="
                        width:${Math.max(
                            18,
                            x.count / routeMax * 100
                        )}%;
                    ">
                </div>

                <b>${x.count}</b>

            </div>
        `).join("");


    /* =====================================================
       INVENTORY ALERTS
    ===================================================== */

    document.getElementById("inventoryAlerts").innerHTML =
        d.inventory.map(x => `

            <div class="inv-row">

                <div class="inv-icon">
                    ${x.status === "Critical" ? "⛔" : "⚠"}
                </div>

                <div>
                    <b>${x.product}</b>
                    <small>${x.warehouse} Warehouse</small>
                </div>

                <div class="stock-cell">

                    <span>
                        Stock: ${x.stock}
                    </span>

                    <br>

                    <span class="${
                        x.status === "Critical"
                            ? "badge-critical"
                            : x.status === "Low Stock"
                                ? "badge-low"
                                : "badge-ok"
                    }">
                        ${x.status}
                    </span>

                </div>

            </div>

        `).join("");


    /* =====================================================
       WAREHOUSE UTILIZATION
    ===================================================== */

    const high =
        d.warehouses_data.filter(
            x => x.utilization > 80
        ).length;

    const med =
        d.warehouses_data.filter(
            x =>
                x.utilization >= 50 &&
                x.utilization <= 80
        ).length;

    const low =
        d.warehouses_data.filter(
            x => x.utilization < 50
        ).length;


    warehouseChart.data.datasets[0].data = [
        high,
        med,
        low
    ];

    warehouseChart.update("none");


    /* =====================================================
       WAREHOUSE LEGEND
       POSITIONED BELOW THE CHART
    ===================================================== */

    const warehouseSummary =
        document.getElementById("warehouseSummary");

    warehouseSummary.innerHTML = `

        <div class="util-summary">

            <div class="util-item">
                <i class="util-dot high-dot"></i>
                <span>High: ${high}</span>
            </div>

            <div class="util-item">
                <i class="util-dot medium-dot"></i>
                <span>Medium: ${med}</span>
            </div>

            <div class="util-item">
                <i class="util-dot low-dot"></i>
                <span>Low: ${low}</span>
            </div>

        </div>
    `;


    /* Force legend below chart */

    warehouseSummary.style.position = "absolute";
    warehouseSummary.style.bottom = "10px";
    warehouseSummary.style.left = "0";
    warehouseSummary.style.width = "100%";
    warehouseSummary.style.display = "flex";
    warehouseSummary.style.justifyContent = "center";
    warehouseSummary.style.zIndex = "5";

    const warehouseParent =
        warehouseSummary.parentElement;

    if (warehouseParent) {
        warehouseParent.style.position = "relative";
    }

    const utilSummary =
        warehouseSummary.querySelector(".util-summary");

    if (utilSummary) {

        utilSummary.style.display = "flex";
        utilSummary.style.justifyContent = "center";
        utilSummary.style.alignItems = "center";
        utilSummary.style.gap = "12px";
        utilSummary.style.fontSize = "10px";
        utilSummary.style.whiteSpace = "nowrap";
    }


    /* =====================================================
       DELAYED SHIPMENTS
    ===================================================== */

    document.getElementById("delayedList").innerHTML =
        d.delayed.map(x => `

            <div class="delay-row">

                <span>
                    <b>${x.shipment_id}</b>
                    <br>
                    ${x.route}
                </span>

                <b>
                    ${Math.floor(x.delay_minutes / 60)}h
                    ${x.delay_minutes % 60}m
                    <br>
                    Delay
                </b>

            </div>

        `).join("");


    /* =====================================================
       RECENT ORDERS
    ===================================================== */

    document.getElementById("recentOrders").innerHTML =
        d.recent.map(x => `

            <tr>

                <td>${x.order_id}</td>

                <td>${x.customer}</td>

                <td>${x.product}</td>

                <td>${x.warehouse}</td>

                <td>${x.quantity}</td>

                <td class="status-${x.status.toLowerCase()}">
                    ${x.status}
                </td>

                <td>${x.order_time}</td>

            </tr>

        `).join("");


    /* =====================================================
       ORDERS OVER TIME
    ===================================================== */

    const base =
        Number(d.total_orders) / 3;

    const series =
        Array.from(
            { length: 22 },
            (_, i) =>
                Math.round(
                    base +
                    i * 55 +
                    Math.sin(i * 0.8) * 250
                )
        );


    ordersChart.data.datasets[0].data =
        series;

    ordersChart.data.datasets[1].data =
        series.map(
            x => Math.round(x * 0.52)
        );

    ordersChart.update("none");


    /* =====================================================
       DEMAND PREDICTION
    ===================================================== */

    demandChart.data.datasets[0].data =
        d.demand || [
            1200,
            2050,
            2900,
            4650,
            5950,
            6700,
            5600
        ];

    demandChart.update("none");
}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const res =
            await fetch("/api/dashboard");

        if (!res.ok) {
            throw new Error("Dashboard API error");
        }

        const data =
            await res.json();

        updateDashboard(data);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }
}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString();

    document.getElementById("date").textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initCharts();

        loadDashboard();

        updateClock();

        setInterval(
            updateClock,
            1000
        );

    }
);