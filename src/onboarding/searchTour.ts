import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './searchTour.css';
import { markStepComplete } from '../utils/gettingStartedProgress';

const SEARCH_TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-demo-hero-search-input]',
    popover: {
      title: 'Search box',
      description:
        'Type what you\'re looking for in plain English—e.g. "2 bedroom flats to rent in Leeds for 1200pcm". You can use the example below to get started.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-demo-hero-provider-toggle]',
    popover: {
      title: 'Where we search',
      description:
        'Choose "On the Market" for the official property portal, or "Internet Search" to search across the web. If searches fail, try Internet Search for better reliability.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-demo-hero-search-button]',
    popover: {
      title: 'Run your search',
      description: 'When you\'re ready, click here (or press Enter) to see matching properties.',
      side: 'left',
      align: 'center',
    },
  },
  {
    popover: {
      title: "You're all set",
      description:
        'Try the example query or type your own. Need this again? Use "How search works" below to replay this tour.',
      side: 'top',
      align: 'center',
    },
  },
];

/**
 * Creates and returns the Driver.js instance for the search onboarding tour.
 * Call .drive() when you want to start the tour (e.g. on button click).
 */
export function createSearchTour() {
  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: SEARCH_TOUR_STEPS,
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-search-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      try {
        if (opts.state.activeIndex === SEARCH_TOUR_STEPS.length - 1) {
          markStepComplete('tenant', 'search');
        }
      } catch {}
    },
  });
  return driverObj;
}

/** Start the search tour. Safe to call from a click handler; creates the driver and runs it. */
export function startSearchTour() {
  const driverObj = createSearchTour();
  driverObj.drive();
}
