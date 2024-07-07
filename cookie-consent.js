/**
 * VERSION: 1.1.15
 */

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

const hidePopupByDefault = () => {
  const styleSheet = new CSSStyleSheet();

  styleSheet.replaceSync(`
    .flowappz-cookie-consent {
      display: none;
    }
  `);

  document.adoptedStyleSheets.push(styleSheet);
};

const deleteCookiesUsingCookieStore = async () => {
  const cookies = await cookieStore.getAll();

  for (let cookie of cookies) {
    const { name, domain, path } = cookie;
    if (name.trim() !== "hidePopup") await cookieStore.delete({ name, domain, path });
  }
};

const expireCookies = () => {
  document.cookie
    .split(";")
    .filter((c) => c.split("=")[0].trim() !== "hidePopup")
    .map((c) => {
      const cookieKey = c.split("=")[0];
      document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}`;
      document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}; domain=.${window.location.host}`;
    });
};

const attachCssStyle = () => {
  const styleSheet = new CSSStyleSheet();

  styleSheet.replaceSync(`
    .cookie-consent-switch-root[checked] {
      background-color: black;
    }

    .cookie-consent-switch-root[checked] .cookie-consent-slider {
      right: 5px;
      left: auto;
    }
  `);

  document.adoptedStyleSheets.push(styleSheet);
};

hidePopupByDefault();
attachCssStyle();


let cookiePopupHidePeriod = "FOREVER";

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

  let cookiePopup = document.getElementById("flowappz-cookie-consent");
  if (!cookiePopup) console.error("Cookie popup is enabled but can not find the container!");
  else {
    cookiePopup.style.display = "block";
    cookiePopup.style.zIndex = "99999";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
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
      rejectButton.addEventListener("click", async () => {
        try {
          cookiePopup.style.display = "none";
          setCookieToHidePopup(cookiePopupHidePeriod);

          await deleteCookiesUsingCookieStore();
        } catch (err) {
          console.log("Cookie consent - CookieStore API not supported!");
          expireCookies();
        }
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
});
