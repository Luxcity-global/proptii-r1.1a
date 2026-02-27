import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './addPropertyTour.css';
import { markStepComplete } from '../../../utils/gettingStartedProgress';

export type AddPropertyScreen =
  | 'property-setup-step1'
  | 'property-type-selection'
  | 'property-details-selection'
  | 'amenities-selection'
  | 'images-notes-selection'
  | 'property-preview';

/** Screens for each tour step; step 0 is on dashboard, step 1+ are in the wizard. */
const ADD_PROPERTY_SCREENS: AddPropertyScreen[] = [
  'property-setup-step1',   // step 0 next -> go here
  'property-setup-step1',
  'property-type-selection',
  'property-details-selection',
  'amenities-selection',
  'images-notes-selection',
  'property-preview',
];

/**
 * Extensible step definitions for the add property tour.
 * Step 0 highlights the Add Property button on the dashboard; step 1+ are in the wizard.
 */
export const ADD_PROPERTY_TOUR_STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
  {
    element: '[data-demo-add-property-button]',
    title: 'Add new property',
    description: 'Click the "Add Property" button to start adding a new property to your portfolio.',
    side: 'left',
    align: 'center',
  },
  {
    element: '[data-demo-add-property-step1]',
    title: 'Add new property',
    description: 'Start here. You can work through the four sections in order, or jump to any section. Click "Start" to begin with Section 1.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-add-property-type]',
    title: 'Property type',
    description: 'Select the type of property (e.g. house, flat). This helps tenants find the right listings.',
    side: 'bottom',
    align: 'start',
  },
  {
    element: '[data-demo-add-property-for-sale]',
    title: 'Properties for sale',
    description: 'Properties can be listed for sale as well as rent. Toggle this on if your property is for sale—you\'ll be asked to upload an EPC certificate and provide sale details.',
    side: 'bottom',
    align: 'start',
  },
  {
    element: '[data-demo-add-property-amenities]',
    title: 'Amenities',
    description: 'Select the amenities your property offers (parking, garden, etc.).',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-add-property-images]',
    title: 'Images and notes',
    description: 'Upload photos and add any extra notes. Good photos help attract tenants.',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-add-property-publish]',
    title: "You're ready",
    description: 'Review your listing, then click "Publish Property" to make it live. You can always edit it later.',
    side: 'bottom',
    align: 'end',
  },
];

function buildSteps(
  navigateToScreen: (screen: AddPropertyScreen) => void,
  onGoToDashboard: () => void
): DriveStep[] {
  return ADD_PROPERTY_TOUR_STEPS.map((step, index) => {
    const isLast = index === ADD_PROPERTY_TOUR_STEPS.length - 1;
    const isFirst = index === 0;
    const nextScreen = ADD_PROPERTY_SCREENS[index + 1];
    const prevScreen = ADD_PROPERTY_SCREENS[index - 1];
    // Step 1 Back -> go to dashboard (step 0); step 0 has no Back
    const onPrev = isFirst
      ? undefined
      : index === 1
        ? (_, __, opts: { driver: { movePrevious: () => void } }) => {
            onGoToDashboard();
            setTimeout(() => opts.driver.movePrevious(), 250);
          }
        : (_, __, opts: { driver: { movePrevious: () => void } }) => {
            navigateToScreen(prevScreen!);
            setTimeout(() => opts.driver.movePrevious(), 250);
          };

    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? 'top',
        align: step.align ?? 'center',
        onNextClick: isLast
          ? undefined
          : (_, __, opts) => {
              navigateToScreen(nextScreen!);
              setTimeout(() => opts.driver.moveNext(), 250);
            },
        onPrevClick: onPrev,
      },
    };
  });
}

/**
 * Creates the add property tour. Pass navigateToScreen and onGoToDashboard so the tour can
 * advance the wizard and go back to the dashboard when needed.
 */
export function createAddPropertyTour(
  navigateToScreen: (screen: AddPropertyScreen) => void,
  onGoToDashboard: () => void
) {
  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: buildSteps(navigateToScreen, onGoToDashboard),
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-add-property-tour',
    onDestroyStarted: (_, __, opts) => {
      try {
        if (opts.state.activeIndex === ADD_PROPERTY_TOUR_STEPS.length - 1) {
          markStepComplete('landlord', 'addProperty');
        }
      } catch {}
      driverObj.destroy();
    },
  });
  return driverObj;
}

/** Start the add property tour. Requires navigateToScreen and onGoToDashboard from App. */
export function startAddPropertyTour(
  navigateToScreen: (screen: AddPropertyScreen) => void,
  onGoToDashboard: () => void
) {
  const driverObj = createAddPropertyTour(navigateToScreen, onGoToDashboard);
  driverObj.drive();
}
