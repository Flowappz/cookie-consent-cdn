/**
 * VERSION: 1.1.15
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
    agreeButton.addEventListener("click", () => {
      cookiePopup.style.display = "none";
      setCookieToHidePopup(cookiePopupHidePeriod);
    });

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
    .flowappz-cookie-consent {
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
      const isChecked = toggler.getAttribute("checked");
      if (isChecked === null) toggler.setAttribute("checked", "true");
      else toggler.removeAttribute("checked");
    });
  });
}

async function loadCookiePopup() {
  if (!shouldShowCookiePopup()) {
    return;
  }

  makeCookieTogglersInteractive();

  const res = await fetch(
    `https://cookie-consent-production.up.railway.app/api/cookie-consent/hostname?hostname=${window.location.hostname}`
  );
  if (res.ok) {
    data = await res.json();

    if (!data.cookiePopupEnabled) return;

    privacyPolicyUrl = data.privacyPolicyUrl;
    cookiePopupHidePeriod = data.cookiePopupHidePeriod;
  }

  cookiePopup = document.getElementById("flowappz-cookie-consent");
  if (!cookiePopup) console.error("Cookie popup is enabled but can not find the container!");
  else {
    cookiePopup.style.display = "block";
    cookiePopup.style.zIndex = "99999";
  }
}

function initializeGoogleTagCookieWithDefaultConfig() {
  try {
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 30000,
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

  for (let key in cookiePerferences) {
    document.cookie = `cookiePreferences.${key}=${
      cookiePerferences[key]
    }; Path=/; Expires=${expireyDate.toUTCString()}`;
  }

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
