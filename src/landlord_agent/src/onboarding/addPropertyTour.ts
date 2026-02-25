import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './addPropertyTour.css';

export type AddPropertyScreen =
  | 'property-setup-step1'
  | 'property-type-selection'
  | 'property-details-selection'
  | 'amenities-selection'
  | 'images-notes-selection'
  | 'property-preview';

const ADD_PROPERTY_SCREENS: AddPropertyScreen[] = [
  'property-setup-step1',
  'property-type-selection',
  'property-details-selection',
  'amenities-selection',
  'images-notes-selection',
  'property-preview',
];

/**
 * Extensible step definitions for the add property tour.
 * Add or edit steps here to customize the flow.
 */
export const ADD_PROPERTY_TOUR_STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
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
  navigateToScreen: (screen: AddPropertyScreen) => void
): DriveStep[] {
  return ADD_PROPERTY_TOUR_STEPS.map((step, index) => {
    const isLast = index === ADD_PROPERTY_TOUR_STEPS.length - 1;
    const isFirst = index === 0;
    const nextScreen = ADD_PROPERTY_SCREENS[index + 1];
    const prevScreen = ADD_PROPERTY_SCREENS[index - 1];

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
              navigateToScreen(nextScreen);
              setTimeout(() => opts.driver.moveNext(), 250);
            },
        onPrevClick: isFirst
          ? undefined
          : (_, __, opts) => {
              navigateToScreen(prevScreen);
              setTimeout(() => opts.driver.movePrevious(), 250);
            },
      },
    };
  });
}

/**
 * Creates the add property tour. Pass navigateToScreen so the tour can
 * advance the wizard when the user clicks Next.
 */
export function createAddPropertyTour(
  navigateToScreen: (screen: AddPropertyScreen) => void
) {
  return driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: buildSteps(navigateToScreen),
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-add-property-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      if (opts.state.activeIndex === ADD_PROPERTY_TOUR_STEPS.length - 1) {
        window.location.href = '/landlord-onboarding';
      }
    },
  });
}

/** Start the add property tour. Requires navigateToScreen from App. */
export function startAddPropertyTour(
  navigateToScreen: (screen: AddPropertyScreen) => void
) {
  const driverObj = createAddPropertyTour(navigateToScreen);
  driverObj.drive();
}
