
document.addEventListener('DOMContentLoaded', function () {
    let accounts = [];
    let isLoggedIn = false;

    const input = document.getElementById('accountInput');
    const datalist = document.getElementById('accountsDatalist');
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const accountForm = document.getElementById('accountForm');
    const accountSubmitButton = document.getElementById('accountSubmitButton');
    const errorMessage = document.getElementById('errorMessage');

    function updateDatalist() {
        datalist.innerHTML = '';
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            datalist.appendChild(option);
        });
    }

    function loadStorageData() {
        chrome.storage.local.get(['accounts', 'isLoggedIn'], function (data) {
            if (data.isLoggedIn) {
                isLoggedIn = data.isLoggedIn;
                accounts = data.accounts || [];
                updateDatalist();
                loginForm.style.display = 'none';
                accountForm.style.display = 'block';
            }
        });
    }

    input.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        const suggestions = accounts.filter(account => account.toLowerCase().startsWith(value));
        datalist.innerHTML = '';
        suggestions.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            datalist.appendChild(option);
        });
    });

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        loginButton.classList.add('loading');
        errorMessage.textContent = '';

        const mail = document.getElementById('mail').value;
        const password = document.getElementById('password').value;

        fetch("https://act-api.vercel.app/user", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mail: mail, password: password })
        })
            .then(response => response.json())
            .then(data => {
                loginButton.classList.remove('loading');
                if (data.hata) {
                    errorMessage.textContent = data.hata;
                    errorMessage.style.color = 'red';
                } else {
                    isLoggedIn = true;
                    chrome.storage.local.set({ isLoggedIn: true }, function () {
                        console.log('Login status saved to chrome storage.');
                    });
                    loginForm.style.display = 'none';
                    accountForm.style.display = 'block';
                    accounts = data.user && data.user.account ? data.user.account.map(acc => acc.name) : [];
                    chrome.storage.local.set({ accounts: accounts }, function () {
                        console.log('Accounts data saved to chrome storage.');
                    });
                    updateDatalist();
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                errorMessage.textContent = "There was an error processing your request: " + error.message;
                errorMessage.style.color = 'red';
                loginButton.classList.remove('loading');
            });
    });

    accountSubmitButton.addEventListener('click', function (event) {
        event.preventDefault();
        const accountName = input.value;

        fetch("https://act-api.vercel.app/findAccountRules", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accountName: accountName })
        })
            .then(response => response.json())
            .then(data => {
                if (data.rules) {
                    console.log('Rules:', data.rules);
                    chrome.storage.local.set({ rules: data.rules }, function () {
                        console.log('Rules data saved to chrome storage.');
                        checkBudgetLimit();  // Now check the budget limit after updating the rules.
                    });
                } else {
                    console.error('No rules found for this account');
                }
            })
            .catch(error => {
                console.error('Fetch error when submitting account:', error);
                errorMessage.textContent = "There was an error processing your request: " + error.message;
                errorMessage.style.color = 'red';
            });
    });

    function checkBudgetLimit() {
        chrome.storage.local.get('rules', function (data) {
            if (data.rules) {
                const budgetRule = data.rules.find(r => r.ruleDescription === "Budget");
                if (budgetRule) {
                    var inputs = document.querySelectorAll('input[placeholder="Please enter an amount"]');
                    inputs.forEach(function (input) {
                        var value = parseFloat(input.value.replace('TL', '').replace(',', ''));
                        if (!isNaN(value) && value > budgetRule.rule) {
                            addAlert('alert5', 'Bütçe aşıldı.');
                        } else {
                            removeAlert('alert5');
                        }
                    });
                }
            }
        });
    }

    document.getElementById('accountlogout').addEventListener('click', function () {
        document.getElementById('accountForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('mail').value = '';
        document.getElementById('password').value = '';
        document.getElementById('errorMessage').innerText = '';
    });

    loadStorageData(); // Load data on page load
});

//////////////////////////////// **** ALERT CONTAINER **** ////////////////////////////////

function ensureAlertContainer() {
    var alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '50%';
        alertContainer.style.right = '10px';
        alertContainer.style.transform = 'translateY(-50%)';
        alertContainer.style.backgroundColor = '#FF0000';
        alertContainer.style.border = '1px solid #FF0000';
        alertContainer.style.padding = '20px';
        alertContainer.style.borderRadius = '10px';
        alertContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        alertContainer.style.zIndex = '1000';
        alertContainer.style.display = 'flex';
        alertContainer.style.flexDirection = 'column';
        alertContainer.style.alignItems = 'flex-start';
        alertContainer.style.cursor = 'move';

        var logo = document.createElement('img');
        logo.src = 'https://www.interpublic.com/wp-content/uploads/2019/04/Logo_UM-e1566481266432.png';
        logo.alt = 'Logo';
        logo.id = 'alert-logo';
        logo.style.width = '50px';
        logo.style.height = '50px';
        logo.style.marginBottom = '10px';
        alertContainer.appendChild(logo);

        document.body.appendChild(alertContainer);

        makeDraggable(alertContainer);
    }
    return alertContainer;
}

function removeAlertContainerIfEmpty() {
    var alertContainer = document.getElementById('alert-container');
    if (alertContainer && alertContainer.childElementCount <= 1) {
        alertContainer.remove();
    }
}

function addAlert(id, message) {
    var alertContainer = ensureAlertContainer();
    var alert = document.getElementById(id);
    if (!alert) {
        alert = document.createElement('p');
        alert.id = id;
        alert.innerHTML = message;
        alert.style.margin = '0 0 10px 0';
        alert.style.padding = '10px';
        alert.style.backgroundColor = '#f8f9fa';
        alert.style.border = '1px solid #ff0000';
        alert.style.borderRadius = '5px';
        alert.style.fontSize = '14px';

        if (id.startsWith('alertuser')) {
            alertContainer.insertBefore(alert, alertContainer.firstChild.nextSibling);
        } else {
            alertContainer.appendChild(alert);
        }
    }
}


function removeAlert(id) {
    var alert = document.getElementById(id);
    if (alert) {
        alert.remove();
        removeAlertContainerIfEmpty();
    }
}

function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;

        // Remove right style and set left style
        element.style.left = element.getBoundingClientRect().right + 'px';
        element.style.right = '';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            element.style.left = initialX + deltaX + 'px';
            element.style.top = initialY + deltaY + 'px';
            element.style.transform = ''; // Disable transform during dragging
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}



////////////////////////////////////// **** POPUP JS **** //////////////////////////////////////

document.addEventListener('DOMContentLoaded', function () {
    let accounts = [];
    let isLoggedIn = false;

    const input = document.getElementById('accountInput');
    const datalist = document.getElementById('accountsDatalist');
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const accountForm = document.getElementById('accountForm');
    const accountSubmitButton = document.getElementById('accountSubmitButton');
    const errorMessage = document.getElementById('errorMessage');

    function updateDatalist() {
        datalist.innerHTML = '';
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            datalist.appendChild(option);
        });
    }

    function loadStorageData() {
        chrome.storage.local.get(['accounts', 'isLoggedIn'], function (data) {
            if (data.isLoggedIn) {
                isLoggedIn = data.isLoggedIn;
                accounts = data.accounts || [];
                updateDatalist();
                loginForm.style.display = 'none';
                accountForm.style.display = 'block';
            }
        });
    }

    input.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        const suggestions = accounts.filter(account => account.toLowerCase().startsWith(value));
        datalist.innerHTML = '';
        suggestions.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            datalist.appendChild(option);
        });
    });

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        loginButton.classList.add('loading');
        errorMessage.textContent = '';

        const mail = document.getElementById('mail').value;
        const password = document.getElementById('password').value;

        fetch("https://act-api.vercel.app/user", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mail: mail, password: password })
        })
            .then(response => response.json())
            .then(data => {
                loginButton.classList.remove('loading');
                if (data.hata) {
                    errorMessage.textContent = data.hata;
                    errorMessage.style.color = 'red';
                } else {
                    isLoggedIn = true;
                    chrome.storage.local.set({ isLoggedIn: true }, function () {
                        console.log('Login status saved to chrome storage.');
                    });
                    loginForm.style.display = 'none';
                    accountForm.style.display = 'block';
                    accounts = data.user && data.user.account ? data.user.account.map(acc => acc.name) : [];
                    chrome.storage.local.set({ accounts: accounts }, function () {
                        console.log('Accounts data saved to chrome storage.');
                    });
                    updateDatalist();
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                errorMessage.textContent = "There was an error processing your request: " + error.message;
                errorMessage.style.color = 'red';
                loginButton.classList.remove('loading');
            });
    });

    accountSubmitButton.addEventListener('click', function (event) {
        event.preventDefault();
        const accountName = input.value;

        fetch("https://act-api.vercel.app/findAccountRules", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accountName: accountName })
        })
            .then(response => response.json())
            .then(data => {
                if (data.rules) {
                    console.log('Rules:', data.rules);
                    chrome.storage.local.set({ rules: data.rules }, function () {
                        console.log('Rules data saved to chrome storage.');
                        checkBudgetLimit();  // Now check the budget limit after updating the rules.
                    });
                    showAccountSubmittedMessage();
                } else {
                    console.error('No rules found for this account');
                }
            })
            .catch(error => {
                console.error('Fetch error when submitting account:', error);
                errorMessage.textContent = "There was an error processing your request: " + error.message;
                errorMessage.style.color = 'red';
            });
    });

    function showAccountSubmittedMessage() {
        const messageElement = document.createElement('div');
        messageElement.innerText = 'Account Submitted!';
        messageElement.style.color = 'green';
        messageElement.style.marginTop = '10px';
        accountForm.insertAdjacentElement('afterend', messageElement);
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }


    function checkBudgetLimit() {
        chrome.storage.local.get('rules', function (data) {
            if (data.rules) {
                const budgetRule = data.rules.find(r => r.ruleDescription === "Budget");
                if (budgetRule) {
                    var inputs = document.querySelectorAll('input[placeholder="Please enter an amount"]');
                    inputs.forEach(function (input) {
                        var value = parseFloat(input.value.replace('TL', '').replace(',', ''));
                        if (!isNaN(value) && value > budgetRule.rule) {
                            addAlert('alert5', 'Bütçe aşıldı.');
                        } else {
                            removeAlert('alert5');
                        }
                    });
                }
            }
        });
    }

    document.getElementById('accountlogout').addEventListener('click', function () {
        document.getElementById('accountForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('mail').value = '';
        document.getElementById('password').value = '';
        document.getElementById('errorMessage').innerText = '';
    });

    loadStorageData(); // Load data on page load
});


////////////////////////////////////// FACEBOOK HANDLERS //////////////////////////////////////

var callback = function (mutationsList, observer) {

    for (var mutation of mutationsList) {

        // var dollarInputs = document.querySelectorAll('input[value^="TL"]');
        // dollarInputs.forEach(function (input) {
        //     var value = parseFloat(input.value.replace('TL', ''));
        //     console.log(value)
        //     if (!isNaN(value) && value >31) {
        //         addAlert('alert6', 'Ad set bütçesi fazla!');
        //     }
        //     else {
        //         removeAlert('alert6');
        //     }
        // });

        let inputElement1 = document.querySelector('input[placeholder="Enter your campaign name here..."]');
        if (inputElement1) {
            inputElement1.addEventListener('input', function () {
                if (inputElement1.value.toLowerCase() === 'dyson') {
                    addAlert('alert2', 'Campaign name "Dyson" olarak girildi.');
                } else {
                    removeAlert('alert2');
                }
            });
        }

        let inputElement2 = document.querySelector('input[placeholder="Enter your ad set name here..."]');
        if (inputElement2) {
            inputElement2.addEventListener('input', function () {
                if (inputElement2.value.toLowerCase() === 'dyson') {
                    addAlert('alert3', 'Ad set name "Dyson" olarak girildi.');
                } else {
                    removeAlert('alert3');
                }
            });
        }
        chrome.storage.local.get('rules', function (data) {
            if (data.rules) {

                // var budgetInputs = document.querySelectorAll('input[value^="TL"]');
                const budgetRule = data.rules.find(r => r.ruleDescription === "Budget");
                if (budgetRule) {

                    var inputs = document.querySelectorAll('input[placeholder="Please enter an amount"]');
                    budgetCampaign = true;
                    if (inputs.length > 0) {
                        budgetCampaign = true;
                        inputs.forEach(function (input) {
                            var value = parseFloat(input.value.replace('TL', '').replace(',', ''));
                            if (!isNaN(value) && value > budgetRule.rule) {
                                addAlert('alert5', 'Bütçe aşıldı.');
                            } else {
                                removeAlert('alert5');
                            }
                        });
                    }
                    else {
                        budgetCampaign = false;
                        removeAlert('alert5');
                    }



                }
                const budgetRuleAdSetBudget = data.rules.find(r => r.ruleDescription === "Ad Set Budget");
                if (budgetRuleAdSetBudget) {
                    if (budgetCampaign === false) {


                        var dollarInputs = document.querySelectorAll('input[value^="TL"]');
                        var exceededValue = false;
                        if (dollarInputs.length > 0) {
                            budgetAdSet = true;
                            dollarInputs.forEach(function (input) {
                                var value = parseFloat(input.value.replace('TL', '').replace(',', ''));
                                if (!isNaN(value) && value > budgetRuleAdSetBudget.rule) {
                                    exceededValue = true;
                                    addAlert('alert6', 'Ad set bütçesi fazla!');
                                }
                                else {
                                    removeAlert('alert6');
                                }
                            });
                        }
                        else {
                            budgetAdSet = false;

                        }
                    }
                    else {
                        removeAlert('alert6');
                    }




                }
                const budgetRuleAB = data.rules.find(r => r.ruleDescription === "A/B Testing");
                if (budgetRuleAB) {
                    var element2 = document.querySelector('[aria-label="Create A/B test"]');

                    if (budgetRuleAB.rule === "True") {
                        if (element2.getAttribute('aria-checked') === 'false') {
                            addAlert('alert1', 'A/B test kuralı hatalı.');
                        } else {
                            removeAlert('alert1');
                        }
                    }
                    else {
                        if (element2.getAttribute('aria-checked') === 'true') {
                            addAlert('alert1', 'A/B test kuralı hatalı.');
                        } else {
                            removeAlert('alert1');
                        }
                    }
                }
                const budgetRuleType = data.rules.find(r => r.ruleDescription === "Budget Type");
                if (budgetRuleType) {
                    if (budgetRuleType.rule === "Lifetime Budget") {
                        var spans = document.querySelectorAll('span');

                        var foundDailyBudget = false;
                        spans.forEach(function (span) {
                            var expectedStyle = 'font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; line-height: 1.42857; letter-spacing: normal; overflow-wrap: normal; text-align: left; color: rgba(0, 0, 0, 0.85);';

                            if (span.getAttribute('style') === expectedStyle) {
                                if (span.textContent.includes('Daily budget')) {
                                    foundDailyBudget = true;
                                    addAlert('alert4', 'Budget Time Lifetime Olmalı.');
                                }

                            }

                        });
                        if (!foundDailyBudget) {
                            removeAlert('alert4');
                        }
                    }
                    else {
                        var spans = document.querySelectorAll('span');
                        var foundDailyBudget = false;
                        spans.forEach(function (span) {
                            var expectedStyle = 'font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; line-height: 1.42857; letter-spacing: normal; overflow-wrap: normal; text-align: left; color: rgba(0, 0, 0, 0.85);';

                            if (span.getAttribute('style') === expectedStyle) {
                                if (span.textContent.includes('Lifetime budget')) {
                                    foundDailyBudget = true;
                                    addAlert('alert4', 'Budget Time Daily Olmalı.');
                                }
                            }
                        });
                        if (!foundDailyBudget) {
                            removeAlert('alert4');
                        }
                    }
                }
                const Taxonomy = data.rules.find(r => r.ruleDescription === "Taxonomy");
                if (Taxonomy) {
                    if (Taxonomy.rule === "BrandName|Platform|CampaignName|Objective|StartDate|EndDate") {
                        let inputElement1 = document.querySelector('input[placeholder="Enter your campaign name here..."]');

                        const regex = /^[A-Za-z0-9]+(?:\|[A-Za-z0-9]+){3}\|\d{4}-\d{2}-\d{2}\|\d{4}-\d{2}-\d{2}$/;
                        if (!regex.test(inputElement1.value.toLowerCase())) {
                            addAlert("alert15", "Taxonomy Hatalı")
                        }
                        else {
                            removeAlert("alert15")
                        }
                    }
                    if (Taxonomy.rule === "BrandName_Platform_CampaignName_Objective_StartDate_EndDate") {
                        let inputElement1 = document.querySelector('input[placeholder="Enter your campaign name here..."]');
                        const regex = /^[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/;
                        if (!regex.test(inputElement1.value.toLowerCase())) {
                            addAlert("alert15", "Taxonomy Hatalı")
                        }
                        else {
                            removeAlert("alert15")
                        }
                    }
                    if (Taxonomy.rule === "BrandName-Platform-CampaignName-Objective-StartDate-EndDate") {
                        let inputElement1 = document.querySelector('input[placeholder="Enter your campaign name here..."]');
                        const regex = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+){3}-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}$/;
                        if (!regex.test(inputElement1.value.toLowerCase())) {
                            addAlert("alert15", "Taxonomy Hatalı")
                        }
                        else {
                            removeAlert("alert15")
                        }
                    }
                }
            }
        });





        var allSpans = document.querySelectorAll('span');
        allSpans.forEach(function (span, index) {
            var spanText = span.textContent;
            var expectedStyle = 'font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; line-height: 1.42857; letter-spacing: normal; overflow-wrap: normal; text-align: left; color: rgba(0, 0, 0, 0.85);';

            if (span.getAttribute('style') === expectedStyle && /\(\d+\)/.test(spanText)) {
                addAlert('alert-span-' + index, spanText + '<br>olarak giriş yapıldı');
            } else {
                removeAlert('alert-span-' + index);
            }
        });
    }
};

////////////////////////////////////// GOOGLE HANDLERS //////////////////////////////////////


function setupHandlers() {
    chrome.storage.local.get('rules', function (data) {
        if (data && data.rules) {
            const rules = {};
            data.rules.forEach(rule => {
                rules[rule.ruleDescription] = rule.rule;
            });

            const observer = new MutationObserver(() => {
                attachInputHandlers(rules);
            });

            observer.observe(document.body, {
                attributes: true,
                childList: true,
                subtree: true,
            });

            attachInputHandlers(rules);
        }
    });
}

function attachInputHandlers(rules) {
    const adcamInput = document.querySelector('input[aria-label="Reklam grubu adı"]');
    if (adcamInput && !adcamInput.dataset.listenerAdded) {
        adcamInput.addEventListener("input", event => handleAdGroupName(event, rules['Campaign Name']));
        adcamInput.dataset.listenerAdded = "true";
    }

    const budgetInput = document.querySelector('input[aria-label="Bütçe tutarı (₺ cinsinden)"]');
    if (budgetInput && !budgetInput.dataset.listenerAdded) {
        budgetInput.addEventListener("input", event => handleBudgetInputChange(event, parseFloat(rules['Budget'])));
        budgetInput.dataset.listenerAdded = "true";
    }

    const campaignInput = document.querySelector('input[aria-label="Kampanya adı"]');
    if (campaignInput && !campaignInput.dataset.listenerAdded) {
        campaignInput.addEventListener("input", event => handleCampaignInputChange(event, rules['Campaign Name']));
        campaignInput.dataset.listenerAdded = "true";
    }

    const targetCPMBidInput = document.querySelector('input[aria-label="Hedef GBM teklifi (₺ cinsinden)"]');
    if (targetCPMBidInput && !targetCPMBidInput.dataset.listenerAdded) {
        targetCPMBidInput.addEventListener("input", event => handleTargetCPMBidInputChange(event, parseFloat(rules['Target GBM budget'])));
        targetCPMBidInput.dataset.listenerAdded = "true";
    }

    const keywordTextarea = document.querySelectorAll('textarea[aria-label*="Anahtar kelimeler"]');
    keywordTextarea.forEach(textarea => {
        if (!textarea.dataset.listenerAdded) {
            textarea.addEventListener("input", event => handleKeywordTextareaChange(event, rules['Keywords']));
            textarea.dataset.listenerAdded = "true";
        }
    });

    const avgDailyBudgetInput = document.querySelector('input[aria-label="Bu kampanya için ortalama günlük bütçenizi belirleyin"]');
    if (avgDailyBudgetInput && !avgDailyBudgetInput.dataset.listenerAdded) {
        avgDailyBudgetInput.addEventListener("input", event => handleBudgetInputChange(event, parseFloat(rules['Budget'])));
        avgDailyBudgetInput.dataset.listenerAdded = "true";
    }

    checkDivContent(rules);
    checkShoppingCartItems(rules);
}

function handleBudgetInputChange(event, Budget) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > Budget) {
        addAlert("alert7", `Bütçe tutarı ${Budget}₺ üzerinde.`);
    } else {
        removeAlert("alert7");
    }
}

function handleCampaignInputChange(event, expectedName) {
    const value = event.target.value.toLowerCase();
    if (value === expectedName.toLowerCase()) {
        addAlert("alert8", `Kampanya adı "${expectedName}" olarak girildi.`);
    } else {
        removeAlert("alert8");
    }
}

function handleTargetCPMBidInputChange(event, rule) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > rule) {
        addAlert("alert9", `Hedef GBM teklifi ${rule}₺ üzerinde.`);
    } else {
        removeAlert("alert9");
    }
}

function handleKeywordTextareaChange(event, keyword) {
    const value = event.target.value.toLowerCase();
    if (value.includes(keyword.toLowerCase())) {
        addAlert("alert10", `Anahtar kelimeler arasında "${keyword}" bulundu.`);
    } else {
        removeAlert("alert10");
    }
}

function checkDivContent(rules) {
}
function checkShoppingCartItems(rules) {
}
setupHandlers();


////////////////////////////////////// LINKEDIN HANDLERS //////////////////////////////////////

function checkCampaignLifetimeBudgetLabel() {
    var labels = document.querySelectorAll('label[for="campaign-lifetime-budget"]');
    labels.forEach(function (label) {
        if (label && !label.textContent.includes('Currency in Turkey, New Lira (TRY)')) {
            addAlert('alert13', 'Şu anda currency olarak TL seçili değil.');
        } else {
            removeAlert('alert15');
        }
    });
}

function checkCampaignLifetimeBudgetInput() {
    var input = document.querySelector('input[id="campaign-lifetime-budget"]');
    if (input) {
        var value = parseFloat(input.value.replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(value) && value > 100) {
            addAlert('alert14', 'Bütçe aşıldı: ' + value);
        } else {
            removeAlert('alert16');
        }
    }
}

function observeLinkedInDOMChanges() {
    const observer = new MutationObserver(() => {
        checkCampaignLifetimeBudgetLabel();
        checkCampaignLifetimeBudgetInput();
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
}

observeLinkedInDOMChanges();

var targetNode = document.body;
var config = { attributes: true, childList: true, subtree: true };

var observer = new MutationObserver(callback);
observer.observe(targetNode, config);

observeDOMChanges();
callback();
