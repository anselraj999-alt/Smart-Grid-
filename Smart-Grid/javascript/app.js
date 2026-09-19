/*
  SmartGrid AI - plain JavaScript frontend.
  Accounts and dashboard data now come from the backend (see /backend);
  nothing about customers is stored in the browser except the login token.
*/
(function () {
  const api = window.SmartGridApi;

  /* ---------- Page elements ---------- */

  const pages = {
    loading: document.getElementById("loadingPage"),
    login: document.getElementById("loginPage"),
    register: document.getElementById("registerPage"),
    success: document.getElementById("successPage"),
    dashboard: document.getElementById("dashboardPage")
  };

  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");
  const dashboardError = document.getElementById("dashboardError");

  const loginButton = document.getElementById("loginButton");
  const createAccountButton = document.getElementById("createAccountButton");
  const checkUserIdButton = document.getElementById("checkUserIdButton");

  const value = function (id) {
    return document.getElementById(id).value;
  };

  /* ---------- Small helpers ---------- */

  function showPage(name) {
    Object.keys(pages).forEach(function (key) {
      pages[key].classList.toggle("hidden", key !== name);
    });
  }

  function setMessage(element, message, type) {
    element.textContent = message;
    element.className = "message " + type;
  }

  function clearMessages() {
    loginMessage.textContent = "";
    loginMessage.className = "message";
    registerMessage.textContent = "";
    registerMessage.className = "message";
  }

  /* Disables a button while an async action runs, always re-enables it after. */
  async function withBusyButton(button, action) {
    button.disabled = true;
    try {
      await action();
    } finally {
      button.disabled = false;
    }
  }

  /* ---------- Navigation between login / register / success ---------- */

  document.getElementById("openRegisterButton").addEventListener("click", function () {
    clearMessages();
    showPage("register");
  });

  document.getElementById("backToLoginButton").addEventListener("click", function () {
    clearMessages();
    showPage("login");
  });

  document.getElementById("continueLoginButton").addEventListener("click", function () {
    clearMessages();
    showPage("login");
  });

  /* ---------- Login ---------- */

  loginButton.addEventListener("click", function () {
    const userId = value("loginUserId").trim();
    const password = value("loginPassword");

    if (!userId || !password) {
      setMessage(loginMessage, "Please enter User ID and Password.", "error");
      return;
    }

    withBusyButton(loginButton, async function () {
      try {
        const customer = await api.login(userId, password);
        clearMessages();
        openDashboard(customer);
      } catch (error) {
        setMessage(loginMessage, error.message, "error");
      }
    });
  });

  /* ---------- User ID availability ---------- */

  checkUserIdButton.addEventListener("click", function () {
    const userId = value("registerUserId").trim();

    if (!userId) {
      setMessage(registerMessage, "Please enter a User ID first.", "error");
      return;
    }

    withBusyButton(checkUserIdButton, async function () {
      try {
        const result = await api.checkUserId(userId);
        if (result.available) {
          setMessage(registerMessage, "User ID is available.", "success");
        } else {
          setMessage(
            registerMessage,
            "User ID already exists. Please choose another User ID.",
            "error"
          );
        }
      } catch (error) {
        setMessage(registerMessage, error.message, "error");
      }
    });
  });

  /* ---------- Password strength meter ---------- */

  document.getElementById("registerPassword").addEventListener("input", function () {
    const password = this.value;
    const fill = document.getElementById("passwordMeterFill");
    const status = document.getElementById("passwordStatus");

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      fill.style.width = "30%";
      fill.style.background = "#dc2626";
      status.textContent = "Weak";
      status.style.color = "#dc2626";
    } else if (score <= 4) {
      fill.style.width = "65%";
      fill.style.background = "#f59e0b";
      status.textContent = "Medium";
      status.style.color = "#f59e0b";
    } else {
      fill.style.width = "100%";
      fill.style.background = "#16a34a";
      status.textContent = "Strong";
      status.style.color = "#16a34a";
    }
  });

  /* ---------- Registration ---------- */

  createAccountButton.addEventListener("click", function () {
    const customer = {
      name: value("registerName").trim(),
      address: value("registerAddress").trim(),
      email: value("registerEmail").trim(),
      aadhaar: value("registerAadhaar").trim(),
      phone: value("registerPhone").trim(),
      userId: value("registerUserId").trim(),
      password: value("registerPassword")
    };
    const confirmPassword = value("registerConfirmPassword");

    /* Quick checks for instant feedback. The server repeats every rule. */
    const allFilled =
      customer.name && customer.address && customer.email && customer.aadhaar &&
      customer.phone && customer.userId && customer.password && confirmPassword;

    if (!allFilled) {
      setMessage(registerMessage, "Please fill in all fields.", "error");
      return;
    }

    if (customer.password !== confirmPassword) {
      setMessage(registerMessage, "Passwords do not match.", "error");
      return;
    }

    withBusyButton(createAccountButton, async function () {
      try {
        await api.register(customer);

        document.getElementById("createdUserId").textContent =
          "Customer User ID: " + customer.userId;
        document.getElementById("loginUserId").value = customer.userId;
        document.getElementById("loginPassword").value = "";

        clearMessages();
        showPage("success");
      } catch (error) {
        setMessage(registerMessage, error.message, "error");
      }
    });
  });

  /* ---------- Dashboard ---------- */

  const STATUS_CLASSES = ["green-text", "orange-text", "red-text"];
  const STATUS_COLOR = {
    low: "green-text",
    stable: "green-text",
    medium: "orange-text",
    high: "red-text",
    critical: "red-text",
    unstable: "red-text"
  };

  /*
    The chart is drawn on a 500 x 200 canvas. x is spread evenly across the readings;
    y maps 0-1000 kW onto the canvas (higher load = higher on the chart).
  */
  function toChartPoints(readingsKw) {
    const lastIndex = readingsKw.length - 1 || 1;
    return readingsKw
      .map(function (kw, index) {
        const x = ((index * 500) / lastIndex).toFixed(1);
        const y = (250 - kw / 4).toFixed(1);
        return x + "," + y;
      })
      .join(" ");
  }

  function applyStatusColor(element, status) {
    element.classList.remove.apply(element.classList, STATUS_CLASSES);
    const cls = STATUS_COLOR[String(status).toLowerCase()];
    if (cls) element.classList.add(cls);
  }

  function renderDashboard(d) {
    const text = {
      "stat.currentLoad": d.stats.currentLoadKw + " kW",
      "stat.predictedLoad": d.stats.predictedLoadKw + " kW",
      "stat.renewable": d.stats.renewableKw + " kW",
      "stat.capacity": d.stats.gridCapacityKw + " kW",
      "stat.utilization": d.stats.utilizationPct + "%",
      "stat.risk": d.stats.overloadRisk,

      "forecast.metrics":
        (d.demo ? "Demo " : "") + "Forecast Metrics: MAE " + d.forecast.metrics.maeKw +
        " kW, RMSE " + d.forecast.metrics.rmseKw + " kW, MAPE " + d.forecast.metrics.mapePct + "%",

      "renew.solar": d.renewables.solarKw + " kW available",
      "renew.wind": d.renewables.windKw + " kW available",
      "renew.hydro": d.renewables.hydroKw + " kW available",
      "renew.mix": "Renewable Energy Mix: " + d.renewables.mixPct + "%",

      "grid.load": d.grid.currentLoadKw + " kW",
      "grid.capacity": d.grid.capacityKw + " kW",
      "grid.utilization": d.grid.utilizationPct + "%",
      "grid.frequency": d.grid.frequencyHz + " Hz",
      "grid.voltage": d.grid.voltageV + " V",
      "grid.stability": d.grid.stability,

      "report.daily": d.reports.dailyMWh + " MWh",
      "report.weekly": d.reports.weeklyMWh + " MWh",
      "report.monthly": d.reports.monthlyMWh + " MWh"
    };

    document.querySelectorAll("[data-bind]").forEach(function (element) {
      const key = element.getAttribute("data-bind");
      if (Object.prototype.hasOwnProperty.call(text, key)) element.textContent = text[key];
    });

    applyStatusColor(document.getElementById("overloadRisk"), d.stats.overloadRisk);
    applyStatusColor(document.getElementById("gridStability"), d.grid.stability);

    document.getElementById("demoLabel").classList.toggle("hidden", !d.demo);

    document.getElementById("actualLine").setAttribute("points", toChartPoints(d.forecast.actualKw));
    document
      .getElementById("predictedLine")
      .setAttribute("points", toChartPoints(d.forecast.predictedKw));

    const alertsList = document.getElementById("alertsList");
    alertsList.textContent = "";
    d.alerts.forEach(function (item) {
      const alertBox = document.createElement("div");
      alertBox.className = "alert" + (item.level === "normal" || item.level === "critical" ? " " + item.level : "");
      alertBox.textContent = item.message; /* textContent, never innerHTML */
      alertsList.appendChild(alertBox);
    });
  }

  function loadCustomerProfile(customer) {
    document.getElementById("welcomeMessage").textContent = "Welcome, " + customer.name;
    document.getElementById("profileName").textContent = customer.name;
    document.getElementById("profileUserId").textContent = customer.userId;
    document.getElementById("profileEmail").textContent = customer.email;
    document.getElementById("profileAddress").textContent = customer.address;
    document.getElementById("profilePhone").textContent = customer.phone;
    document.getElementById("profileAadhaar").textContent = customer.aadhaarMasked;
  }

  async function loadDashboardData() {
    dashboardError.classList.add("hidden");
    try {
      const data = await api.dashboard();
      if (!api.hasToken()) return; /* user logged out while this was loading */
      renderDashboard(data);
    } catch (error) {
      if (error.status === 401) {
        logout("Your session has expired. Please log in again.");
        return;
      }
      dashboardError.textContent = "Could not load dashboard data. " + error.message;
      dashboardError.classList.remove("hidden");
    }
  }

  function openDashboard(customer) {
    loadCustomerProfile(customer);
    showPage("dashboard");
    loadDashboardData();
  }

  /* ---------- Logout ---------- */

  function logout(notice) {
    api.clearToken();

    document.getElementById("loginUserId").value = "";
    document.getElementById("loginPassword").value = "";

    clearMessages();
    if (typeof notice === "string") setMessage(loginMessage, notice, "error");
    showPage("login");
  }

  document.getElementById("logoutButton").addEventListener("click", function () {
    logout();
  });

  document.getElementById("sidebarLogoutButton").addEventListener("click", function () {
    logout();
  });

  /* ---------- Start: restore the session if the page is refreshed after login ---------- */

  async function start() {
    if (!api.hasToken()) {
      showPage("login");
      return;
    }

    try {
      openDashboard(await api.me());
    } catch (error) {
      /* Expired or invalid token - or the server is down. Either way, ask for a login. */
      api.clearToken();
      showPage("login");
    }
  }

  start();
})();
