/**
 * VERSION: 1.2.4
 */

let cookiePopup = null
let cookiePopupHidePeriod = 'FOREVER'
let cookiePerferences = {
    strictlyNecessary: true,
    functional: true,
    statistical: true,
    marketing: true,
}

/** @type {StyleSheet} */
let styleSheetToHidePopup = null

hidePopupByDefault()

window.addEventListener('DOMContentLoaded', async function initializeCookieConsentApp() {
    const siteId = document.querySelector('html').getAttribute('data-wf-site')
    if (await hasValidLicenseKey(siteId)) await makeTheCookieConsentInteractive(siteId)
    else enableFreeFunctionality()
})

// window.addEventListener("DOMContentLoaded", async () => {
//   try {
//     initializeGoogleTagCookieWithDefaultConfig();
//     await loadCookiePopup();

//     const agreeButton = document.getElementById("flowappz-cookie-consent-approve");
//     agreeButton.tabIndex = 0;
//     agreeButton.addEventListener("click", handleCookieAccept);

//     const rejectButton = document.getElementById("flowappz-cookie-consent-reject");
//     if (rejectButton) {
//       rejectButton.tabIndex = 0;
//       rejectButton.addEventListener("click", handleCookieReject);
//     }
//   } catch (err) {
//     console.log("Error: ", err);
//   }
// });

async function hasValidLicenseKey(siteId) {
    const res = await fetch(`https://cache-service-staging.up.railway.app/api/license?siteId=${siteId}&appName=cookie-consent`)
    if (res.ok) {
        data = await res.json()

        return data.active
    }
    return false
}

async function makeTheCookieConsentInteractive(siteId) {
    try {
        makeTheUIInteractive()
        connectToGoogleAnalytics(siteId)
    } catch (err) {
        console.log('Error: ', err)
    }
}

function enableFreeFunctionality() {
    if (!shouldShowCookiePopup()) return

    styleSheetToHidePopup.disabled = true

    const agreeButton = document.querySelector(`[flowappz-cookie-command="accept-all"]`)
    agreeButton.addEventListener('click', () => {
        styleSheetToHidePopup.disabled = false
        storeCookiePreferences()
    })
    // TODO: FIX FUNCTION CALL
    const rejectButton = document.querySelector(`[flowappz-cookie-command="reject-all"]`)
    rejectButton.addEventListener('click', () => () => {
        styleSheetToHidePopup.disabled = false
        storeCookiePreferences()
    })
}

function makeTheUIInteractive() {
    if (!shouldShowCookiePopup()) return

    preventDefaultFormSubmit()
    styleSheetToHidePopup.disabled = true

    const acceptAllButtons = document.querySelectorAll(`[flowappz-cookie-command="accept-all"]`)
    for (let acceptAllButton of acceptAllButtons) {
        acceptAllButton.addEventListener('click', handleAcceptAll)
    }

    const rejectAllButtons = document.querySelectorAll(`[flowappz-cookie-command="reject-all"]`)
    for (let rejectAllButton of rejectAllButtons) {
        rejectAllButton.addEventListener('click', handleRejectAll)
    }

    const acceptSelectedButton = document.querySelector(`[flowappz-cookie-command="accept-selected"]`)
    acceptSelectedButton.addEventListener('click', handleCookieAccept)

    /** @type {HTMLDivElement} */
    const settingsUI = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    settingsUI.style.display = 'none'
    const manageSettingsButtons = document.querySelectorAll(`[flowappz-cookie-command="manage-settings"]`)
    for (let settingsButton of manageSettingsButtons) {
        settingsButton.addEventListener('click', () => (settingsUI.style.display = 'flex'))
    }

    const closeSettingsButton = document.querySelector(`[flowappz-cookie-command="close-settings"]`)
    closeSettingsButton.addEventListener('click', () => (settingsUI.style.display = 'none'))

    makeCookieTogglersInteractive()
}

function preventDefaultFormSubmit() {
    const elements = document.querySelectorAll(`[flowappz-cookie-settings-wrapper="true"] [type="submit"]`)
    for (let el of elements) el.removeAttribute('type')
}

function shouldShowCookiePopup() {
    const cookie = document.cookie.split(';').find((c) => c.includes('hidePopup'))
    if (cookie) return false
    return true
}

function setCookieToHidePopup(hidePeriod) {
    let numberOfDays = 30

    if (hidePeriod === 'FOREVER') numberOfDays = 10 * 365
    else if (hidePeriod === 'ONE_YEAR') numberOfDays = 365
    else if (hidePeriod === 'SIX_MONTH') numberOfDays = 30 * 6
    else if (hidePeriod === 'THREE_MONTH') numberOfDays = 30 * 3

    const today = new Date()
    const expireyDate = new Date(today.setDate(today.getDate() + numberOfDays))
    document.cookie = `hidePopup=true; Path=/; Expires=${expireyDate.toUTCString()}`
}

function hidePopupByDefault() {
    styleSheetToHidePopup = new CSSStyleSheet()

    styleSheetToHidePopup.replaceSync(`
    [flowappz-cookie-popup="true"] {
      display: none;
    }
  `)

    document.adoptedStyleSheets.push(styleSheetToHidePopup)
}

async function deleteCookiesUsingCookieStore() {
    const cookies = await cookieStore.getAll()

    for (let cookie of cookies) {
        const { name, domain, path } = cookie
        if (name.trim() !== 'hidePopup') await cookieStore.delete({ name, domain, path })
    }
}

function expireCookies() {
    document.cookie
        .split(';')
        .filter((c) => c.split('=')[0].trim() !== 'hidePopup')
        .map((c) => {
            const cookieKey = c.split('=')[0]
            document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}`
            document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}; domain=.${window.location.host}`
        })
}

function makeCookieTogglersInteractive() {
    /** @type {NodeListOf<HTMLInputElement>} */
    const togglers = document.querySelectorAll(`[flowappz-cookie-choice]`)

    for (let toggler of togglers) {
        toggler.addEventListener('change', () => {
            let key = toggler.getAttribute('flowappz-cookie-choice')
            if (key === 'personalization') key = 'functional'

            if (toggler.checked) cookiePerferences[key] = true
            else cookiePerferences[key] = false
        })
    }

    // togglers.forEach((toggler) => {
    //   toggler.addEventListener("click", () => {
    //     const key = toggler.getAttribute("key");
    //     const isChecked = toggler.getAttribute("checked");
    //     if (isChecked === null) {
    //       toggler.setAttribute("checked", "true");
    //       cookiePerferences[key] = true;
    //     } else {
    //       toggler.removeAttribute("checked");
    //       cookiePerferences[key] = false;
    //     }
    //   });
    // });
}

async function loadCookiePopup() {
    if (!shouldShowCookiePopup()) {
        return
    }

    makeCookieTogglersInteractive()

    const siteId = document.querySelector('html').getAttribute('data-wf-site')
    const res = await fetch(`https://cookie-consent-production.up.railway.app/api/cookie-consent/${siteId}`)
    if (res.ok) {
        data = await res.json()

        if (!data.cookiePopupEnabled) return

        privacyPolicyUrl = data.privacyPolicyUrl
        cookiePopupHidePeriod = data.cookiePopupHidePeriod
    }

    cookiePopup = document.getElementById('flowappz-cookie-consent')
    if (!cookiePopup) console.error('Cookie popup is enabled but can not find the container!')
    else {
        cookiePopup.style.display = 'flex'
        cookiePopup.style.zIndex = '99999'
    }
}

async function connectToGoogleAnalytics(siteId) {
    try {
        initializeGoogleTagCookieWithDefaultConfig()

        const res = await fetch(`https://cookie-consent-production.up.railway.app/api/cookie-consent/sites/${siteId}`)
        if (res.ok) {
            data = await res.json()
            loadGoogleAnalyticsScript(data.googleAnalyticsId)
        }
    } catch (err) {
        console.log('Error: ', err)
    }
}

function initializeGoogleTagCookieWithDefaultConfig() {
    try {
        const gtagFunctionDeclarationScript = document.createElement('script')
        gtagFunctionDeclarationScript.setAttribute('foo', 'true')
        gtagFunctionDeclarationScript.textContent = `
    // Define dataLayer and the gtag function.
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    `
        document.head.appendChild(gtagFunctionDeclarationScript)

        const userPreferenceCookie = document.cookie.split(';').find((c) => c.startsWith('cookiePreferences'))
        const savedUserPreferences = userPreferenceCookie ? JSON.parse(userPreferenceCookie.split('=')?.[1]) : null

        gtag('consent', 'default', {
            ad_storage: savedUserPreferences?.marketing ? 'granted' : 'denied',
            ad_user_data: savedUserPreferences?.marketing ? 'granted' : 'denied',
            ad_personalization: savedUserPreferences?.marketing ? 'granted' : 'denied',
            analytics_storage: savedUserPreferences?.statistical ? 'granted' : 'denied',
            wait_for_update: savedUserPreferences ? 0 : 20000,
        })
    } catch (err) {
        console.log(`Error initializing Google tag with default state`, err)
    }
}

function loadGoogleAnalyticsScript(googleAnalyticsId) {
    const googleAnalyticsScript = document.createElement('script')
    googleAnalyticsScript.async = true
    googleAnalyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`

    document.head.append(googleAnalyticsScript)

    const connectAnalyticsScript = document.createElement('script')
    connectAnalyticsScript.textContent = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${googleAnalyticsId}');
  `

    document.head.append(connectAnalyticsScript)
}

function updateGoogleTagCookieConfig() {
    try {
        const config = {
            ad_storage: cookiePerferences.marketing ? 'granted' : 'denied',
            ad_user_data: cookiePerferences.marketing ? 'granted' : 'denied',
            ad_personalization: cookiePerferences.marketing ? 'granted' : 'denied',

            analytics_storage: cookiePerferences.statistical ? 'granted' : 'denied',
        }

        gtag('consent', 'update', config)
    } catch (err) {
        console.log(`Error updating Google tag config`, err)
    }
}

function cookiePreferencesExpireyDate() {
    let numberOfDays = 30

    if (cookiePopupHidePeriod === 'FOREVER') numberOfDays = 10 * 365
    else if (cookiePopupHidePeriod === 'ONE_YEAR') numberOfDays = 365
    else if (cookiePopupHidePeriod === 'SIX_MONTH') numberOfDays = 30 * 6
    else if (cookiePopupHidePeriod === 'THREE_MONTH') numberOfDays = 30 * 3

    const today = new Date()
    const expireyDate = new Date(today.setDate(today.getDate() + numberOfDays))

    return expireyDate
}

function storeCookiePreferences() {
    const expireyDate = cookiePreferencesExpireyDate()

    document.cookie = `cookiePreferences=${JSON.stringify(cookiePerferences)}; Path=/; Expires=${expireyDate.toUTCString()}`
    document.cookie = `hidePopup=true; Path=/; Expires=${expireyDate.toUTCString()}`
}

function handleCookieReject() {
    cookiePopup.style.display = 'none'

    for (let key in cookiePerferences) {
        cookiePerferences[key] = false
    }

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}

function handleCookieAccept() {
    styleSheetToHidePopup.disabled = false
    const settingsUI = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    settingsUI.style.display = 'none'

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}

function handleAcceptAll() {
    styleSheetToHidePopup.disabled = false
    const settingsUI = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    settingsUI.style.display = 'none'

    for (let key in cookiePerferences) {
        cookiePerferences[key] = true
    }

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}

function handleRejectAll() {
    styleSheetToHidePopup.disabled = false
    const settingsUI = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    settingsUI.style.display = 'none'

    for (let key in cookiePerferences) {
        cookiePerferences[key] = false
    }

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}
