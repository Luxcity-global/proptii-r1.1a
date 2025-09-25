import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from '../components/status-badge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A status badge component for displaying different states and statuses throughout the application.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['active', 'inactive', 'pending', 'completed', 'error', 'warning'],
      description: 'The status type that determines the visual appearance',
    },
    children: {
      control: { type: 'text' },
      description: 'The text content of the badge',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    status: 'active',
    children: 'Active',
  },
};

export const Inactive: Story = {
  args: {
    status: 'inactive',
    children: 'Inactive',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
    children: 'Pending',
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
    children: 'Completed',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    children: 'Error',
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    children: 'Warning',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <StatusBadge status="active">Active</StatusBadge>
      <StatusBadge status="inactive">Inactive</StatusBadge>
      <StatusBadge status="pending">Pending</StatusBadge>
      <StatusBadge status="completed">Completed</StatusBadge>
      <StatusBadge status="error">Error</StatusBadge>
      <StatusBadge status="warning">Warning</StatusBadge>
    </div>
  ),
};

export const LongText: Story = {
  args: {
    status: 'active',
    children: 'This is a longer status message',
  },
};

export const CustomClass: Story = {
  args: {
    status: 'active',
    children: 'Custom Styled',
    className: 'text-lg font-bold',
  },
};

