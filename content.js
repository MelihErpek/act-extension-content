document.addEventListener("DOMContentLoaded", function () {
    let accounts = [];
    let campaigns = [];
    let isLoggedIn = false;
 
    const input = document.getElementById("accountInput");
    const datalist = document.getElementById("accountsDatalist");
    const campaignInput = document.getElementById("campaignInput");
    const campaignDatalist = document.getElementById("campaignsDatalist");
    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const selectionForm = document.getElementById("selectionForm");
    const selectAccountButton = document.getElementById("selectAccountButton");
    const selectCampaignButton = document.getElementById("selectCampaignButton");
    const accountForm = document.getElementById("accountForm");
    const accountSubmitButton = document.getElementById("accountSubmitButton");
    const campaignForm = document.getElementById("campaignForm");
    const campaignSubmitButton = document.getElementById("campaignSubmitButton");
    const errorMessage = document.getElementById("errorMessage");
    const logoutButton = document.getElementById("accountlogout");
    const campaignLogoutButton = document.getElementById("campaignlogout");
 
    function updateDatalist() {
        datalist.innerHTML = "";
        accounts.forEach((account) => {
            const option = document.createElement("option");
            option.value = account;
            datalist.appendChild(option);
        });
    }
 
    function updateCampaignDatalist() {
        campaignDatalist.innerHTML = "";
        campaigns.forEach((campaign) => {
            const option = document.createElement("option");
            option.value = campaign;
            campaignDatalist.appendChild(option);
        });
    }
 
    function loadStorageData() {
        chrome.storage.local.get(["accounts", "campaigns", "isLoggedIn"], function (data) {
            if (data.isLoggedIn) {
                isLoggedIn = data.isLoggedIn;
                accounts = data.accounts || [];
                campaigns = data.campaigns || [];
                updateDatalist();
                updateCampaignDatalist();
                loginForm.style.display = "none";
                selectionForm.style.display = "block";
            }
        });
    }
 
    function resetState() {
        accounts = [];
        campaigns = [];
        isLoggedIn = false;
        chrome.storage.local.set({ accounts: [], campaigns: [], isLoggedIn: false }, function () {
            console.log("State has been reset.");
        });
        loginForm.style.display = "block";
        selectionForm.style.display = "none";
        accountForm.style.display = "none";
        campaignForm.style.display = "none";
        document.getElementById("mail").value = "";
        document.getElementById("password").value = "";
        errorMessage.innerText = "";
    }
 
    input.addEventListener("input", function () {
        const value = this.value.toLowerCase();
        const suggestions = accounts.filter((account) =>
            account.toLowerCase().startsWith(value)
        );
        datalist.innerHTML = "";
        suggestions.forEach((account) => {
            const option = document.createElement("option");
            option.value = account;
            datalist.appendChild(option);
        });
    });
 
    campaignInput.addEventListener("input", function () {
        const value = this.value.toLowerCase();
        const suggestions = campaigns.filter((campaign) =>
            campaign.toLowerCase().startsWith(value)
        );
        campaignDatalist.innerHTML = "";
        suggestions.forEach((campaign) => {
            const option = document.createElement("option");
            option.value = campaign;
            campaignDatalist.appendChild(option);
        });
    });
 
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loginButton.classList.add("loading");
        errorMessage.textContent = "";
 
        const mail = document.getElementById("mail").value;
        const password = document.getElementById("password").value;
 
        fetch("https://act-api.vercel.app/user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ mail: mail, password: password }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                loginButton.classList.remove("loading");
                if (data.hata) {
                    errorMessage.textContent = data.hata;
                    errorMessage.style.color = "red";
                } else {
                    isLoggedIn = true;
                    chrome.storage.local.set({ isLoggedIn: true }, function () {
                        console.log("Login status saved to chrome storage.");
                    });
                    loginForm.style.display = "none";
                    selectionForm.style.display = "block";
                    accounts =
                        data.user && data.user.account
                            ? data.user.account.map((acc) => acc.name)
                            : [];
                    campaigns =
                        data.user && data.user.campaign
                            ? data.user.campaign.map((cmp) => cmp.name)
                            : [];
                    chrome.storage.local.set({ accounts: accounts, campaigns: campaigns }, function () {
                        console.log("Accounts and campaigns data saved to chrome storage.");
                    });
                    updateDatalist();
                    updateCampaignDatalist();
                }
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                errorMessage.textContent =
                    "There was an error processing your request: " + error.message;
                errorMessage.style.color = "red";
                loginButton.classList.remove("loading");
            });
    });
 
    selectAccountButton.addEventListener("click", function () {
        selectionForm.style.display = "none";
        accountForm.style.display = "block";
    });
 
    selectCampaignButton.addEventListener("click", function () {
        selectionForm.style.display = "none";
        campaignForm.style.display = "block";
    });
 
    accountSubmitButton.addEventListener("click", function (event) {
        event.preventDefault();
        const accountName = input.value;
 
        fetch("https://act-api.vercel.app/findAccountRules", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountName: accountName }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.rules) {
                    console.log("Rules:", data.rules);
                    chrome.storage.local.set({ rules: data.rules }, function () {
                        console.log("Rules data saved to chrome storage.");
                        checkBudgetLimit(); // Now check the budget limit after updating the rules.
                    });
                } else {
                    console.error("No rules found for this account");
                }
            })
            .catch((error) => {
                console.error("Fetch error when submitting account:", error);
                errorMessage.textContent =
                    "There was an error processing your request: " + error.message;
                errorMessage.style.color = "red";
            });
    });
 
    campaignSubmitButton.addEventListener("click", function (event) {
        event.preventDefault();
        const campaignName = campaignInput.value;
 
        fetch("https://act-api.vercel.app/findCampaignRules", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ campaignName: campaignName }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.rules) {
                    console.log("Rules:", data.rules);
                    chrome.storage.local.set({ rules: data.rules }, function () {
                        console.log("Rules data saved to chrome storage.");
                        checkBudgetLimit(); // Now check the budget limit after updating the rules.
                    });
                } else {
                    console.error("No rules found for this campaign");
                }
            })
            .catch((error) => {
                console.error("Fetch error when submitting campaign:", error);
                errorMessage.textContent =
                    "There was an error processing your request: " + error.message;
                errorMessage.style.color = "red";
            });
    });
 
    logoutButton.addEventListener("click", function () {
        resetState();
    });
 
    campaignLogoutButton.addEventListener("click", function () {
        resetState();
    });
 
    loadStorageData(); // Load data on page load
});
 
