/**
 * VERSION: 1.0.1
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
}
.flowappz--cookie-container .button:last-child {
  background-color: white;
  color: black;
}
`);

const sheets = document.adoptedStyleSheets || [];
document.adoptedStyleSheets = [...sheets, sheet];

const rejectButton = document.createElement("button");
rejectButton.innerText = "Reject";

const rejectButtonWrapper = document.createElement("div");
rejectButtonWrapper.setAttribute("class", "agree");
rejectButtonWrapper.appendChild(rejectButton);

const agreeButton = document.createElement("button");
agreeButton.innerText = "Accept";

const agreeButtonWrapper = document.createElement("div");
agreeButtonWrapper.setAttribute("class", "agree");
agreeButtonWrapper.appendChild(agreeButton);

const buttonGroup = document.createElement("div");
buttonGroup.setAttribute("class", "button-group");
buttonGroup.append(rejectButtonWrapper, agreeButtonWrapper);

const cookieText = document.createElement("p");
cookieText.setAttribute("class", "cookie-text");
cookieText.innerText =
  "We use cookies and similar technologies that are necessary to operate the website. Additional cookies are used to perform analysis of website usage.";

const cookieContainer = document.createElement("div");
cookieContainer.setAttribute("class", "cookie-container");
cookieContainer.append(cookieText, buttonGroup);

document.querySelector("body").appendChild(cookieContainer);

agreeButton.addEventListener("click", () => {
  cookieContainer.classList.add("hide");
});

rejectButton.addEventListener("click", () => {
  cookieContainer.classList.add("hide");
});
