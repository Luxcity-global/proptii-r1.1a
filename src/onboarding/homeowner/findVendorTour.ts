import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './homeownerTours.css';

type HomeownerNavScreen = 'dashboard' | 'maintenance' | 'projects';

const VENDOR_SEARCH_EVENT = 'homeowner-open-vendor-search';
const VENDOR_SEARCH_CLOSE_EVENT = 'homeowner-close-vendor-search';

const STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
  {
    element: '[data-demo-homeowner-maintenance="1"]',
    title: 'Start from Dashboard',
    description: 'Navigate to Maintenance to find local tradespeople. Click "Maintenance" in the sidebar.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-homeowner-vendor-finder="1"]',
    title: 'Vendor Finder',
    description: 'Click Vendor Finder to search for plumbers, electricians, handymen, and more in your area.',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-homeowner-vendor-search-area="1"]',
    title: 'Search for Vendors',
    description: 'Enter your postcode and choose the type of trade. Search to see ratings, contact details, and links to trusted UK trade platforms.',
    side: 'bottom',
    align: 'start',
  },
];

function buildSteps(setCurrentScreen: (screen: HomeownerNavScreen) => void): DriveStep[] {
  return STEPS.map((step, index) => {
    const isLast = index === STEPS.length - 1;
    const isFirst = index === 0;
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? 'top',
        align: step.align ?? 'center',
        onNextClick: isLast ? undefined : (_, __, opts) => {
          if (index === 0) setCurrentScreen('maintenance');
          else if (index === 1) window.dispatchEvent(new CustomEvent(VENDOR_SEARCH_EVENT));
          setTimeout(() => opts.driver.moveNext(), 250);
        },
        onPrevClick: isFirst ? undefined : (_, __, opts) => {
          if (index === 1) setCurrentScreen('dashboard');
          else if (index === 2) window.dispatchEvent(new CustomEvent(VENDOR_SEARCH_CLOSE_EVENT));
          setTimeout(() => opts.driver.movePrevious(), 250);
        },
      },
    };
  });
}

export function createFindVendorTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
  return driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: buildSteps(setCurrentScreen),
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-homeowner-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      if (opts.state.activeIndex === STEPS.length - 1) {
        window.location.href = '/homeowner-onboarding';
      }
    },
  });
}

export function startFindVendorTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
  const d = createFindVendorTour(setCurrentScreen);
  d.drive();
}
