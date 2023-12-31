/**
 * VERSION: 1.0.2
 */

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
  width: 350px;
  height: 250px;
  left: 35px;
  background-color: white;
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.1);
  padding: 53px 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

const rejectButton = document.createElement("button");
rejectButton.setAttribute("class", "button");
rejectButton.innerText = "Reject all";

const agreeButton = document.createElement("button");
agreeButton.setAttribute("class", "button");
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
privacyPolicyLink.setAttribute("href", "https://google.com");

cookieDescription.append(descriptionText, privacyPolicyLink);

const cookieTitle = document.createElement("h5");
cookieTitle.setAttribute("class", "cookie-heading");
cookieTitle.innerText = "Cookies";

const textWrapperDiv = document.createElement("div");
textWrapperDiv.append(cookieTitle, cookieDescription);

const cookieContainer = document.createElement("div");
cookieContainer.setAttribute("class", "flowappz--cookie-container");
cookieContainer.append(textWrapperDiv, buttonGroup);

document.querySelector("body").appendChild(cookieContainer);

agreeButton.addEventListener("click", () => {
  cookieContainer.classList.add("hide");
});

rejectButton.addEventListener("click", () => {
  cookieContainer.classList.add("hide");
});
