import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './sendContractTour.css';
import { markStepComplete } from '../../../utils/gettingStartedProgress';

const SEND_CONTRACT_EVENT = 'proptii-open-send-contract-modal';

const SEND_CONTRACT_STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
  {
    element: '[data-demo-send-contract-nav="1"]',
    title: 'Start from Dashboard',
    description: 'Navigate to Contracts to send agreements to tenants. Click "Contracts" in the sidebar.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-send-contract-cta="1"]',
    title: 'Send Contract',
    description: 'Click the Send Contract button to open the send dialog.',
    side: 'bottom',
    align: 'center',
  },
  {
    element: '[data-demo-send-contract-manual="1"]',
    title: 'Manual Entry',
    description: 'Enter the recipient name and email when you know the details. Use this for new tenants or external recipients.',
    side: 'top',
    align: 'start',
  },
  {
    element: '[data-demo-send-contract-recipient-type="1"]',
    title: 'Select Existing Tenant',
    description: 'Choose "Select Existing Tenant" to pick from your tenant list. Name and email are filled in automatically.',
    side: 'top',
    align: 'start',
  },
  {
    element: '[data-demo-send-contract-upload="1"]',
    title: 'Upload & Send',
    description: 'Upload your contract (PDF or Word, up to 50MB), add optional notes, then click Send Contract. The tenant receives it by email.',
    side: 'top',
    align: 'center',
  },
];

type NavScreen = 'dashboard' | 'contracts';

function buildSteps(
  setNavigationScreen: (nav: NavScreen) => void
): DriveStep[] {
  return SEND_CONTRACT_STEPS.map((step, index) => {
    const isLast = index === SEND_CONTRACT_STEPS.length - 1;
    const isFirst = index === 0;

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
              if (index === 0) {
                setNavigationScreen('contracts');
              } else if (index === 1) {
                window.dispatchEvent(new CustomEvent(SEND_CONTRACT_EVENT));
              }
              setTimeout(() => opts.driver.moveNext(), 250);
            },
        onPrevClick: isFirst
          ? undefined
          : (_, __, opts) => {
              if (index === 1) {
                setNavigationScreen('dashboard');
              } else if (index === 2) {
                window.dispatchEvent(new CustomEvent('proptii-close-send-contract-modal'));
              }
              setTimeout(() => opts.driver.movePrevious(), 250);
            },
      },
    };
  });
}

export function createSendContractTour(
  setNavigationScreen: (nav: NavScreen) => void
) {
  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: buildSteps(setNavigationScreen),
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-send-contract-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      try {
        if (opts.state.activeIndex === SEND_CONTRACT_STEPS.length - 1) {
          markStepComplete('landlord', 'sendContract');
        }
      } catch {}
    },
  });
  return driverObj;
}

export function startSendContractTour(
  setNavigationScreen: (nav: NavScreen) => void
) {
  const driverObj = createSendContractTour(setNavigationScreen);
  driverObj.drive();
}
