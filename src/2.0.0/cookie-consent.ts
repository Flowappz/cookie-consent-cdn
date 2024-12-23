/**
 * VERSION: 2.0.0
 **/

interface CookiePreferences {
    strictlyNecessary: boolean
    analytics: boolean
    personalization: boolean
    marketing: boolean

    [key: string]: boolean
}

let cookiePopupHidePeriod: string = 'FOREVER'
let consentStoringEndpoint: string = ''
let action: string = ''
let cookiePreferences: CookiePreferences = {
    strictlyNecessary: true,
    analytics: false,
    personalization: false,
    marketing: false,
}

const popup = document.querySelector<HTMLElement>('[flowappz-cookie-popup="true"]')

const showHideManageSettingsBtnByDefault = (displayType: 'none' | 'inline-block' | 'block' | 'flex' = 'none') => {
    const manageSettingsBtn = document.querySelectorAll<HTMLElement>(`[flowappz-cookie-command="manage-settings"]`)

    if (manageSettingsBtn) {
        manageSettingsBtn.forEach((b) => {
            b.style.display = displayType
        })
    }
}

showHideManageSettingsBtnByDefault('none')

// hidePopupByDefault()
console.log('FlowAppz Cookie Consent')

function getCookieByName(cookieName: string): string | null {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
        cookie = cookie.trim()
        if (cookie.startsWith(`${cookieName}=`)) {
            return cookie.substring(cookieName.length + 1)
        }
    }
    return null
}

function updateUiBasedOnCookiePreferences(): void {
    const userPreferences = getCookieByName('cookiePreferences')

    if (userPreferences) {
        cookiePreferences = JSON.parse(userPreferences)
        const togglers = document.querySelectorAll<HTMLInputElement>(`[flowappz-cookie-choice]`)

        togglers.forEach((toggler) => {
            const key = toggler.getAttribute('flowappz-cookie-choice')
            if (key && key in cookiePreferences) {
                toggler.checked = cookiePreferences[key]

                const labelElement = toggler.closest('label')
                if (labelElement) {
                    const customCheckboxDiv = labelElement.querySelector('.w-checkbox-input--inputType-custom')
                    if (customCheckboxDiv) {
                        if (cookiePreferences[key]) {
                            customCheckboxDiv.classList.add('w--redirected-checked')
                        } else {
                            if (key !== 'necessary') {
                                customCheckboxDiv.classList.remove('w--redirected-checked')
                            }
                        }
                    }
                }
            }
        })
    }
}

window.addEventListener('DOMContentLoaded', async function initializeCookieConsentApp() {
    const siteId = document.querySelector('html')?.getAttribute('data-wf-site')

    if (siteId) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cookie-consent/sites/${siteId}`)
        if (res.ok) {
            const data = await res.json()
            cookiePopupHidePeriod = data.cookiePopupHidePeriod
            consentStoringEndpoint = data.consentStoringEndpoint
        }
    }

    enableFreeFunctionality()
    if (siteId && (await hasValidLicenseKey(siteId))) {
        showHideManageSettingsBtnByDefault('flex')
        makeTheCookieConsentInteractive(siteId)
    } else {
        showHideManageSettingsBtnByDefault('none')
    }

    const checkbox = document.querySelector<HTMLInputElement>('[flowappz-cookie-choice="necessary"]')
    if (checkbox) {
        checkbox.setAttribute('disabled', 'true')
    }
    updateUiBasedOnCookiePreferences()
})

async function hasValidLicenseKey(siteId: string): Promise<boolean> {
    const res = await fetch(`${import.meta.env.VITE_LICENSE_VALIDATION_API}/api/license?siteId=${siteId}&appName=cookie-consent`)
    if (res.ok) {
        const data = await res.json()

        return data.active
    }
    return false
}

async function makeTheCookieConsentInteractive(siteId: string): Promise<void> {
    try {
        makeTheUIInteractive()
        connectToGoogleAnalytics(siteId)
    } catch (err) {
        console.log('Error: ', err)
    }
}

function enableFreeFunctionality(): void {
    if (!shouldShowCookiePopup()) return

    if (popup) {
        popup.classList.remove('flowappz-hide-popup')
    }

    const agreeButton = document.querySelector<HTMLElement>(`[flowappz-cookie-command="accept-all"]`)
    if (agreeButton) {
        agreeButton.addEventListener('click', () => {
            let cookiePreferences: CookiePreferences = {
                strictlyNecessary: true,
                personalization: true,
                statistical: true,
                analytics: true,
                marketing: true,
            }
            if (popup) {
                popup.classList.add('flowappz-hide-popup')
            }
            action = 'acceptAll'
            storeCookiePreferences(cookiePreferences)
        })
    }

    const rejectButton = document.querySelector<HTMLElement>(`[flowappz-cookie-command="reject-all"]`)
    if (rejectButton) {
        rejectButton.addEventListener('click', () => {
            if (popup) {
                popup.classList.add('flowappz-hide-popup')
            }
            action = 'rejectAll'
            storeCookiePreferences()
        })
    }
}

function makeTheUIInteractive(): void {
    if (!shouldShowCookiePopup() && popup) {
        popup.classList.add('flowappz-hide-popup')
    }

    preventDefaultFormSubmit()

    const acceptAllButtons = document.querySelectorAll<HTMLElement>(`[flowappz-cookie-command="accept-all"]`)
    acceptAllButtons.forEach((button) => {
        button.addEventListener('click', handleAcceptAll)
    })

    const rejectAllButtons = document.querySelectorAll<HTMLButtonElement>(`[flowappz-cookie-command="reject-all"]`)

    rejectAllButtons.forEach((button) => {
        button.type = 'button'
        button.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            handleRejectAll()
        })
    })

    const acceptSelectedButton = document.querySelector<HTMLElement>(`[flowappz-cookie-command="accept-selected"]`)
    if (acceptSelectedButton) {
        acceptSelectedButton.addEventListener('click', handleCookieAccept)
    }
    // for 1st and 3rd paid template
    const acceptSelectedPopupButton = document.querySelector<HTMLButtonElement>('#flowappz-cc-accept-selected')
    if (acceptSelectedPopupButton) {
        acceptSelectedPopupButton.type = 'button'
        acceptSelectedPopupButton.innerText = 'Confirm My Choices'
        acceptSelectedPopupButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCookieAccept()
        })
    } else {
        console.warn('Accept button in manage settings not found in the DOM.')
    }
    // for 1st and 3rd paid template
    const settingRejectAllButton = document.querySelector<HTMLButtonElement>('#flowappz-cc-setting-rejectall')
    if (settingRejectAllButton) {
        settingRejectAllButton.type = 'button'
        settingRejectAllButton.innerText = 'Reject Cookies'
        settingRejectAllButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            handleRejectAll()
        })
    } else {
        console.warn('Setting reject button not found in the DOM.')
    }

    const settingsUI = document.querySelector<HTMLDivElement>(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) {
        settingsUI.style.display = 'none'
    }

    const manageSettingsButtons = document.querySelectorAll<HTMLElement>('[flowappz-cookie-command="manage-settings"]')
    manageSettingsButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (settingsUI) settingsUI.style.display = 'flex'
        })
    })

    const closeSettingsButton = document.querySelector<HTMLElement>(`[flowappz-cookie-command="close-settings"]`)
    if (closeSettingsButton && settingsUI) {
        closeSettingsButton.addEventListener('click', () => (settingsUI.style.display = 'none'))
    }

    const closePopUpButtons = document.querySelectorAll<HTMLElement>(`[flowappz-cookie-command="close-cookie-popup"]`)
    closePopUpButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const cookiePopUp = document.querySelector<HTMLElement>(`[flowappz-cookie-popup="true"]`)
            if (cookiePopUp) cookiePopUp.style.display = 'none'
        })
    })

    makeCookieTogglersInteractive()
}

function preventDefaultFormSubmit(): void {
    const elements = document.querySelectorAll<HTMLElement>(`[flowappz-cookie-settings-wrapper="true"] [type="submit"]`)
    elements.forEach((el) => el.removeAttribute('type'))
}

function shouldShowCookiePopup(): boolean {
    const cookie = document.cookie.split(';').find((c) => c.includes('hidePopup'))
    return !cookie
}



function makeCookieTogglersInteractive(): void {
    const togglers = document.querySelectorAll<HTMLInputElement>(`[flowappz-cookie-choice]`)

    togglers.forEach((toggler) => {
        toggler.addEventListener('change', () => {
            const key = toggler.getAttribute('flowappz-cookie-choice')
            if (key && key in cookiePreferences) {
                cookiePreferences[key] = toggler.checked
            }
        })
    })
}


async function connectToGoogleAnalytics(siteId: string): Promise<void> {
    try {
        initializeGoogleTagCookieWithDefaultConfig()
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cookie-consent/sites/${siteId}`)
        if (res.ok) {
            const data = await res.json()
            loadGoogleAnalyticsScript(data.googleAnalyticsId)
        }
    } catch (err) {
        console.log('Error: ', err)
    }
}

function initializeGoogleTagCookieWithDefaultConfig(): void {
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

        ;(window as any).gtag('consent', 'default', {
            ad_storage: savedUserPreferences?.marketing ? 'granted' : 'denied',
            ad_user_data: savedUserPreferences?.marketing ? 'granted' : 'denied',
            ad_personalization: savedUserPreferences?.personalization ? 'granted' : 'denied',
            analytics_storage: savedUserPreferences?.statistical ? 'granted' : 'denied',
            wait_for_update: savedUserPreferences ? 0 : 20000,
        })
    } catch (err) {
        console.log(`Error initializing Google tag with default state`, err)
    }
}

function loadGoogleAnalyticsScript(googleAnalyticsId: string): void {
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

function updateGoogleTagCookieConfig(): void {
    try {
        const config = {
                ad_storage: cookiePreferences.marketing ? 'granted' : 'denied',
                ad_user_data: cookiePreferences.marketing ? 'granted' : 'denied',
                ad_personalization: cookiePreferences.personalization ? 'granted' : 'denied',
                analytics_storage: cookiePreferences.analytics ? 'granted' : 'denied',
            }

        ;(window as any).gtag('consent', 'update', config)
    } catch (err) {
        console.log(`Error updating Google tag config`, err)
    }
}

function cookiePreferencesExpiryDate(): Date {
    let numberOfDays = 30

    if (cookiePopupHidePeriod === 'FOREVER') numberOfDays = 10 * 365
    else if (cookiePopupHidePeriod === 'ONE_YEAR') numberOfDays = 365
    else if (cookiePopupHidePeriod === 'SIX_MONTH') numberOfDays = 30 * 6
    else if (cookiePopupHidePeriod === 'THREE_MONTH') numberOfDays = 30 * 3

    const today = new Date()
    return new Date(today.setDate(today.getDate() + numberOfDays))
}

async function storeCookiePreferences(cookieSetup?: CookiePreferences): Promise<void> {
    const expiryDate = cookiePreferencesExpiryDate()

    if (cookieSetup) {
        document.cookie = `cookiePreferences=${JSON.stringify(cookieSetup)}; Path=/; Expires=${expiryDate.toUTCString()}`
        document.cookie = `hidePopup=true; Path=/; Expires=${expiryDate.toUTCString()}`

        if (consentStoringEndpoint.length > 0) {
            try {
                // Gather additional data for GDPR compliance
                const browserInfo = {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                }

                const userIp = await fetch('https://api.ipify.org?format=json')
                    .then((res) => res.json())
                    .then((data) => data.ip)
                    .catch((err) => {
                        console.error('Failed to fetch IP address:', err)
                        return 'Unknown IP'
                    })

                const response = await fetch(consentStoringEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cookiePreferences: cookieSetup,
                        expiryDate: expiryDate.toUTCString(),
                        browserInfo,
                        userIp,
                        action,
                    }),
                })

                if (!response.ok) {
                    console.error(`Failed to store consent preferences: ${response.status} - ${response.statusText}`)
                } else {
                    console.log('Consent preferences successfully stored.')
                }
            } catch (error) {
                console.error('Error storing consent preferences:', error)
            }
        }
    } else {
        document.cookie = `cookiePreferences=${JSON.stringify(cookiePreferences)}; Path=/; Expires=${expiryDate.toUTCString()}`
        document.cookie = `hidePopup=true; Path=/; Expires=${expiryDate.toUTCString()}`

        if (consentStoringEndpoint.length > 0) {
            try {
                // Gather additional data for GDPR compliance
                const browserInfo = {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                }

                const userIp = await fetch('https://api.ipify.org?format=json')
                    .then((res) => res.json())
                    .then((data) => data.ip)
                    .catch((err) => {
                        console.error('Failed to fetch IP address:', err)
                        return 'Unknown IP'
                    })

                const response = await fetch(consentStoringEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cookiePreferences, // Ensure this variable is defined
                        expiryDate: expiryDate.toUTCString(), // Ensure expiryDate is defined
                        browserInfo,
                        userIp,
                        action,
                    }),
                })

                if (!response.ok) {
                    console.error(`Failed to store consent preferences: ${response.status} - ${response.statusText}`)
                } else {
                    console.log('Consent preferences successfully stored.')
                }
            } catch (error) {
                console.error('Error storing consent preferences:', error)
            }
        }
    }
}



function handleCookieAccept(): void {
    console.log('accept button clicked')
    if (popup) {
        popup.classList.add('flowappz-hide-popup')
    }
    const settingsUI = document.querySelector<HTMLElement>(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) {
        settingsUI.style.display = 'none'
    }
    action = 'acceptPreferred'
    storeCookiePreferences()
    updateGoogleTagCookieConfig()
    updateUiBasedOnCookiePreferences()
}

function handleAcceptAll(): void {
    if (popup) {
        popup.classList.add('flowappz-hide-popup')
    }
    const settingsUI = document.querySelector<HTMLElement>(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) {
        settingsUI.style.display = 'none'
    }

    for (let key in cookiePreferences) {
        cookiePreferences[key] = true
    }
    action = 'acceptAll'
    storeCookiePreferences()
    updateGoogleTagCookieConfig()
    updateUiBasedOnCookiePreferences()
}

function handleRejectAll(): void {
    if (popup) {
        popup.classList.add('flowappz-hide-popup')
    }
    const settingsUI = document.querySelector<HTMLElement>(`[flowappz-cookie-settings-wrapper="true"]`)
    if (settingsUI) {
        settingsUI.style.display = 'none'
    }

    for (let key in cookiePreferences) {
        if (key !== 'strictlyNecessary') {
            cookiePreferences[key] = false
        }
    }
    action = 'rejectAll'
    storeCookiePreferences()
    updateGoogleTagCookieConfig()
    updateUiBasedOnCookiePreferences()
}
