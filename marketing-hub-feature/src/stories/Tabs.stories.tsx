import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A tabs component for organizing content into multiple panels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The default active tab',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the tabs',
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Make changes to your account here. Click save when you're done.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Change your password here. After saving, you'll be logged out.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View your campaign overview and key metrics.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Detailed analytics and performance data.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Generate and download reports.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const MarketingTabs: Story = {
  render: () => (
    <Tabs defaultValue="campaigns" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="campaigns">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Create and manage your marketing campaigns.</p>
            <ul className="mt-4 space-y-2">
              <li>• Social Media Campaigns</li>
              <li>• Email Marketing</li>
              <li>• Content Marketing</li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="content">
        <Card>
          <CardHeader>
            <CardTitle>Content Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Generate and manage your marketing content.</p>
            <ul className="mt-4 space-y-2">
              <li>• Blog Posts</li>
              <li>• Social Media Posts</li>
              <li>• Email Templates</li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="assets">
        <Card>
          <CardHeader>
            <CardTitle>Asset Library</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your marketing assets and media files.</p>
            <ul className="mt-4 space-y-2">
              <li>• Images</li>
              <li>• Videos</li>
              <li>• Documents</li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Track and analyze your marketing performance.</p>
            <ul className="mt-4 space-y-2">
              <li>• Campaign Performance</li>
              <li>• Engagement Metrics</li>
              <li>• ROI Analysis</li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="profile" orientation="vertical" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your profile information and preferences.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Configure your application settings.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="billing" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your billing and subscription.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

