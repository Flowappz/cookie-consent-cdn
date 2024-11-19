/**
 * VERSION: 1.2.3
 */

let cookiePopup = null;
let cookiePopupHidePeriod = "FOREVER";
let cookiePerferences = {
    strictlyNecessary: true,
    functional: true,
    statistical: true,
    marketing: true,
};

hidePopupByDefault();
attachCssStyle();

window.addEventListener("DOMContentLoaded", async () => {
    try {
        initializeGoogleTagCookieWithDefaultConfig();
        await loadCookiePopup();

        const agreeButton = document.getElementById("flowappz-cookie-consent-approve");
        agreeButton.tabIndex = 0;
        agreeButton.addEventListener("click", handleCookieAccept);

        const rejectButton = document.getElementById("flowappz-cookie-consent-reject");
        if (rejectButton) {
            rejectButton.tabIndex = 0;
            rejectButton.addEventListener("click", handleCookieReject);
        }
    } catch (err) {
        console.log("Error: ", err);
    }
});

function shouldShowCookiePopup() {
    const cookie = document.cookie.split(";").find((c) => c.includes("hidePopup"));
    if (cookie) return false;
    return true;
}

function setCookieToHidePopup(hidePeriod) {
    let numberOfDays = 30;

    if (hidePeriod === "FOREVER") numberOfDays = 10 * 365;
    else if (hidePeriod === "ONE_YEAR") numberOfDays = 365;
    else if (hidePeriod === "SIX_MONTH") numberOfDays = 30 * 6;
    else if (hidePeriod === "THREE_MONTH") numberOfDays = 30 * 3;

    const today = new Date();
    const expireyDate = new Date(today.setDate(today.getDate() + numberOfDays));
    document.cookie = `hidePopup=true; Path=/; Expires=${expireyDate.toUTCString()}`;
}

function hidePopupByDefault() {
    const styleSheet = new CSSStyleSheet();

    styleSheet.replaceSync(`
    #flowappz-cookie-consent {
      display: none;
    }
  `);

    document.adoptedStyleSheets.push(styleSheet);
}

async function deleteCookiesUsingCookieStore() {
    const cookies = await cookieStore.getAll();

    for (let cookie of cookies) {
        const { name, domain, path } = cookie;
        if (name.trim() !== "hidePopup") await cookieStore.delete({ name, domain, path });
    }
}

function expireCookies() {
    document.cookie
        .split(";")
        .filter((c) => c.split("=")[0].trim() !== "hidePopup")
        .map((c) => {
            const cookieKey = c.split("=")[0];
            document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}`;
            document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}; domain=.${window.location.host}`;
        });
}

function attachCssStyle() {
    const styleSheet = new CSSStyleSheet();

    styleSheet.replaceSync(`
    .cookie-consent-switch-root[checked] {
      background-color: black;
    }

    .cookie-consent-switch-root[checked] .cookie-consent-slider {
      left: calc(100% - 35px);
    }
  `);

    document.adoptedStyleSheets.push(styleSheet);
}

function makeCookieTogglersInteractive() {
    const togglers = document.querySelectorAll(".cookie-consent-switch-root");

    togglers.forEach((toggler) => {
        toggler.addEventListener("click", () => {
            const key = toggler.getAttribute("key");
            const isChecked = toggler.getAttribute("checked");
            if (isChecked === null) {
                toggler.setAttribute("checked", "true");
                cookiePerferences[key] = true;
            } else {
                toggler.removeAttribute("checked");
                cookiePerferences[key] = false;
            }
        });
    });
}

async function loadCookiePopup() {
    if (!shouldShowCookiePopup()) {
        return;
    }

    makeCookieTogglersInteractive();

    const siteId = document.querySelector("html").getAttribute("data-wf-site");
    const res = await fetch(`https://cookie-consent-production.up.railway.app/api/cookie-consent/${siteId}`);
    if (res.ok) {
        data = await res.json();

        if (!data.cookiePopupEnabled) return;

        privacyPolicyUrl = data.privacyPolicyUrl;
        cookiePopupHidePeriod = data.cookiePopupHidePeriod;
    }

    cookiePopup = document.getElementById("flowappz-cookie-consent");
    if (!cookiePopup) console.error("Cookie popup is enabled but can not find the container!");
    else {
        cookiePopup.style.display = "flex";
        cookiePopup.style.zIndex = "99999";
    }
}

function initializeGoogleTagCookieWithDefaultConfig() {
    try {
        const userPreferenceCookie = document.cookie.split(";").find((c) => c.startsWith("cookiePreferences"));
        const savedUserPreferences = userPreferenceCookie ? JSON.parse(userPreferenceCookie.split("=")?.[1]) : null;

        gtag("consent", "default", {
            ad_storage: savedUserPreferences?.marketing ? "granted" : "denied",
            ad_user_data: savedUserPreferences?.marketing ? "granted" : "denied",
            ad_personalization: savedUserPreferences?.marketing ? "granted" : "denied",
            analytics_storage: savedUserPreferences?.statistical ? "granted" : "denied",
            wait_for_update: savedUserPreferences ? 0 : 20000,
        });
    } catch (err) {
        console.log(`Error initializing Google tag with default state`, err);
    }
}

function updateGoogleTagCookieConfig() {
    try {
        const config = {
            ad_storage: cookiePerferences.marketing ? "granted" : "denied",
            ad_user_data: cookiePerferences.marketing ? "granted" : "denied",
            ad_personalization: cookiePerferences.marketing ? "granted" : "denied",

            analytics_storage: cookiePerferences.statistical ? "granted" : "denied",
        };

        gtag("consent", "update", config);
    } catch (err) {
        console.log(`Error updating Google tag config`, err);
    }
}

function cookiePreferencesExpireyDate() {
    let numberOfDays = 30;

    if (cookiePopupHidePeriod === "FOREVER") numberOfDays = 10 * 365;
    else if (cookiePopupHidePeriod === "ONE_YEAR") numberOfDays = 365;
    else if (cookiePopupHidePeriod === "SIX_MONTH") numberOfDays = 30 * 6;
    else if (cookiePopupHidePeriod === "THREE_MONTH") numberOfDays = 30 * 3;

    const today = new Date();
    const expireyDate = new Date(today.setDate(today.getDate() + numberOfDays));

    return expireyDate;
}

function storeCookiePreferences() {
    const expireyDate = cookiePreferencesExpireyDate();

    document.cookie = `cookiePreferences=${JSON.stringify(
        cookiePerferences
    )}; Path=/; Expires=${expireyDate.toUTCString()}`;
    document.cookie = `hidePopup=true; Path=/; Expires=${expireyDate.toUTCString()}`;
}

function handleCookieReject() {
    cookiePopup.style.display = "none";

    for (let key in cookiePerferences) {
        cookiePerferences[key] = false;
    }

    storeCookiePreferences();
    updateGoogleTagCookieConfig();
}

function handleCookieAccept() {
    cookiePopup.style.display = "none";

    storeCookiePreferences();
    updateGoogleTagCookieConfig();
}