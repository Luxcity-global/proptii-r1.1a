import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedCard } from '../components/animated-card';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const meta = {
  title: 'Components/AnimatedCard',
  component: AnimatedCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An animated card component with various animation effects using Framer Motion.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    animation: {
      control: { type: 'select' },
      options: ['fade', 'slide', 'hover', 'none'],
      description: 'The type of animation to apply',
    },
    delay: {
      control: { type: 'number', min: 0, max: 2, step: 0.1 },
      description: 'Animation delay in seconds',
    },
    duration: {
      control: { type: 'number', min: 0.1, max: 2, step: 0.1 },
      description: 'Animation duration in seconds',
    },
    hover: {
      control: { type: 'boolean' },
      description: 'Whether to enable hover animations',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof AnimatedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FadeAnimation: Story = {
  args: {
    animation: 'fade',
    children: (
      <>
        <CardHeader>
          <CardTitle>Fade Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card fades in when it appears.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const SlideAnimation: Story = {
  args: {
    animation: 'slide',
    children: (
      <>
        <CardHeader>
          <CardTitle>Slide Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card slides up from the bottom.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const HoverAnimation: Story = {
  args: {
    animation: 'hover',
    hover: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Hover Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card lifts up on hover.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const NoAnimation: Story = {
  args: {
    animation: 'none',
    children: (
      <>
        <CardHeader>
          <CardTitle>No Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has no animation effects.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const WithDelay: Story = {
  args: {
    animation: 'fade',
    delay: 0.5,
    children: (
      <>
        <CardHeader>
          <CardTitle>Delayed Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card animates with a 0.5s delay.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const SlowAnimation: Story = {
  args: {
    animation: 'slide',
    duration: 1.0,
    children: (
      <>
        <CardHeader>
          <CardTitle>Slow Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card animates slowly over 1 second.</p>
          <Button className="mt-4">Action</Button>
        </CardContent>
      </>
    ),
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
      <AnimatedCard animation="fade" delay={0}>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Fade animation with no delay.</p>
        </CardContent>
      </AnimatedCard>
      
      <AnimatedCard animation="slide" delay={0.2}>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Slide animation with 0.2s delay.</p>
        </CardContent>
      </AnimatedCard>
      
      <AnimatedCard animation="hover" delay={0.4} hover={true}>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Hover animation with 0.4s delay.</p>
        </CardContent>
      </AnimatedCard>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

