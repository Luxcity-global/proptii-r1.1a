import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './homeownerTours.css';

type HomeownerNavScreen = 'dashboard' | 'projects';

const STEPS: Array<{
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}> = [
  {
    element: '[data-demo-homeowner-projects="1"]',
    title: 'Start from Dashboard',
    description: 'Navigate to Projects to track home improvements. Click "Projects" in the sidebar.',
    side: 'right',
    align: 'start',
  },
  {
    element: '[data-demo-homeowner-new-project="1"]',
    title: 'Create Project',
    description: 'Click New Project to add a home improvement task. Enter name, category (renovation, repair, improvement), budget, target date, and contractor details.',
    side: 'bottom',
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
          if (index === 0) setCurrentScreen('projects');
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

export function createCreateProjectTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
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

export function startCreateProjectTour(setCurrentScreen: (screen: HomeownerNavScreen) => void) {
  const d = createCreateProjectTour(setCurrentScreen);
  d.drive();
}
