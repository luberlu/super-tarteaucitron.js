export interface MeringueParams {
    adblocker?: boolean;
    hashtag?: string;
    cookieName?: string;
    highPrivacy?: boolean;
    orientation?: 'middle' | 'top' | 'bottom';
    bodyPosition?: 'top' | 'bottom';
    removeCredit?: boolean;
    showAlertSmall?: boolean;
    showDetailsOnClick?: boolean;
    showIcon?: boolean;
    iconPosition?: 'BottomRight' | 'BottomLeft' | 'TopRight' | 'TopLeft';
    cookieslist?: boolean;
    handleBrowserDNTRequest?: boolean;
    DenyAllCta?: boolean;
    AcceptAllCta?: boolean;
    moreInfoLink?: boolean;
    privacyUrl?: string;
    useExternalCss?: boolean;
    useExternalJs?: boolean;
    mandatory?: boolean;
    mandatoryCta?: boolean;
    closePopup?: boolean;
    groupServices?: boolean;
    readmoreLink?: string;
    serviceDefaultState?: 'wait' | 'allow' | 'deny';
    googleConsentMode?: boolean;
    partnersList?: boolean;
    alwaysNeedConsent?: boolean;
    cookieDomain?: string
}

export interface Service {
    key: string,
    type: string,
    name: string,
    needConsent: boolean,
}