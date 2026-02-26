import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './addTenantTour.css';
import { markStepComplete } from '../../../utils/gettingStartedProgress';

const ADD_TENANT_STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
  {
    element: '[data-demo-add-tenant-clients="1"]',
    title: 'Start from Dashboard',
    description: 'Navigate to Clients to manage tenants and add new ones. Click "Clients" in the sidebar.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-add-tenant-cta="1"]',
    title: 'Add Tenant',
    description: 'Click the Add Tenant button to choose how you want to add a tenant.',
    side: 'bottom',
    align: 'center',
  },
  {
    element: '[data-demo-add-tenant-option="manual"]',
    title: 'Manual Input',
    description: 'Add tenant details directly when you have all their information—complete profile setup, direct property assignment, and immediate tenant creation.',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-add-tenant-option="invite"]',
    title: 'Invite via Email',
    description: 'Send an invitation email when you have limited tenant details. The tenant receives the email, completes their own profile, and you verify the property assignment.',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-add-tenant-option="existing"]',
    title: 'Select Existing User',
    description: 'Assign an existing tenant from the database to a property. Search the tenant list, assign quickly, and a verification request is sent.',
    side: 'top',
    align: 'center',
  },
];

type NavScreen = 'dashboard' | 'clients';
type MainScreen = 'main-app' | 'tenant-selection';

function buildSteps(
  setNavigationScreen: (nav: NavScreen) => void,
  setCurrentScreen: (screen: MainScreen) => void
): DriveStep[] {
  return ADD_TENANT_STEPS.map((step, index) => {
    const isLast = index === ADD_TENANT_STEPS.length - 1;
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
                setNavigationScreen('clients');
              } else if (index === 1) {
                setCurrentScreen('tenant-selection');
              }
              setTimeout(() => opts.driver.moveNext(), 250);
            },
        onPrevClick: isFirst
          ? undefined
          : (_, __, opts) => {
              if (index === 1) {
                setNavigationScreen('dashboard');
              } else if (index === 2) {
                setCurrentScreen('main-app');
                setNavigationScreen('clients');
              }
              setTimeout(() => opts.driver.movePrevious(), 250);
            },
      },
    };
  });
}

export function createAddTenantTour(
  setNavigationScreen: (nav: NavScreen) => void,
  setCurrentScreen: (screen: MainScreen) => void
) {
  return driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: buildSteps(setNavigationScreen, setCurrentScreen),
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    popoverClass: 'proptii-add-tenant-tour',
    onDestroyStarted: (_, __, opts) => {
      opts.driver.destroy();
      if (opts.state.activeIndex === ADD_TENANT_STEPS.length - 1) {
        markStepComplete('landlord', 'addTenant');
        window.location.href = '/landlord-onboarding';
      }
    },
  });
}

export function startAddTenantTour(
  setNavigationScreen: (nav: NavScreen) => void,
  setCurrentScreen: (screen: MainScreen) => void
) {
  const driverObj = createAddTenantTour(setNavigationScreen, setCurrentScreen);
  driverObj.drive();
}
