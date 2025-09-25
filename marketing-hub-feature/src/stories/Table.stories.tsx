import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatusBadge } from '../components/status-badge';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A table component for displaying structured data in rows and columns.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">John Doe</TableCell>
          <TableCell><StatusBadge status="active">Active</StatusBadge></TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>
            <Button variant="outline" size="sm">Edit</Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Jane Smith</TableCell>
          <TableCell><StatusBadge status="inactive">Inactive</StatusBadge></TableCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>
            <Button variant="outline" size="sm">Edit</Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Bob Johnson</TableCell>
          <TableCell><StatusBadge status="pending">Pending</StatusBadge></TableCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>
            <Button variant="outline" size="sm">Edit</Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const CampaignsTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Impressions</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>CTR</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Summer Sale 2024</TableCell>
          <TableCell><StatusBadge status="active">Active</StatusBadge></TableCell>
          <TableCell>$5,000</TableCell>
          <TableCell>125,430</TableCell>
          <TableCell>3,247</TableCell>
          <TableCell>2.59%</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Black Friday Campaign</TableCell>
          <TableCell><StatusBadge status="completed">Completed</StatusBadge></TableCell>
          <TableCell>$10,000</TableCell>
          <TableCell>250,890</TableCell>
          <TableCell>8,456</TableCell>
          <TableCell>3.37%</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">View</Button>
              <Button variant="outline" size="sm">Duplicate</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Holiday Special</TableCell>
          <TableCell><StatusBadge status="pending">Pending</StatusBadge></TableCell>
          <TableCell>$7,500</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">Launch</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">New Year Promotion</TableCell>
          <TableCell><StatusBadge status="error">Error</StatusBadge></TableCell>
          <TableCell>$3,000</TableCell>
          <TableCell>45,230</TableCell>
          <TableCell>234</TableCell>
          <TableCell>0.52%</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Fix</Button>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const ContentTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Content Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">10 Tips for Real Estate Marketing</TableCell>
          <TableCell>Blog Post</TableCell>
          <TableCell><StatusBadge status="active">Published</StatusBadge></TableCell>
          <TableCell>2024-01-15</TableCell>
          <TableCell>1,234</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Luxury Property Showcase</TableCell>
          <TableCell>Video</TableCell>
          <TableCell><StatusBadge status="pending">Draft</StatusBadge></TableCell>
          <TableCell>2024-01-20</TableCell>
          <TableCell>0</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">Publish</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Market Trends Report</TableCell>
          <TableCell>Report</TableCell>
          <TableCell><StatusBadge status="completed">Archived</StatusBadge></TableCell>
          <TableCell>2024-01-10</TableCell>
          <TableCell>856</TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">View</Button>
              <Button variant="outline" size="sm">Download</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const EmptyTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
            No data available
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

