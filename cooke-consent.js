/**
 * VERSION: 1.0.1
 */

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
.cookie-container {
	display: flex;
	align-content: center;
	align-items: center;
	padding: 1rem 2rem;
	background: #007af7;
	color: #fff;
	position: fixed;
	bottom:0;
  left: 0;
	font-size: 1rem;
	gap: 2rem;
	opacity: 1;
	flex-wrap: wrap;
  width: 100vw;
}

.cookie-container.hide {
	opacity: 0;
	display: none;
}

.cookie-container a {
	color: var(--white-color);
}

.cookie-container a:hover {
	color: var(--hover-text);
}

.cookie-container .cookie-text {
	flex: 8 768px;
}

.cookie-container .button-group {
  display: flex;
  gap: 5px;
}

.cookie-container .agree {
	text-align: center;
}

.agree button {
	background: #fff;
	color: #007af7;
	border: none;
	padding: 0.4rem 1.2rem;
	cursor: pointer;
	border-radius: 20px;
	font-size: 1rem;
}

.agree button:hover {
	background: #000;
		color: #fff;
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
