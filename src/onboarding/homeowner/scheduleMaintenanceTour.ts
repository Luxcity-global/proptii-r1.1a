import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './homeownerTours.css';

type HomeownerNavScreen = 'dashboard' | 'maintenance';

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
    description: 'Navigate to Maintenance to schedule tasks. Click "Maintenance" in the sidebar.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-homeowner-add-task="1"]',
    title: 'Add Task',
    description: 'Click Add Task to create a maintenance item manually. Enter title, category, due date, cost, and notes.',
    side: 'bottom',
    align: 'center',
  },
  {
    element: '[data-demo-homeowner-templates="1"]',
    title: 'Browse Templates',
    description: 'Use the Maintenance Scheduler to browse 30+ pre-built tasks (boiler service, EICR, etc.) and add them with one click.',
    side: 'top',
    align: 'center',
  },
  {
    element: '[data-demo-homeowner-diy-guides="1"]',
    title: 'DIY Guides',
    description: 'Get step-by-step instructions for common home maintenance tasks with safety tips and tool lists.',
    side: 'top',
    align: 'center',
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
          setTimeout(() => opts.driver.moveNext(), 250);
        },
        onPrevClick: isFirst ? undefined : (_, __, opts) => {
          if (index === 1) setCurrentScreen('dashboard');
          setTimeout(() => opts.driver.movePrevious(), 250);
        },
      },
    };
  });
}

export function createScheduleMaintenanceTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
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

export function startScheduleMaintenanceTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
  const d = createScheduleMaintenanceTour(setCurrentScreen);
  d.drive();
}
