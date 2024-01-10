/**
 * VERSION: 1.1.5
 */

function attachCookieConsentStylesheet() {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
  .flowappz--cookie-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: inherit;
  }
  
  .flowappz--cookie-container {
    position: fixed;
    bottom: 5vh;
    width: 400px;
    min-height: 250px;
    height: fit-content;
    left: 35px;
    background-color: white;
    box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.1);
    padding: 53px 50px;
    display: flex;
    gap: 50px;
    flex-direction: column;
    justify-content: space-between;
    z-index: 99999;
  }
  
  .flowappz--cookie-container.hide {
    display: none;
  }
  
  .flowappz--cookie-container .cookie-heading {
    font-weight: bold;
    color: black;
    font-size: 26px;
    line-height: 31.47px;
  }
  
  .flowappz--cookie-container .cookie-description {
    font-weight: 400;
    color: black;
    font-size: 16px;
    line-height: 19.36px;
    margin-top: 25px;
  }
  
  .flowappz--cookie-container a {
    color: black;
  }
  
  .flowappz--cookie-container .button-group {
    display: flex;
    gap: 20px;
  }
  
  .flowappz--cookie-container .button {
    background: black;
    color: white;
    padding: 12px 28px;
    border: none;
    font-weight: bold;
    cursor: pointer;
  }
  .flowappz--cookie-container .button:last-child {
    background-color: white;
    color: black;
  }
  `);

  const sheets = document.adoptedStyleSheets || [];
  document.adoptedStyleSheets = [...sheets, sheet];
}

function createCookiePopup(privacyPolicyUrl) {
  const rejectButton = document.createElement("button");
  rejectButton.setAttribute("class", "button");
  rejectButton.id = "appz--cc-reject-btn";
  rejectButton.innerText = "Reject all";

  const agreeButton = document.createElement("button");
  agreeButton.setAttribute("class", "button");
  agreeButton.id = "appz--cc-accept-btn";
  agreeButton.innerText = "Accept all";

  const buttonGroup = document.createElement("div");
  buttonGroup.setAttribute("class", "button-group");
  buttonGroup.append(agreeButton, rejectButton);

  const cookieDescription = document.createElement("p");
  cookieDescription.setAttribute("class", "cookie-description");

  const descriptionText = document.createTextNode(
    "We use cookies to improve user experience. Choose what cookies you allow us to use. You can read more about our Cookie Policy in our "
  );
  const privacyPolicyLink = document.createElement("a");
  privacyPolicyLink.innerText = "Privacy Policy";
  privacyPolicyLink.setAttribute("href", privacyPolicyUrl);

  cookieDescription.append(descriptionText, privacyPolicyLink);

  const cookieTitle = document.createElement("h5");
  cookieTitle.setAttribute("class", "cookie-heading");
  cookieTitle.innerText = "Cookies";

  const textWrapperDiv = document.createElement("div");
  textWrapperDiv.append(cookieTitle, cookieDescription);

  const cookieContainer = document.createElement("div");
  cookieContainer.setAttribute("class", "flowappz--cookie-container");
  cookieContainer.append(textWrapperDiv, buttonGroup);
  cookieContainer.style.zIndex = "99999";
  cookieContainer.id = "appz--cc-container";

  document.querySelector("body").appendChild(cookieContainer);

  return cookieContainer;
}

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

(async () => {
  try {
    if (!shouldShowCookiePopup()) {
      return;
    }

    attachCookieConsentStylesheet();
    let privacyPolicyUrl = "#";
    let cookiePopupHidePeriod = "FOREVER";

    const res = await fetch(
      `https://cookie-consent-production.up.railway.app/cookie-consent/hostname?hostname=${window.location.hostname}`
    );
    if (res.ok) {
      data = await res.json();
      privacyPolicyUrl = data.privacyPolicyUrl;
      cookiePopupHidePeriod = data.cookiePopupHidePeriod;
    }

    let cookiePopup = document.getElementById("appz--cc-container");
    if (!cookiePopup) cookiePopup = createCookiePopup(privacyPolicyUrl);
    else {
      cookiePopup.style.display = "initial";
      cookiePopup.style.zIndex = "99999";
    }

    const agreeButton = document.getElementById("appz--cc-accept-btn");
    agreeButton.addEventListener("click", () => {
      cookiePopup.style.display = "none";
      setCookieToHidePopup(cookiePopupHidePeriod);
    });

    const rejectButton = document.getElementById("appz--cc-reject-btn");
    if (rejectButton) {
      rejectButton.addEventListener("click", () => {
        cookiePopup.style.display = "none";
        setCookieToHidePopup(cookiePopupHidePeriod);
        document.cookie
          .split(";")
          .filter((c) => c.split("=")[0] !== "hidePopup")
          .map((c) => {
            const cookieKey = c.split("=");
            document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toISOString()}`;
          });
      });
    }
  } catch (err) {
    console.log("Error: ", err);
  }
})();
