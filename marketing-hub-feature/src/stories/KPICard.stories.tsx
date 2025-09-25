import type { Meta, StoryObj } from '@storybook/react-vite';
import { KPICard } from '../components/kpi-card';
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, MousePointer } from 'lucide-react';

const meta = {
  title: 'Components/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A KPI (Key Performance Indicator) card component for displaying metrics and analytics data.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'The title of the KPI',
    },
    value: {
      control: { type: 'text' },
      description: 'The main value to display',
    },
    change: {
      control: { type: 'text' },
      description: 'The change percentage or amount',
    },
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'neutral'],
      description: 'The trend direction',
    },
    icon: {
      control: false,
      description: 'The icon component to display',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    trend: 'up',
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const TotalUsers: Story = {
  args: {
    title: 'Total Users',
    value: '2,350',
    change: '+180.1%',
    trend: 'up',
    icon: <Users className="h-4 w-4" />,
  },
};

export const Impressions: Story = {
  args: {
    title: 'Impressions',
    value: '12,234',
    change: '+19%',
    trend: 'up',
    icon: <Eye className="h-4 w-4" />,
  },
};

export const Clicks: Story = {
  args: {
    title: 'Clicks',
    value: '573',
    change: '+201',
    trend: 'up',
    icon: <MousePointer className="h-4 w-4" />,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: 'Bounce Rate',
    value: '24.5%',
    change: '-4.3%',
    trend: 'down',
    icon: <TrendingDown className="h-4 w-4" />,
  },
};

export const NeutralTrend: Story = {
  args: {
    title: 'Conversion Rate',
    value: '3.2%',
    change: '0%',
    trend: 'neutral',
    icon: <TrendingUp className="h-4 w-4" />,
  },
};

export const LargeValue: Story = {
  args: {
    title: 'Total Campaigns',
    value: '1,234,567',
    change: '+12.5%',
    trend: 'up',
    icon: <TrendingUp className="h-4 w-4" />,
  },
};

export const AllKPIs: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
      <KPICard
        title="Total Revenue"
        value="$45,231.89"
        change="+20.1%"
        trend="up"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KPICard
        title="Total Users"
        value="2,350"
        change="+180.1%"
        trend="up"
        icon={<Users className="h-4 w-4" />}
      />
      <KPICard
        title="Impressions"
        value="12,234"
        change="+19%"
        trend="up"
        icon={<Eye className="h-4 w-4" />}
      />
      <KPICard
        title="Clicks"
        value="573"
        change="+201"
        trend="up"
        icon={<MousePointer className="h-4 w-4" />}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
