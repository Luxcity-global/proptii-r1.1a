import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './searchTour.css';
import { markStepComplete } from '../utils/gettingStartedProgress';

const CONTRACTS_TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-demo-contracts-hero-cta]',
    popover: {
      title: 'Start here',
      description:
        'Click "Get Started" or "Start Contracts" to open the contract flow. You can choose a template, upload your own, or sign a sample agreement.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-demo-contracts-section]',
    popover: {
      title: 'Your documents, secured',
      description:
        'Contracts are stored securely on the platform. Sign digitally, share with landlords or agents, and access them anytime—no printing or scanning needed.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-demo-contracts-features]',
    popover: {
      title: 'What you can do',
      description:
        'Store contracts safely, get real-time alerts when something is signed, and share documents instantly with everyone involved.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-demo-contracts-bottom-cta]',
    popover: {
      title: "You're ready",
      description:
        'Use this button anytime to open the contract flow and manage or sign agreements. Need this guide again? Come back to the Contracts page and look for "How contracts work" below.',
      side: 'top',
      align: 'center',
    },
  },
];

/**
 * Creates and returns the Driver.js instance for the contracts onboarding tour.
 */
export function createContractsTour() {
  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: CONTRACTS_TOUR_STEPS,
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-search-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      try {
        if (opts.state.activeIndex === CONTRACTS_TOUR_STEPS.length - 1) {
          markStepComplete('tenant', 'contracts');
        }
      } catch {}
    },
  });
  return driverObj;
}

/** Start the contracts tour. Safe to call from a click handler. */
export function startContractsTour() {
  const driverObj = createContractsTour();
  driverObj.drive();
}
