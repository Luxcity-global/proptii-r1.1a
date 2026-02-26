import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './searchTour.css';

const REFERENCING_TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'What referencing does',
      description:
        'Referencing checks your identity, income, and rental history so landlords and agents can confidently approve your application. It usually runs alongside your offer and contract.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-demo-referencing-hero-cta]',
    popover: {
      title: 'Start referencing',
      description:
        'Click here to begin. You\'ll answer a few questions and upload any documents we need. You can pause and come back later if you need to.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-demo-referencing-steps]',
    popover: {
      title: 'What to expect',
      description:
        'You\'ll move through clear sections for identity, employment, address history, finances, and (if needed) a guarantor. We guide you step by step so nothing is missed.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-demo-referencing-steps]',
    popover: {
      title: 'After you submit',
      description:
        'We contact your referees, run the checks, and package everything for your landlord or agent. When you\'re done here, we\'ll take you back to your tenant options.',
      side: 'top',
      align: 'center',
    },
  },
];

export function createReferencingTour() {
  return driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: REFERENCING_TOUR_STEPS,
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-search-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      window.location.href = '/tenant-onboarding';
    },
  });
}

export function startReferencingTour() {
  const driverObj = createReferencingTour();
  driverObj.drive();
}

