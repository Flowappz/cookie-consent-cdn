// import './style.css'

/**
 * VERSION: 1.2.4
 */

declare global {
    interface Window {
        gtag: (...args: any[]) => void
    }
}

let cookiePopup: HTMLElement | null = null
let cookiePopupHidePeriod = 'FOREVER'

type TCookiePreferences = {
    strictlyNecessary: boolean
    functional: boolean
    statistical: boolean
    marketing: boolean
}
type TCookiePreferencesKeys = keyof TCookiePreferences
let cookiePreferences: TCookiePreferences = {
    strictlyNecessary: true,
    functional: true,
    statistical: true,
    marketing: true,
}

let styleSheetToHidePopup: CSSStyleSheet | null = null

hidePopupByDefault()

window.addEventListener('DOMContentLoaded', async function initializeCookieConsentApp() {
    const siteId = document.querySelector('html')?.getAttribute('data-wf-site')
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

async function hasValidLicenseKey(siteId: string | null | undefined) {
    const res = await fetch(`https://cache-service-staging.up.railway.app/api/license?siteId=${siteId}&appName=cookie-consent`)
    if (res.ok) {
        let data = await res.json()
        return data.active
    }
    return false
}

async function makeTheCookieConsentInteractive(siteId: string | null | undefined) {
    try {
        makeTheUIInteractive()
        await connectToGoogleAnalytics(siteId)
    } catch (err) {
        console.log('Error: ', err)
    }
}

function enableFreeFunctionality() {
    if (!shouldShowCookiePopup()) return
    if (!cookiePopup) return
    if (!cookiePopupHidePeriod) return
    if (!styleSheetToHidePopup) return

    styleSheetToHidePopup.disabled = true

    const agreeButton = document.querySelector(`[flowappz-cookie-command="accept-all"]`)
    agreeButton?.addEventListener('click', () => {
        if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = false
        storeCookiePreferences()
    })

    const rejectButton = document.querySelector(`[flowappz-cookie-command="reject-all"]`)
    rejectButton?.addEventListener('click', () => {
        if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = false
        storeCookiePreferences()
    })
}

function makeTheUIInteractive() {
    if (!shouldShowCookiePopup()) return

    preventDefaultFormSubmit()
    if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = true

    const acceptAllButtons = document.querySelectorAll(`[flowappz-cookie-command="accept-all"]`)
    for (let acceptAllButton of acceptAllButtons) {
        acceptAllButton.addEventListener('click', handleAcceptAll)
    }

    const rejectAllButtons = document.querySelectorAll(`[flowappz-cookie-command="reject-all"]`)
    for (let rejectAllButton of rejectAllButtons) {
        rejectAllButton.addEventListener('click', handleRejectAll)
    }

    const acceptSelectedButton = document.querySelector(`[flowappz-cookie-command="accept-selected"]`)
    acceptSelectedButton?.addEventListener('click', handleCookieAccept)

    const settingsUI: HTMLDivElement | null = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) settingsUI.style.display = 'none'
    const manageSettingsButtons = document.querySelectorAll(`[flowappz-cookie-command="manage-settings"]`)
    for (let settingsButton of manageSettingsButtons) {
        settingsButton.addEventListener('click', () => {
            if (settingsUI) settingsUI.style.display = 'flex'
        })
    }

    const closeSettingsButton = document.querySelector(`[flowappz-cookie-command="close-settings"]`)
    closeSettingsButton?.addEventListener('click', () => {
        if (settingsUI) settingsUI.style.display = 'none'
    })

    makeCookieTogglesInteractive()
}

function preventDefaultFormSubmit() {
    const elements = document.querySelectorAll(`[flowappz-cookie-settings-wrapper="true"] [type="submit"]`)
    for (let el of elements) el.removeAttribute('type')
}

function shouldShowCookiePopup() {
    const cookie = document.cookie.split(';').find((c) => c.includes('hidePopup'))
    return !cookie
}

// function setCookieToHidePopup(hidePeriod: string) {
//     let numberOfDays = 30
//
//     if (hidePeriod === 'FOREVER') numberOfDays = 10 * 365
//     else if (hidePeriod === 'ONE_YEAR') numberOfDays = 365
//     else if (hidePeriod === 'SIX_MONTH') numberOfDays = 30 * 6
//     else if (hidePeriod === 'THREE_MONTH') numberOfDays = 30 * 3
//
//     const today = new Date()
//     const expiryDate = new Date(today.setDate(today.getDate() + numberOfDays))
//     document.cookie = `hidePopup=true; Path=/; Expires=${expiryDate.toUTCString()}`
// }

function hidePopupByDefault() {
    styleSheetToHidePopup = new CSSStyleSheet()

    styleSheetToHidePopup.replaceSync(`[flowappz-cookie-popup="true"] {display: none;}`)

    document.adoptedStyleSheets.push(styleSheetToHidePopup)
}

// async function deleteCookiesUsingCookieStore() {
//     const cookies = await cookieStore.getAll()
//
//     for (let cookie of cookies) {
//         const { name, domain, path } = cookie
//         if (name.trim() !== 'hidePopup') await cookieStore.delete({ name, domain, path })
//     }
// }

// function expireCookies() {
//     document.cookie
//         .split(';')
//         .filter((c) => c.split('=')[0].trim() !== 'hidePopup')
//         .map((c) => {
//             const cookieKey = c.split('=')[0]
//             document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}`
//             document.cookie = `${cookieKey}=; Path=/; Expires=${new Date().toUTCString()}; domain=.${window.location.host}`
//         })
// }

function makeCookieTogglesInteractive() {
    const toggles: NodeListOf<HTMLInputElement> = document.querySelectorAll(`[flowappz-cookie-choice]`)

    for (let toggle of toggles) {
        toggle.addEventListener('change', () => {
            let key = toggle.getAttribute('flowappz-cookie-choice')
            if (key === 'personalization') key = 'functional'
            cookiePreferences[key as TCookiePreferencesKeys] = toggle.checked
        })
    }

    // toggles.forEach((toggles) => {
    //   toggles.addEventListener("click", () => {
    //     const key = toggles.getAttribute("key");
    //     const isChecked = toggles.getAttribute("checked");
    //     if (isChecked === null) {
    //       toggles.setAttribute("checked", "true");
    //       cookiePreferences[key] = true;
    //     } else {
    //       toggles.removeAttribute("checked");
    //       cookiePreferences[key] = false;
    //     }
    //   });
    // });
}

// async function loadCookiePopup() {
//     if (!shouldShowCookiePopup()) {
//         return
//     }
//
//     makeCookieTogglesInteractive()
//
//     const siteId = document.querySelector('html')?.getAttribute('data-wf-site')
//     const res = await fetch(`https://cookie-consent-production.up.railway.app/api/cookie-consent/${siteId}`)
//     if (res.ok) {
//         let data = await res.json()
//
//         if (!data.cookiePopupEnabled) return
//
//         let privacyPolicyUrl = data.privacyPolicyUrl
//         cookiePopupHidePeriod = data.cookiePopupHidePeriod
//     }
//
//     cookiePopup = document.getElementById('flowappz-cookie-consent')
//     if (!cookiePopup) console.error('Cookie popup is enabled but can not find the container!')
//     else {
//         cookiePopup.style.display = 'flex'
//         cookiePopup.style.zIndex = '99999'
//     }
// }

async function connectToGoogleAnalytics(siteId: string | null | undefined) {
    try {
        initializeGoogleTagCookieWithDefaultConfig()

        const res = await fetch(`https://cookie-consent-production.up.railway.app/api/cookie-consent/sites/${siteId}`)
        if (res.ok) {
            let data = await res.json()
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
        // Define dataLayer and the gtag function.
        gtagFunctionDeclarationScript.textContent = `window.dataLayer = window.dataLayer || [];function gtag() {dataLayer.push(arguments);}`
        document.head.appendChild(gtagFunctionDeclarationScript)

        const userPreferenceCookie = document.cookie.split(';').find((c) => c.startsWith('cookiePreferences'))
        const savedUserPreferences = userPreferenceCookie ? JSON.parse(userPreferenceCookie.split('=')?.[1]) : null

        window.gtag('consent', 'default', {
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

function loadGoogleAnalyticsScript(googleAnalyticsId: string) {
    const googleAnalyticsScript = document.createElement('script')
    googleAnalyticsScript.async = true
    googleAnalyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`

    document.head.append(googleAnalyticsScript)

    const connectAnalyticsScript = document.createElement('script')
    connectAnalyticsScript.textContent = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${googleAnalyticsId}');`

    document.head.append(connectAnalyticsScript)
}

function updateGoogleTagCookieConfig() {
    try {
        const config = {
            ad_storage: cookiePreferences.marketing ? 'granted' : 'denied',
            ad_user_data: cookiePreferences.marketing ? 'granted' : 'denied',
            ad_personalization: cookiePreferences.marketing ? 'granted' : 'denied',

            analytics_storage: cookiePreferences.statistical ? 'granted' : 'denied',
        }

        window.gtag('consent', 'update', config)
    } catch (err) {
        console.log(`Error updating Google tag config`, err)
    }
}

function cookiePreferencesExpiryDate() {
    let numberOfDays = 30

    if (cookiePopupHidePeriod === 'FOREVER') numberOfDays = 10 * 365
    else if (cookiePopupHidePeriod === 'ONE_YEAR') numberOfDays = 365
    else if (cookiePopupHidePeriod === 'SIX_MONTH') numberOfDays = 30 * 6
    else if (cookiePopupHidePeriod === 'THREE_MONTH') numberOfDays = 30 * 3

    const today = new Date()
    return new Date(today.setDate(today.getDate() + numberOfDays))
}

function storeCookiePreferences() {
    const expiryDate = cookiePreferencesExpiryDate()

    document.cookie = `cookiePreferences=${JSON.stringify(cookiePreferences)}; Path=/; Expires=${expiryDate.toUTCString()}`
    document.cookie = `hidePopup=true; Path=/; Expires=${expiryDate.toUTCString()}`
}

// function handleCookieReject() {
//     if (cookiePopup) cookiePopup.style.display = 'none'
//
//     for (let key in cookiePreferences) {
//         cookiePreferences[key as TCookiePreferencesKeys] = false
//     }
//
//     storeCookiePreferences()
//     updateGoogleTagCookieConfig()
// }

function handleCookieAccept() {
    if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = false
    const settingsUI: HTMLElement | null = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) settingsUI.style.display = 'none'

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}

function handleAcceptAll() {
    if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = false
    const settingsUI: HTMLElement | null = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) settingsUI.style.display = 'none'

    for (let key in cookiePreferences) {
        cookiePreferences[key as TCookiePreferencesKeys] = true
    }

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}

function handleRejectAll() {
    if (styleSheetToHidePopup) styleSheetToHidePopup.disabled = false

    const settingsUI: HTMLElement | null = document.querySelector(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) settingsUI.style.display = 'none'

    for (let key in cookiePreferences) {
        cookiePreferences[key as TCookiePreferencesKeys] = false
    }

    storeCookiePreferences()
    updateGoogleTagCookieConfig()
}
